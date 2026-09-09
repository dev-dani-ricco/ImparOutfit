import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Image, PanResponder, StyleSheet, Text, View } from 'react-native';
import { Canvas, useLoader } from '@react-three/fiber/native';
import { useAssets } from 'expo-asset';
import * as THREE from 'three';
import { GLTFLoader, SkeletonUtils } from 'three-stdlib';
import { colors } from '../theme/colors';

const AVATAR_MODEL = require('../../assets/models/michelle.glb');
const MORPH_NAMES = ['Bust', 'Waist', 'Hips', 'Height'];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const toNumber = (value, fallback) => {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

function getProportions(profile) {
  const bust = toNumber(profile.bust, 94);
  const waist = toNumber(profile.waist, 76);
  const hips = toNumber(profile.hips, 104);
  const height = toNumber(profile.height, 168);
  const shape = profile.bodyShape || 'Ampulheta';
  const bias = {
    Ampulheta: { bust: 0.08, waist: -0.14, hips: 0.09 },
    Triângulo: { bust: -0.08, waist: 0, hips: 0.2 },
    'Triângulo invertido': { bust: 0.2, waist: 0, hips: -0.08 },
    Retângulo: { bust: 0.02, waist: 0.16, hips: 0 },
    Oval: { bust: 0.11, waist: 0.3, hips: 0.08 },
  }[shape] || { bust: 0, waist: 0, hips: 0 };

  return {
    bust,
    waist,
    hips,
    height,
    weights: {
      Bust: clamp((bust - 94) / 38 + bias.bust, -0.55, 1),
      Waist: clamp((waist - 76) / 38 + bias.waist, -0.55, 1),
      Hips: clamp((hips - 104) / 42 + bias.hips, -0.55, 1),
      Height: clamp((height - 168) / 32, -0.55, 0.75),
    },
  };
}

function gaussian(value, center, width) {
  return Math.exp(-Math.pow((value - center) / width, 2));
}

function createBodyMorphs(geometry) {
  const position = geometry.attributes.position;
  if (!position || position.count === 0) return;

  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  const bodyHeight = Math.max(max.y - min.y, 0.001);
  const targets = MORPH_NAMES.map((name) => {
    const deltas = new Float32Array(position.count * 3);

    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index);
      const y = position.getY(index);
      const z = position.getZ(index);
      const normalizedY = (y - min.y) / bodyHeight;
      let radialWeight = 0;
      let radialGain = 0;
      let verticalDelta = 0;

      if (name === 'Bust') {
        radialWeight = gaussian(normalizedY, 0.68, 0.085);
        radialGain = 0.24;
      } else if (name === 'Waist') {
        radialWeight = gaussian(normalizedY, 0.55, 0.075);
        radialGain = 0.22;
      } else if (name === 'Hips') {
        radialWeight = gaussian(normalizedY, 0.43, 0.09);
        radialGain = 0.25;
      } else if (name === 'Height') {
        verticalDelta = (y - min.y) * 0.12;
      }

      deltas[index * 3] = x * radialWeight * radialGain;
      deltas[index * 3 + 1] = verticalDelta;
      deltas[index * 3 + 2] = z * radialWeight * radialGain;
    }

    const attribute = new THREE.Float32BufferAttribute(deltas, 3);
    attribute.name = name;
    return attribute;
  });

  geometry.morphAttributes.position = targets;
  geometry.morphTargetsRelative = true;
}

function prepareModel(source) {
  const avatar = SkeletonUtils.clone(source);

  avatar.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    object.frustumCulled = false;

    if (object.isSkinnedMesh && object.geometry?.attributes?.position) {
      object.geometry = object.geometry.clone();
      createBodyMorphs(object.geometry);
      object.updateMorphTargets();
    }

    const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
    const neutralMaterials = sourceMaterials.filter(Boolean).map((material) => {
      const neutral = material.clone();
      neutral.color.set('#DDD5CF');
      neutral.roughness = 0.82;
      neutral.metalness = 0;
      neutral.needsUpdate = true;
      return neutral;
    });
    object.material = Array.isArray(object.material) ? neutralMaterials : neutralMaterials[0];
  });

  avatar.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(avatar);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());

  return { avatar, center, fitScale: 4.15 / Math.max(size.y, 0.001) };
}

