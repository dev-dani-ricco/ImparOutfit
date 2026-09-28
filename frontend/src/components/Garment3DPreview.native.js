import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { useAssets } from 'expo-asset';
import { File } from 'expo-file-system';
import * as THREE from 'three';
import { GLTFLoader, SkeletonUtils } from 'three-stdlib';
import { colors } from '../theme/colors';
import { useDemo } from '../contexts/DemoContext';
import { normalizeAvatarSpec } from '../avatar/avatarSpec.mjs';
import { garmentFitProfile } from '../reconstruction/garmentFitV2.mjs';

const GARMENT_ASSETS = {
  top: require('../../assets/models/garments/top.glb'),
  pants: require('../../assets/models/garments/pants.glb'),
  skirt: require('../../assets/models/garments/skirt.glb'),
  dress: require('../../assets/models/garments/dress.glb'),
  bag: require('../../assets/models/garments/bag.glb'),
  shoe: require('../../assets/models/garments/shoe.glb'),
};
const GARMENT_KEYS = Object.keys(GARMENT_ASSETS);
const ALL_GARMENT_ASSETS = GARMENT_KEYS.map((key) => GARMENT_ASSETS[key]);

const FABRIC_MATERIALS = {
  RIGID: { roughness: 0.82, metalness: 0.01, sheen: 0.0 },
  STRUCTURED: { roughness: 0.68, metalness: 0.01, sheen: 0.04 },
  KNIT: { roughness: 0.92, metalness: 0.0, sheen: 0.08 },
  FLUID: { roughness: 0.38, metalness: 0.0, sheen: 0.24 },
};

function garmentKind(category) {
  const type = String(category || '').toLowerCase();
  if (type.includes('vest') || type.includes('dress')) return 'dress';
  if (type.includes('saia') || type.includes('skirt')) return 'skirt';
  if (type.includes('cal') || type.includes('pants') || type.includes('jeans')) return 'pants';
  if (type.includes('bolsa') || type.includes('bag')) return 'bag';
  if (type.includes('sap') || type.includes('tênis') || type.includes('tenis') || type.includes('shoe')) return 'shoe';
  return 'top';
}

function fitCategory(category) {
  const kind = garmentKind(category);
  if (kind === 'dress') return 'DRESS';
  if (kind === 'pants' || kind === 'skirt') return 'PANTS';
  if (kind === 'bag') return 'BAG';
  if (kind === 'shoe') return 'FOOTWEAR';
  return 'TOP';
}

