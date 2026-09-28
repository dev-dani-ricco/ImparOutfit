import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, PanResponder, StyleSheet, Text, View } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { useAssets } from 'expo-asset';
import { File } from 'expo-file-system';
import * as THREE from 'three';
import { GLTFLoader, SkeletonUtils } from 'three-stdlib';
import { getAvatarParameters } from '../avatar/avatarProfile';
import { colors } from '../theme/colors';

const AVATAR_MODEL = require('../../assets/models/impar-human-cc0.glb');
const MORPH_NAMES = [
  'Bust', 'Waist', 'Hips', 'Height', 'Shoulders', 'Torso', 'Thighs',
  'HeadWidth', 'Jaw', 'Chin', 'FaceDepth',
];

function gaussian(value, center, width) {
  return Math.exp(-Math.pow((value - center) / width, 2));
}

function createParametricMorphs(geometry) {
  const position = geometry.attributes.position;
  if (!position?.count) return;

  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  const bodyHeight = Math.max(max.y - min.y, 0.001);
  const bodyWidth = Math.max(max.x - min.x, 0.001);
  const bodyDepth = Math.max(max.z - min.z, 0.001);

  const targets = MORPH_NAMES.map((name) => {
    const deltas = new Float32Array(position.count * 3);

    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index);
      const y = position.getY(index);
      const z = position.getZ(index);
      const ny = (y - min.y) / bodyHeight;
      const nx = x / bodyWidth;
      const nz = z / bodyDepth;

      let dx = 0;
      let dy = 0;
      let dz = 0;

      if (name === 'Bust') {
        const w = gaussian(ny, 0.68, 0.08);
        dx = x * w * 0.22;
        dz = z * w * 0.28;
      } else if (name === 'Waist') {
        const w = gaussian(ny, 0.55, 0.075);
        dx = x * w * 0.24;
        dz = z * w * 0.2;
      } else if (name === 'Hips') {
        const w = gaussian(ny, 0.43, 0.09);
        dx = x * w * 0.27;
        dz = z * w * 0.2;
      } else if (name === 'Height') {
        dy = (y - min.y) * 0.11;
      } else if (name === 'Shoulders') {
        const w = gaussian(ny, 0.73, 0.055);
        dx = x * w * 0.28;
      } else if (name === 'Torso') {
        const w = gaussian(ny, 0.61, 0.11);
        dx = x * w * 0.18;
        dz = z * w * 0.18;
      } else if (name === 'Thighs') {
        const w = gaussian(ny, 0.31, 0.09);
        dx = x * w * 0.2;
        dz = z * w * 0.13;
      } else if (name === 'HeadWidth') {
        const w = Math.max(0, Math.min(1, (ny - 0.82) / 0.08));
        dx = x * w * 0.22;
      } else if (name === 'Jaw') {
        const w = gaussian(ny, 0.84, 0.045) * Math.max(0.3, Math.min(1, Math.abs(nx) * 5));
        dx = x * w * 0.22;
      } else if (name === 'Chin') {
        const w = gaussian(ny, 0.805, 0.025) * Math.max(0, 1 - Math.abs(nx) * 8);
        dy = -bodyHeight * w * 0.013;
        dz = Math.sign(z || 1) * bodyDepth * w * 0.012;
      } else if (name === 'FaceDepth') {
        const w = gaussian(ny, 0.89, 0.06) * Math.max(0, 1 - Math.abs(nx) * 5);
        dz = z * w * 0.24 + Math.sign(nz || 1) * bodyDepth * w * 0.006;
      }

      deltas[index * 3] = dx;
      deltas[index * 3 + 1] = dy;
      deltas[index * 3 + 2] = dz;
    }

    const attribute = new THREE.Float32BufferAttribute(deltas, 3);
    attribute.name = name;
    return attribute;
  });

  geometry.morphAttributes.position = targets;
  geometry.morphTargetsRelative = true;
}

function useLocalGltf(modelUri) {
  const [gltf, setGltf] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!modelUri) return undefined;

    setGltf(null);
    setError(null);

    (async () => {
      try {
        const file = new File(modelUri);
        const buffer = await file.arrayBuffer();
        if (cancelled) return;

        const loader = new GLTFLoader();
        loader.parse(
          buffer,
          '',
          (loaded) => !cancelled && setGltf(loaded),
          (loadError) => !cancelled && setError(loadError instanceof Error ? loadError : new Error(String(loadError))),
        );
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError : new Error(String(loadError)));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [modelUri]);

  return { gltf, error };
}

