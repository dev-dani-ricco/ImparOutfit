import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { Canvas, useThree } from '@react-three/fiber/native';
import { useAssets } from 'expo-asset';
import { File } from 'expo-file-system';
import * as THREE from 'three';
import { GLTFLoader, SkeletonUtils } from 'three-stdlib';
import { avatarMorphWeights, normalizeAvatarSpec } from '../avatar/avatarSpec.mjs';
import { colors } from '../theme/colors';

const BODY_MODEL = require('../../assets/models/parametric/makehuman-parametric-base.glb');
const HAIR_ASSETS = {
  buzzed: require('../../assets/models/hair/Hair_Buzzed.glb'),
  parted: require('../../assets/models/hair/Hair_SimpleParted.glb'),
  long: require('../../assets/models/hair/Hair_Long.glb'),
  buns: require('../../assets/models/hair/Hair_Buns.glb'),
};
const HAIR_KEYS = ['buzzed', 'parted', 'long', 'buns'];
const HAIR_FIT = {
  buzzed: { scale: 0.93, position: [0, 0, 0.075] },
  parted: { scale: 0.93, position: [0, 0, 0.08] },
  long: { scale: 0.90, position: [0, 0.11, 0.09] },
  buns: { scale: 0.88, position: [0, 0.18, 0.08] },
};
const ALL_ASSETS = [BODY_MODEL, ...HAIR_KEYS.map((key) => HAIR_ASSETS[key])];

function useLocalGltf(uri) {
  const [state, setState] = useState({ gltf: null, error: null });

  useEffect(() => {
    let cancelled = false;
    if (!uri) {
      setState({ gltf: null, error: null });
      return () => {
        cancelled = true;
      };
    }

    setState({ gltf: null, error: null });
    (async () => {
      try {
        const file = new File(uri);
        const buffer = await file.arrayBuffer();
        if (cancelled) return;
        new GLTFLoader().parse(
          buffer,
          '',
          (gltf) => {
            if (!cancelled) setState({ gltf, error: null });
          },
          (error) => {
            if (!cancelled) setState({ gltf: null, error: error instanceof Error ? error : new Error(String(error)) });
          },
        );
      } catch (error) {
        if (!cancelled) setState({ gltf: null, error: error instanceof Error ? error : new Error(String(error)) });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uri]);

  return state;
}

function cloneMaterial(material, color, roughness = 0.72) {
  const next = material?.clone?.() || new THREE.MeshStandardMaterial();
  if (next.color && color) next.color.set(color);
  if ('roughness' in next) next.roughness = roughness;
  if ('metalness' in next) next.metalness = 0;
  next.needsUpdate = true;
  return next;
}

function prepareBody(source, spec) {
  const body = SkeletonUtils.clone(source);
  body.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    object.frustumCulled = false;

    const materials = (Array.isArray(object.material) ? object.material : [object.material]).filter(Boolean);
    const colored = materials.map((material) => {
      const name = String(material.name || object.name || '').toLowerCase();
      if (name.includes('body')) return cloneMaterial(material, spec.appearance.skinTone, 0.76);
      if (name.includes('eyes')) return cloneMaterial(material, spec.appearance.eyeColor, 0.34);
      if (name.includes('teeth')) return cloneMaterial(material, '#F1EEE8', 0.42);
      if (name.includes('tongue')) return cloneMaterial(material, '#A95E5B', 0.7);
      return cloneMaterial(material, null, 0.72);
    });
    object.material = Array.isArray(object.material) ? colored : colored[0];
  });

  const weights = avatarMorphWeights(spec);
  body.traverse((object) => {
    if (!object.isMesh || !object.morphTargetDictionary || !object.morphTargetInfluences) return;
    Object.entries(object.morphTargetDictionary).forEach(([name, index]) => {
      object.morphTargetInfluences[index] = weights[name] ?? 0;
    });
  });

  body.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(body);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  return { body, bounds, size, center };
}

function prepareHair(source, color) {
  if (!source) return null;
  const hair = SkeletonUtils.clone(source);
  hair.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    const mats = (Array.isArray(object.material) ? object.material : [object.material]).filter(Boolean);
    const colored = mats.map((material) => cloneMaterial(material, color, 0.82));
    object.material = Array.isArray(object.material) ? colored : colored[0];
  });
  return hair;
}

