import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import * as THREE from 'three';
import { GLTFLoader, SkeletonUtils } from 'three-stdlib';
import { API_URL } from '../api/client';
import { colors } from '../theme/colors';
import { normalizeGarmentMaterials } from '../reconstruction/garmentFitV2.mjs';

function dispose(root) {
  root?.traverse?.((object) => {
    if (!object.isMesh) return;
    object.geometry?.dispose?.();
    for (const material of (Array.isArray(object.material) ? object.material : [object.material])) material?.dispose?.();
  });
}

function PreparedAsset({ scene, angle }) {
  const prepared = useMemo(() => {
    const root = SkeletonUtils.clone(scene);
    normalizeGarmentMaterials(root);
    root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(root);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 2.8 / Math.max(size.x, size.y, size.z, 0.001);
    root.position.set(-center.x, -center.y, -center.z);
    return { root, scale };
  }, [scene]);

  return (
    <group rotation={[0, THREE.MathUtils.degToRad(angle), 0]} scale={prepared.scale}>
      <primitive object={prepared.root} />
    </group>
  );
}

export default function PrivateGarment3D({ jobId, token }) {
  const [scene, setScene] = useState(null);
  const [state, setState] = useState('loading');
  const [angle, setAngle] = useState(0);
  const current = useRef(0);
  const start = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let loaded = null;
    setScene(null);
    setState('loading');

    fetch(API_URL + '/reconstruction/jobs/' + jobId + '/output', {
      headers: { Authorization: 'Bearer ' + token },
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('PRIVATE_GLB_' + response.status);
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > 67108864) throw new Error('PRIVATE_GLB_TOO_LARGE');
        return buffer;
      })
      .then((buffer) => new Promise((resolve, reject) => new GLTFLoader().parse(buffer, '', resolve, reject)))
      .then((gltf) => {
        if (cancelled) {
          dispose(gltf.scene);
          return;
        }
        loaded = gltf.scene;
        setScene(gltf.scene);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });

    return () => {
      cancelled = true;
      dispose(loaded);
    };
  }, [jobId, token]);

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

  return (
    <View style={styles.wrapper}>
      <View style={styles.stage} {...controls.panHandlers}>
        <Canvas camera={{ position: [0, 0.1, 4.5], fov: 36 }} dpr={1.25}>
          <color attach="background" args={['#E8E1DA']} />
          <ambientLight intensity={1.8} />
          <hemisphereLight intensity={0.8} color="#FFF7EF" groundColor="#81766D" />
          <directionalLight position={[3, 4, 4]} intensity={2.6} />
          <directionalLight position={[-3, 1, -2]} intensity={1.15} />
          {scene ? <PreparedAsset scene={scene} angle={angle} /> : null}
        </Canvas>
        <View style={styles.badge}><Text style={styles.badgeText}>GLB PRIVADO · QUALITY GATE APROVADO</Text></View>
        {state === 'loading' ? <View style={styles.state}><Text style={styles.stateText}>CARREGANDO GEOMETRIA REAL…</Text></View> : null}
        {state === 'error' ? <View style={[styles.state, styles.error]}><Text style={styles.stateText}>NÃO FOI POSSÍVEL ABRIR O GLB PRIVADO</Text></View> : null}
      </View>
      <View style={styles.footer}>
        <Text style={styles.title}>Peça reconstruída</Text>
        <Text style={styles.copy}>Geometria privada derivada da captura multivista e liberada apenas após validação. Arraste para inspecionar em 360°.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderWidth: 1, borderColor: '#C8BBB0', backgroundColor: '#F7F3EE' },
  stage: { height: 340, overflow: 'hidden' },
  badge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#1F5F46', paddingHorizontal: 9, paddingVertical: 6 },
  badgeText: { color: '#FFFFFF', fontSize: 7, fontWeight: '900', letterSpacing: 0.9 },
  state: { position: 'absolute', left: 12, bottom: 12, backgroundColor: colors.accent, paddingHorizontal: 9, paddingVertical: 7 },
  error: { backgroundColor: '#8D2D2D' },
  stateText: { color: '#FFFFFF', fontSize: 7, fontWeight: '900', letterSpacing: 0.7 },
  footer: { padding: 13, borderTopWidth: 1, borderColor: '#D9D0C8' },
  title: { color: '#151515', fontFamily: 'serif', fontSize: 18 },
  copy: { color: '#756D66', fontSize: 9, lineHeight: 14, marginTop: 4 },
});