function prepareModel(source, skinTone) {
  const avatar = SkeletonUtils.clone(source);

  avatar.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    object.frustumCulled = false;

    if (object.geometry?.attributes?.position) {
      object.geometry = object.geometry.clone();
      createParametricMorphs(object.geometry);
      object.updateMorphTargets?.();
    }

    const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
    const materials = sourceMaterials.filter(Boolean).map((material) => {
      const next = material.clone();
      next.color?.set(skinTone);
      next.roughness = 0.58;
      next.metalness = 0;
      if ('envMapIntensity' in next) next.envMapIntensity = 0.35;
      next.needsUpdate = true;
      return next;
    });
    object.material = Array.isArray(object.material) ? materials : materials[0];
  });

  avatar.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(avatar);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());

  return { avatar, center, fitScale: 4.1 / Math.max(size.y, 0.001) };
}

function HairMaterial({ color }) {
  return <meshStandardMaterial color={color} roughness={0.72} metalness={0.02} />;
}

function HairModel({ style, color }) {
  const curls = [
    [-0.3, 0.23, 0], [-0.35, 0.05, 0], [-0.33, -0.13, -0.01],
    [0.3, 0.23, 0], [0.35, 0.05, 0], [0.33, -0.13, -0.01],
    [-0.22, 0.4, -0.03], [0, 0.48, -0.07], [0.22, 0.4, -0.03],
  ];

  return (
    <group position={[0, 1.72, -0.05]}>
      <mesh position={[0, 0.13, -0.1]} scale={[0.38, 0.43, 0.34]} castShadow>
        <sphereGeometry args={[1, 32, 24]} />
        <HairMaterial color={color} />
      </mesh>

      {style === 'short' ? (
        <>
          <mesh position={[-0.26, -0.04, 0]} scale={[0.12, 0.24, 0.15]} castShadow><sphereGeometry args={[1, 22, 16]} /><HairMaterial color={color} /></mesh>
          <mesh position={[0.26, -0.04, 0]} scale={[0.12, 0.24, 0.15]} castShadow><sphereGeometry args={[1, 22, 16]} /><HairMaterial color={color} /></mesh>
        </>
      ) : null}

      {style === 'bob' ? (
        <>
          <mesh position={[-0.29, -0.19, -0.06]} scale={[0.15, 0.42, 0.16]} castShadow><sphereGeometry args={[1, 24, 18]} /><HairMaterial color={color} /></mesh>
          <mesh position={[0.29, -0.19, -0.06]} scale={[0.15, 0.42, 0.16]} castShadow><sphereGeometry args={[1, 24, 18]} /><HairMaterial color={color} /></mesh>
        </>
      ) : null}

      {['long', 'waves'].includes(style) ? (
        <>
          <mesh position={[-0.27, -0.46, -0.12]} scale={[0.17, 0.74, 0.18]} castShadow><sphereGeometry args={[1, 28, 20]} /><HairMaterial color={color} /></mesh>
          <mesh position={[0.27, -0.46, -0.12]} scale={[0.17, 0.74, 0.18]} castShadow><sphereGeometry args={[1, 28, 20]} /><HairMaterial color={color} /></mesh>
          {style === 'waves' ? curls.slice(0, 6).map((position, index) => (
            <mesh key={index} position={[position[0], position[1] - 0.45, position[2]]} scale={[0.14, 0.18, 0.14]} castShadow>
              <sphereGeometry args={[1, 18, 14]} /><HairMaterial color={color} />
            </mesh>
          )) : null}
        </>
      ) : null}

      {style === 'curls' ? curls.map((position, index) => (
        <mesh key={index} position={position} scale={[0.2, 0.2, 0.17]} castShadow>
          <sphereGeometry args={[1, 20, 16]} /><HairMaterial color={color} />
        </mesh>
      )) : null}

      {style === 'bun' ? (
        <mesh position={[0, 0.56, -0.12]} scale={[0.23, 0.22, 0.21]} castShadow>
          <sphereGeometry args={[1, 26, 20]} /><HairMaterial color={color} />
        </mesh>
      ) : null}

      {style === 'ponytail' ? (
        <mesh position={[0, -0.18, -0.36]} rotation={[0.25, 0, 0]} scale={[0.14, 0.58, 0.14]} castShadow>
          <capsuleGeometry args={[1, 2.2, 8, 18]} /><HairMaterial color={color} />
        </mesh>
      ) : null}
    </group>
  );
}