function ParametricHuman({ bodyGltf, hairGltf, spec, angle }) {
  const prepared = useMemo(() => prepareBody(bodyGltf.scene, spec), [bodyGltf.scene, spec]);
  const hair = useMemo(() => prepareHair(hairGltf?.scene, spec.appearance.hairColor), [hairGltf?.scene, spec.appearance.hairColor]);

  const baseHeight = Math.max(prepared.size.y, 0.001);
  const displayScale = 4.25 / baseHeight;
  const hairFit = HAIR_FIT[spec.appearance.hairStyle] || HAIR_FIT.buzzed;

  return (
    <group
      rotation={[0, THREE.MathUtils.degToRad(angle), 0]}
      scale={[displayScale, displayScale, displayScale]}
      position={[
        -prepared.center.x * displayScale,
        -prepared.center.y * displayScale,
        -prepared.center.z * displayScale,
      ]}
    >
      <primitive object={prepared.body} />
      {hair ? (
        <primitive
          object={hair}
          scale={[hairFit.scale, hairFit.scale, hairFit.scale]}
          position={hairFit.position}
        />
      ) : null}
    </group>
  );
}

function CameraRig({ focus }) {
  const { camera } = useThree();
  useEffect(() => {
    const face = focus === 'ROSTO' || focus === 'CABELO';
    camera.position.set(0, face ? 1.45 : 0.05, face ? 4.0 : 8.15);
    camera.lookAt(0, face ? 1.45 : 0, 0);
    camera.fov = face ? 31 : 36;
    camera.updateProjectionMatrix();
  }, [camera, focus]);
  return null;
}

function Studio({ bodyGltf, hairGltf, spec, angle, focus }) {
  return (
    <>
      <CameraRig focus={focus} />
      <color attach="background" args={['#E4DDD5']} />
      <ambientLight intensity={1.5} color="#FFF7EF" />
      <hemisphereLight intensity={1.15} color="#FFF3E8" groundColor="#847A72" />
      <directionalLight position={[-3, 5, 5]} intensity={3.1} color="#FFF3E5" castShadow />
      <directionalLight position={[4, 3, -2]} intensity={1.9} color="#E8D9F0" />
      <pointLight position={[0, 1, 4]} intensity={0.65} color="#FFFFFF" />
      <ParametricHuman bodyGltf={bodyGltf} hairGltf={hairGltf} spec={spec} angle={angle} />
      <mesh position={[0, -2.15, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.1, 64]} />
        <meshStandardMaterial color="#BEB3A9" roughness={0.98} />
      </mesh>
    </>
  );
}