function HairModel({ style }) {
  const color = '#39251F';
  const curls = [
    [-0.31, 0.2, 0], [-0.36, 0.02, 0], [-0.34, -0.18, -0.02],
    [0.31, 0.2, 0], [0.36, 0.02, 0], [0.34, -0.18, -0.02],
    [-0.22, 0.39, -0.04], [0, 0.47, -0.08], [0.22, 0.39, -0.04],
  ];

  return (
    <group position={[0, 1.72, -0.05]}>
      <mesh position={[0, 0.13, -0.1]} scale={[0.38, 0.43, 0.34]} castShadow>
        <sphereGeometry args={[1, 28, 20]} />
        <meshStandardMaterial color={color} roughness={0.78} />
      </mesh>

      {style === 'Curto' ? (
        <>
          <mesh position={[-0.29, -0.08, -0.03]} scale={[0.13, 0.3, 0.17]} castShadow><sphereGeometry args={[1, 20, 14]} /><meshStandardMaterial color={color} roughness={0.78} /></mesh>
          <mesh position={[0.29, -0.08, -0.03]} scale={[0.13, 0.3, 0.17]} castShadow><sphereGeometry args={[1, 20, 14]} /><meshStandardMaterial color={color} roughness={0.78} /></mesh>
        </>
      ) : null}

      {style === 'Longo' ? (
        <>
          <mesh position={[-0.27, -0.46, -0.12]} scale={[0.17, 0.72, 0.18]} castShadow><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
          <mesh position={[0.27, -0.46, -0.12]} scale={[0.17, 0.72, 0.18]} castShadow><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
        </>
      ) : null}

      {style === 'Cacheado' ? curls.map((position, index) => (
        <mesh key={index} position={position} scale={[0.2, 0.2, 0.17]} castShadow>
          <sphereGeometry args={[1, 18, 14]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      )) : null}

      {style === 'Coque' ? (
        <mesh position={[0, 0.55, -0.12]} scale={[0.23, 0.22, 0.21]} castShadow>
          <sphereGeometry args={[1, 24, 18]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      ) : null}
    </group>
  );
}

function ProfessionalAvatar({ proportions, angle, modelUri, hairStyle }) {
  const gltf = useLoader(GLTFLoader, modelUri);
  const prepared = useMemo(() => prepareModel(gltf.scene), [gltf.scene]);

  useEffect(() => {
    prepared.avatar.traverse((object) => {
      if (!object.isSkinnedMesh || !object.morphTargetDictionary) return;
      MORPH_NAMES.forEach((name) => {
        const index = object.morphTargetDictionary[name];
        if (index !== undefined) object.morphTargetInfluences[index] = proportions.weights[name];
      });
    });
  }, [prepared.avatar, proportions]);

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
      <HairModel style={hairStyle} />
    </group>
  );
}

function StudioScene({ proportions, angle, modelUri, hairStyle }) {
  return (
    <>
      <color attach="background" args={['#DED4C9']} />
      <ambientLight intensity={1.7} color="#FFF4EA" />
      <directionalLight position={[-3, 5, 5]} intensity={3.6} color="#FFF0DB" castShadow />
      <directionalLight position={[4, 2, -3]} intensity={2.6} color="#D8B7C8" />
      <pointLight position={[0, -1, 4]} intensity={1.2} color="#F5DDC7" />
      {modelUri ? (
        <Suspense fallback={null}>
          <ProfessionalAvatar proportions={proportions} angle={angle} modelUri={modelUri} hairStyle={hairStyle} />
        </Suspense>
      ) : null}
      <mesh position={[0, -2.17, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.05, 64]} />
        <meshStandardMaterial color="#BDB0A3" roughness={0.94} />
      </mesh>
    </>
  );
}

function imageSource(value) {
  if (!value) return null;
  return typeof value === 'string' ? { uri: value } : value;
}

export default function BodyAvatar3D({ profile }) {
  const proportions = useMemo(() => getProportions(profile), [profile]);
  const [angle, setAngle] = useState(0);
  const angleRef = useRef(0);
  const dragStartAngle = useRef(0);
  const lastTapAt = useRef(0);
  const [modelAssets, modelAssetError] = useAssets([AVATAR_MODEL]);
  const modelUri = modelAssets?.[0]?.localUri || modelAssets?.[0]?.uri;
  const hairStyle = profile.hairStyle || 'Coque';
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
        accessibilityLabel="Avatar 3D. Arraste horizontalmente para girar e toque duas vezes para centralizar."
        onTouchEnd={handleTouchEnd}
        {...panResponder.panHandlers}
      >
        <Canvas style={styles.canvas} camera={{ position: [0, 0, 8.2], fov: 37 }} shadows="basic" dpr={1.5} gl={{ antialias: true, alpha: false }}>
          <StudioScene proportions={proportions} angle={angle} modelUri={modelUri} hairStyle={hairStyle} />
        </Canvas>

        <View style={styles.studioLabel} pointerEvents="none">
          <Text style={styles.studioOverline}>IMPAR DIGITAL ATELIER</Text>
          <Text style={styles.studioTitle}>HUMAN 3D</Text>
        </View>
        <View style={styles.liveBadge} pointerEvents="none">
          <View style={[styles.liveDot, modelAssetError && styles.errorDot]} />
          <Text style={styles.liveText}>{modelAssetError ? 'FALHA NO MODELO' : modelUri ? 'RIG ATIVO' : 'CARREGANDO 3D'}</Text>
        </View>
        {source ? (
          <View style={styles.identityCard} pointerEvents="none">
            <Image source={source} style={styles.identityPhoto} />
            <View>
              <Text style={styles.identityLabel}>REFERÊNCIA FACIAL</Text>
              <Text style={styles.identityStatus}>FOTO VINCULADA</Text>
            </View>
          </View>
        ) : null}
        <View style={styles.heightBadge} pointerEvents="none">
          <Text style={styles.heightValue}>{proportions.height}</Text>
          <Text style={styles.heightUnit}>CM · CORPO PARAMÉTRICO</Text>
        </View>
      </View>

      <View style={styles.gestureGuide}>
        <Text style={styles.gestureIcon}>↔</Text>
        <View style={styles.gestureCopy}>
          <Text style={styles.gestureTitle}>ARRASTE O DEDO PARA GIRAR</Text>
          <Text style={styles.gestureHint}>Toque duas vezes para voltar à frente</Text>
        </View>
        <Text style={styles.gestureAngle}>{Math.round(angle)}°</Text>
      </View>

      <View style={styles.measurements}>
        <Measurement label="BUSTO" value={proportions.bust} />
        <Measurement label="CINTURA" value={proportions.waist} />
        <Measurement label="QUADRIL" value={proportions.hips} last />
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
  stage: { height: 450, overflow: 'hidden', backgroundColor: '#DED4C9' },
  canvas: { flex: 1 },
  studioLabel: { position: 'absolute', left: 14, top: 14 },
  studioOverline: { color: 'rgba(46,35,31,0.55)', fontSize: 6, fontWeight: '900', letterSpacing: 1.4 },
  studioTitle: { color: '#2C211E', fontFamily: 'serif', fontSize: 22, letterSpacing: 0.4, marginTop: 1 },
  liveBadge: { position: 'absolute', right: 12, top: 14, flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: 'rgba(116,25,52,0.32)', backgroundColor: 'rgba(244,236,228,0.75)', paddingHorizontal: 8, paddingVertical: 5 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent },
  errorDot: { backgroundColor: '#B3261E' },
  liveText: { color: colors.accent, fontSize: 6, fontWeight: '900', letterSpacing: 0.9 },
  identityCard: { position: 'absolute', right: 12, bottom: 13, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: 'rgba(66,48,43,0.22)', backgroundColor: 'rgba(248,243,237,0.86)', padding: 6 },
  identityPhoto: { width: 31, height: 31, borderRadius: 16, borderWidth: 1, borderColor: '#FFFFFF' },
  identityLabel: { color: 'rgba(46,35,31,0.55)', fontSize: 5, fontWeight: '900', letterSpacing: 0.65 },
  identityStatus: { color: colors.accent, fontSize: 6, fontWeight: '900', letterSpacing: 0.55, marginTop: 2 },
  heightBadge: { position: 'absolute', left: 13, bottom: 13, borderLeftWidth: 2, borderLeftColor: colors.accent, paddingLeft: 7 },
  heightValue: { color: '#2C211E', fontFamily: 'serif', fontSize: 20, lineHeight: 21 },
  heightUnit: { color: 'rgba(46,35,31,0.58)', fontSize: 5.5, fontWeight: '900', letterSpacing: 0.8 },
  gestureGuide: { minHeight: 55, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: '#C9BDB2', backgroundColor: '#F5F0EA', paddingHorizontal: 14 },
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