function ProfessionalAvatar({ parameters, angle, gltf }) {
  const prepared = useMemo(
    () => prepareModel(gltf.scene, parameters.appearance.skinTone),
    [gltf.scene, parameters.appearance.skinTone],
  );

  useEffect(() => {
    const weights = {
      Bust: parameters.body.bust,
      Waist: parameters.body.waist,
      Hips: parameters.body.hips,
      Height: parameters.body.height,
      Shoulders: parameters.body.shoulders,
      Torso: parameters.body.torso,
      Thighs: parameters.body.thighs,
      HeadWidth: parameters.face.headWidth,
      Jaw: parameters.face.jaw,
      Chin: parameters.face.chin,
      FaceDepth: parameters.face.faceDepth,
    };

    prepared.avatar.traverse((object) => {
      if (!object.morphTargetDictionary || !object.morphTargetInfluences) return;
      Object.entries(weights).forEach(([name, value]) => {
        const index = object.morphTargetDictionary[name];
        if (index !== undefined) object.morphTargetInfluences[index] = value;
      });
    });
  }, [prepared.avatar, parameters]);

  return (
    <group rotation={[0, THREE.MathUtils.degToRad(angle), 0]}>
      <primitive
        object={prepared.avatar}
        scale={prepared.fitScale}
        position={[
          -prepared.center.x * prepared.fitScale,
          -prepared.center.y * prepared.fitScale,
          -prepared.center.z * prepared.fitScale,
        ]}
      />
      <HairModel style={parameters.appearance.hairStyle} color={parameters.appearance.hairColor} />
    </group>
  );
}

function StudioScene({ parameters, angle, gltf }) {
  return (
    <>
      <color attach="background" args={['#D9D0C8']} />
      <hemisphereLight intensity={1.4} color="#FFF9F2" groundColor="#7F746C" />
      <directionalLight position={[-3, 5, 5]} intensity={3.2} color="#FFF1E2" castShadow />
      <directionalLight position={[4, 2, -3]} intensity={2.1} color="#E7D9EC" />
      <pointLight position={[0, -1, 4]} intensity={0.9} color="#F7E3D5" />
      {gltf ? <ProfessionalAvatar parameters={parameters} angle={angle} gltf={gltf} /> : null}
      <mesh position={[0, -2.17, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.05, 64]} />
        <meshStandardMaterial color="#B8ACA1" roughness={0.94} />
      </mesh>
    </>
  );
}

function imageSource(value) {
  if (!value) return null;
  return typeof value === 'string' ? { uri: value } : value;
}

export default function BodyAvatar3D({ profile }) {
  const parameters = useMemo(() => getAvatarParameters(profile), [profile]);
  const [angle, setAngle] = useState(0);
  const angleRef = useRef(0);
  const dragStartAngle = useRef(0);
  const lastTapAt = useRef(0);
  const [modelAssets, modelAssetError] = useAssets([AVATAR_MODEL]);
  const modelUri = modelAssets?.[0]?.localUri || modelAssets?.[0]?.uri;
  const { gltf, error: modelLoadError } = useLocalGltf(modelUri);
  const modelError = modelAssetError || modelLoadError;
  const source = imageSource(profile.profilePhoto || profile.profilePhotoUrl || profile.avatar_url);

  const setRotation = (value) => {
    const normalized = ((value + 180) % 360 + 360) % 360 - 180;
    angleRef.current = normalized;
    setAngle(normalized);
  };

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 6 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.15,
    onPanResponderGrant: () => {
      dragStartAngle.current = angleRef.current;
    },
    onPanResponderMove: (_, gesture) => {
      setRotation(dragStartAngle.current + gesture.dx * 0.55);
    },
    onPanResponderTerminationRequest: () => false,
  }), []);

  const handleTouchEnd = () => {
    const now = Date.now();
    if (now - lastTapAt.current < 320) setRotation(0);
    lastTapAt.current = now;
  };

  return (
    <View style={styles.wrapper}>
      <View
        style={styles.stage}
        accessible
        accessibilityLabel="Avatar 3D paramétrico. Arraste horizontalmente para girar e toque duas vezes para centralizar."
        onTouchEnd={handleTouchEnd}
        {...panResponder.panHandlers}
      >
        <Canvas style={styles.canvas} camera={{ position: [0, 0, 8.2], fov: 37 }} shadows="basic" dpr={1.35} gl={{ antialias: true, alpha: false }}>
          <StudioScene parameters={parameters} angle={angle} gltf={gltf} />
        </Canvas>

        <View style={styles.studioLabel} pointerEvents="none">
          <Text style={styles.studioOverline}>IMPAR DIGITAL ATELIER</Text>
          <Text style={styles.studioTitle}>AVATAR PARAMÉTRICO V2</Text>
          <Text style={styles.studioMeta}>CORPO + ROSTO + CABELO + TOM DE PELE</Text>
        </View>

        <View style={styles.liveBadge} pointerEvents="none">
          <View style={[styles.liveDot, modelError && styles.errorDot]} />
          <Text style={styles.liveText}>{modelError ? 'FALHA NO MODELO' : gltf ? 'MALHA ATIVA' : 'CARREGANDO 3D'}</Text>
        </View>

        {source ? (
          <View style={styles.identityCard} pointerEvents="none">
            <Image source={source} style={styles.identityPhoto} />
            <View>
              <Text style={styles.identityLabel}>REFERÊNCIA VISUAL</Text>
              <Text style={styles.identityStatus}>FOTO PRIVADA VINCULADA</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.heightBadge} pointerEvents="none">
          <Text style={styles.heightValue}>{profile.height || 168}</Text>
          <Text style={styles.heightUnit}>CM DECLARADOS</Text>
        </View>
      </View>

      <View style={styles.gestureGuide}>
        <Text style={styles.gestureIcon}>↔</Text>
        <View style={styles.gestureCopy}>
          <Text style={styles.gestureTitle}>GIRE PARA INSPECIONAR O AVATAR</Text>
          <Text style={styles.gestureHint}>Duplo toque centraliza · ajustes aparecem em tempo real</Text>
        </View>
        <Text style={styles.gestureAngle}>{Math.round(angle)}°</Text>
      </View>

      <View style={styles.measurements}>
        <Measurement label="BUSTO" value={profile.bust || 94} />
        <Measurement label="CINTURA" value={profile.waist || 76} />
        <Measurement label="QUADRIL" value={profile.hips || 104} last />
      </View>
    </View>
  );
}