function useLocalGltf(uri) {
  const [state, setState] = useState({ gltf: null, error: null });
  useEffect(() => {
    let cancelled = false;
    if (!uri) return undefined;
    (async () => {
      try {
        const buffer = await new File(uri).arrayBuffer();
        if (cancelled) return;
        new GLTFLoader().parse(
          buffer,
          '',
          (gltf) => !cancelled && setState({ gltf, error: null }),
          (error) => !cancelled && setState({ gltf: null, error: error instanceof Error ? error : new Error(String(error)) }),
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

function prepareGarment(scene, color, fabricClass) {
  const root = SkeletonUtils.clone(scene);
  const materialProfile = FABRIC_MATERIALS[fabricClass] || FABRIC_MATERIALS.STRUCTURED;
  root.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    const materials = (Array.isArray(object.material) ? object.material : [object.material]).filter(Boolean);
    const next = materials.map((material) => {
      const copy = material.clone?.() || new THREE.MeshStandardMaterial();
      if (copy.color) copy.color.set(color);
      if ('roughness' in copy) copy.roughness = materialProfile.roughness;
      if ('metalness' in copy) copy.metalness = materialProfile.metalness;
      if ('sheen' in copy) copy.sheen = materialProfile.sheen;
      copy.side = THREE.DoubleSide;
      copy.needsUpdate = true;
      return copy;
    });
    object.material = Array.isArray(object.material) ? next : next[0];
  });
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  const center = bounds.getCenter(new THREE.Vector3());
  root.position.set(-center.x, -center.y, -center.z);
  return root;
}

function GarmentModel({ gltf, angle, color, fitScale, fabricClass }) {
  const garment = useMemo(
    () => prepareGarment(gltf.scene, color, fabricClass),
    [gltf.scene, color, fabricClass],
  );
  return (
    <group rotation={[0, THREE.MathUtils.degToRad(angle), 0]} scale={fitScale}>
      <primitive object={garment} />
    </group>
  );
}

export default function Garment3DPreview({
  category,
  color,
  compact = false,
  reconstructed = false,
  fabricClass = 'STRUCTURED',
}) {
  const { profile } = useDemo();
  const avatarSpec = useMemo(() => normalizeAvatarSpec(profile), [profile]);
  const fitProfile = useMemo(
    () => garmentFitProfile(fitCategory(category), avatarSpec, { fabricClass }),
    [category, avatarSpec, fabricClass],
  );
  const kind = garmentKind(category);
  const [assets, assetError] = useAssets(ALL_GARMENT_ASSETS);
  const assetIndex = GARMENT_KEYS.indexOf(kind);
  const selectedAsset = assets?.[Math.max(0, assetIndex)];
  const uri = selectedAsset?.localUri || selectedAsset?.uri;
  const { gltf, error: modelError } = useLocalGltf(uri);
  const [angle, setAngle] = useState(0);
  const start = useRef(0);
  const current = useRef(0);

  const controls = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 6,
    onPanResponderGrant: () => {
      start.current = current.current;
    },
    onPanResponderMove: (_, gesture) => {
      const next = start.current + gesture.dx * 0.6;
      current.current = next;
      setAngle(next);
    },
  }), []);

  const error = assetError || modelError;
  return (
    <View style={[styles.wrapper, compact && styles.compact]}>
      <View style={styles.stage} {...controls.panHandlers}>
        <Canvas camera={{ position: [0, 0.05, 4.5], fov: 36 }} dpr={1.25} gl={{ antialias: true }}>
          <color attach="background" args={['#E8E1DA']} />
          <ambientLight intensity={1.8} />
          <hemisphereLight intensity={0.8} color="#FFF7EF" groundColor="#81766D" />
          <directionalLight position={[3, 4, 4]} intensity={2.6} />
          <directionalLight position={[-3, 1, -2]} intensity={1.15} />
          {gltf ? (
            <GarmentModel
              gltf={gltf}
              angle={angle}
              color={color || '#7A3148'}
              fitScale={fitProfile.scale}
              fabricClass={fabricClass}
            />
          ) : null}
          <mesh position={[0, -1.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.45, 48]} />
            <meshStandardMaterial color="#CFC4BA" roughness={0.95} />
          </mesh>
        </Canvas>
        <View style={styles.badge} pointerEvents="none">
          <Text style={styles.badgeText}>
            {reconstructed ? 'GLB VALIDADO' : 'PROXY TAILORED 3D · AJUSTADO AO AVATAR'}
          </Text>
        </View>
        {error ? <View style={styles.error}><Text style={styles.errorText}>FALHA NO TEMPLATE 3D</Text></View> : null}
      </View>
      {!compact ? (
        <View style={styles.footer}>
          <Text style={styles.title}>{reconstructed ? 'Geometria reconstruída' : 'Template volumétrico profissional'}</Text>
          <Text style={styles.copy}>
            {reconstructed
              ? 'Modelo privado aprovado pelo quality gate.'
              : `${fitProfile.label} · ${fitProfile.fabricLabel} · escala ${fitProfile.scale.map((value) => value.toFixed(2)).join(' × ')}. O template é apenas uma prévia; a reconstrução privada substitui esta geometria após o quality gate.`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderWidth: 1, borderColor: '#C8BBB0', backgroundColor: '#F7F3EE' },
  compact: { borderWidth: 0 },
  stage: { height: 320, overflow: 'hidden' },
  badge: { position: 'absolute', top: 12, right: 12, backgroundColor: colors.accent, paddingHorizontal: 9, paddingVertical: 6 },
  badgeText: { color: '#FFFFFF', fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  error: { position: 'absolute', left: 12, bottom: 12, backgroundColor: '#8D2D2D', paddingHorizontal: 9, paddingVertical: 6 },
  errorText: { color: '#FFFFFF', fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  footer: { padding: 13, borderTopWidth: 1, borderColor: '#D9D0C8' },
  title: { color: '#151515', fontFamily: 'serif', fontSize: 18 },
  copy: { color: '#756D66', fontSize: 9, lineHeight: 14, marginTop: 4 },
});