export default function ParametricAvatar3D({ profile, spec: providedSpec, compact = false, focus = 'CORPO' }) {
  const spec = useMemo(() => providedSpec || normalizeAvatarSpec(profile), [profile, providedSpec]);
  const [assets, assetError] = useAssets(ALL_ASSETS);
  const bodyUri = assets?.[0]?.localUri || assets?.[0]?.uri;
  const selectedHairIndex = Math.max(0, HAIR_KEYS.indexOf(spec.appearance.hairStyle));
  const hairAsset = assets?.[1 + selectedHairIndex];
  const hairUri = hairAsset?.localUri || hairAsset?.uri;
  const { gltf: bodyGltf, error: bodyError } = useLocalGltf(bodyUri);
  const { gltf: hairGltf, error: hairError } = useLocalGltf(hairUri);
  const [angle, setAngle] = useState(0);
  const angleRef = useRef(0);
  const startAngle = useRef(0);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 5 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderGrant: () => {
      startAngle.current = angleRef.current;
    },
    onPanResponderMove: (_, gesture) => {
      const next = ((startAngle.current + gesture.dx * 0.55 + 180) % 360 + 360) % 360 - 180;
      angleRef.current = next;
      setAngle(next);
    },
  }), []);

  const error = assetError || bodyError || hairError;
  const ready = Boolean(bodyGltf);
  const stageHeight = compact ? 330 : 470;

  return (
    <View style={styles.wrapper}>
      <View
        style={[styles.stage, { height: stageHeight }]}
        accessibilityLabel="Avatar 3D paramétrico. Arraste horizontalmente para girar."
        {...panResponder.panHandlers}
      >
        <Canvas camera={{ position: [0, 0.05, 8.15], fov: 36 }} shadows="basic" dpr={1.4} gl={{ antialias: true, alpha: false }}>
          {bodyGltf ? <Studio bodyGltf={bodyGltf} hairGltf={hairGltf} spec={spec} angle={angle} focus={focus} /> : null}
        </Canvas>

        <View style={styles.heading} pointerEvents="none">
          <Text style={styles.overline}>IMPAR DIGITAL ATELIER</Text>
          <Text style={styles.title}>AVATAR PARAMÉTRICO</Text>
        </View>
        <View style={styles.status} pointerEvents="none">
          <View style={[styles.dot, error && styles.dotError]} />
          <Text style={styles.statusText}>{error ? 'ERRO 3D' : ready ? 'MODELO PROFISSIONAL ATIVO' : 'CARREGANDO'}</Text>
        </View>
        <View style={styles.height} pointerEvents="none">
          <Text style={styles.heightValue}>{Math.round(spec.heightCm)}</Text>
          <Text style={styles.heightLabel}>CM DECLARADOS</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerTitle}>ROTAÇÃO {Math.round(angle)}°</Text>
          <Text style={styles.footerCopy}>{focus === 'CORPO' ? 'Corpo completo e medidas em tempo real.' : focus === 'ROSTO' ? 'Zoom facial para ajuste fino de traços.' : 'Zoom de cabeça para cabelo, olhos e aparência.'}</Text>
        </View>
        <View style={styles.engineBadge}><Text style={styles.engineText}>MAKEHUMAN · CC0</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderWidth: 1, borderColor: '#B8AA9E', backgroundColor: colors.surface },
  stage: { overflow: 'hidden', backgroundColor: '#E4DDD5' },
  heading: { position: 'absolute', left: 14, top: 14 },
  overline: { color: 'rgba(46,35,31,0.55)', fontSize: 6, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: '#2C211E', fontFamily: 'serif', fontSize: 23, letterSpacing: 0.3, marginTop: 2 },
  status: { position: 'absolute', right: 12, top: 14, flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: 'rgba(116,25,52,0.3)', backgroundColor: 'rgba(248,243,237,0.82)', paddingHorizontal: 8, paddingVertical: 5 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#4F8D64' },
  dotError: { backgroundColor: '#B3261E' },
  statusText: { color: colors.accent, fontSize: 6, fontWeight: '900', letterSpacing: 0.75 },
  height: { position: 'absolute', left: 13, bottom: 13, borderLeftWidth: 2, borderLeftColor: colors.accent, paddingLeft: 7 },
  heightValue: { color: '#2C211E', fontFamily: 'serif', fontSize: 22, lineHeight: 23 },
  heightLabel: { color: 'rgba(46,35,31,0.58)', fontSize: 5.5, fontWeight: '900', letterSpacing: 0.8 },
  footer: { minHeight: 62, borderTopWidth: 1, borderColor: '#C9BDB2', backgroundColor: '#FBF8F4', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  footerTitle: { color: colors.accent, fontSize: 7, fontWeight: '900', letterSpacing: 0.9 },
  footerCopy: { color: colors.muted, fontSize: 7, marginTop: 3, maxWidth: 235 },
  engineBadge: { borderWidth: 1, borderColor: colors.gold, paddingHorizontal: 8, paddingVertical: 6 },
  engineText: { color: colors.gold, fontSize: 6, fontWeight: '900', letterSpacing: 0.8 },
});