function Measurement({ label, value, last }) {
  return (
    <View style={[styles.measurement, last && styles.measurementLast]}>
      <Text style={styles.measurementValue}>{value}</Text>
      <Text style={styles.measurementLabel}>{label} · CM</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderWidth: 1, borderColor: '#B8AA9E', backgroundColor: colors.surface },
  stage: { height: 470, overflow: 'hidden', backgroundColor: '#D9D0C8' },
  canvas: { flex: 1 },
  studioLabel: { position: 'absolute', left: 14, top: 14 },
  studioOverline: { color: 'rgba(46,35,31,0.55)', fontSize: 6, fontWeight: '900', letterSpacing: 1.4 },
  studioTitle: { color: '#2C211E', fontFamily: 'serif', fontSize: 22, letterSpacing: 0.4, marginTop: 1 },
  studioMeta: { color: colors.accent, fontSize: 5.5, fontWeight: '900', letterSpacing: 0.75, marginTop: 3 },
  liveBadge: { position: 'absolute', right: 12, top: 14, flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: 'rgba(116,25,52,0.32)', backgroundColor: 'rgba(244,236,228,0.82)', paddingHorizontal: 8, paddingVertical: 5 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent },
  errorDot: { backgroundColor: '#B3261E' },
  liveText: { color: colors.accent, fontSize: 6, fontWeight: '900', letterSpacing: 0.9 },
  identityCard: { position: 'absolute', right: 12, bottom: 13, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: 'rgba(66,48,43,0.22)', backgroundColor: 'rgba(248,243,237,0.88)', padding: 6 },
  identityPhoto: { width: 31, height: 31, borderRadius: 16, borderWidth: 1, borderColor: '#FFFFFF' },
  identityLabel: { color: 'rgba(46,35,31,0.55)', fontSize: 5, fontWeight: '900', letterSpacing: 0.65 },
  identityStatus: { color: colors.accent, fontSize: 6, fontWeight: '900', letterSpacing: 0.55, marginTop: 2 },
  heightBadge: { position: 'absolute', left: 13, bottom: 13, borderLeftWidth: 2, borderLeftColor: colors.accent, paddingLeft: 7 },
  heightValue: { color: '#2C211E', fontFamily: 'serif', fontSize: 20, lineHeight: 21 },
  heightUnit: { color: 'rgba(46,35,31,0.58)', fontSize: 5.5, fontWeight: '900', letterSpacing: 0.8 },
  gestureGuide: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: '#C9BDB2', backgroundColor: '#F5F0EA', paddingHorizontal: 14 },
  gestureIcon: { color: colors.accent, fontSize: 21, marginRight: 9 },
  gestureCopy: { flex: 1 },
  gestureTitle: { color: colors.accent, fontSize: 6.5, fontWeight: '900', letterSpacing: 0.85 },
  gestureHint: { color: colors.muted, fontSize: 7, marginTop: 3 },
  gestureAngle: { color: '#2C211E', fontFamily: 'serif', fontSize: 16 },
  measurements: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#C9BDB2', backgroundColor: '#FCF9F5' },
  measurement: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRightWidth: 1, borderRightColor: '#DED5CC' },
  measurementLast: { borderRightWidth: 0 },
  measurementValue: { color: '#2C211E', fontFamily: 'serif', fontSize: 20 },
  measurementLabel: { color: colors.muted, fontSize: 6, fontWeight: '900', letterSpacing: 0.8, marginTop: 2 },
});
