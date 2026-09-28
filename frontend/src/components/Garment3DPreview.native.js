import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import * as THREE from 'three';
import { colors } from '../theme/colors';
import { useDemo } from '../contexts/DemoContext';
import { normalizeAvatarSpec } from '../avatar/avatarSpec.mjs';
import { garmentFitProfile } from '../reconstruction/garmentFitV2.mjs';

function GarmentMesh({ category, angle, color = '#7A3148', fitScale = [1, 1, 1] }) {
  const type = String(category || '').toLowerCase();
  const group = useRef();

  const kind = useMemo(() => {
    if (type.includes('vest') || type.includes('dress')) return 'dress';
    if (type.includes('cal') || type.includes('pants') || type.includes('jeans')) return 'pants';
    if (type.includes('saia') || type.includes('skirt')) return 'skirt';
    if (type.includes('bolsa') || type.includes('bag')) return 'bag';
    if (type.includes('sap') || type.includes('tênis') || type.includes('tenis') || type.includes('shoe')) return 'shoe';
    return 'top';
  }, [type]);

  const material = <meshStandardMaterial color={color} roughness={0.62} metalness={0.03} side={THREE.DoubleSide} />;

  return (
    <group ref={group} rotation={[0, THREE.MathUtils.degToRad(angle), 0]} scale={fitScale}>
      {kind === 'dress' ? (
        <>
          <mesh position={[0, 0.68, 0]} scale={[0.72, 0.62, 0.38]} castShadow>
            <cylinderGeometry args={[0.62, 0.78, 1.15, 48, 1, true]} />{material}
          </mesh>
          <mesh position={[0, -0.25, 0]} scale={[0.95, 1.2, 0.52]} castShadow>
            <coneGeometry args={[0.95, 1.6, 64, 1, true]} />{material}
          </mesh>
        </>
      ) : null}

      {kind === 'pants' ? (
        <>
          <mesh position={[-0.26, -0.15, 0]} scale={[0.28, 1.2, 0.32]} castShadow>
            <capsuleGeometry args={[0.5, 1.25, 10, 24]} />{material}
          </mesh>
          <mesh position={[0.26, -0.15, 0]} scale={[0.28, 1.2, 0.32]} castShadow>
            <capsuleGeometry args={[0.5, 1.25, 10, 24]} />{material}
          </mesh>
          <mesh position={[0, 0.85, 0]} scale={[0.72, 0.34, 0.38]} castShadow>
            <boxGeometry args={[1, 1, 1]} />{material}
          </mesh>
        </>
      ) : null}

      {kind === 'skirt' ? (
        <mesh position={[0, 0.12, 0]} scale={[0.88, 1, 0.52]} castShadow>
          <coneGeometry args={[0.9, 1.7, 64, 1, true]} />{material}
        </mesh>
      ) : null}

      {kind === 'bag' ? (
        <>
          <mesh position={[0, 0, 0]} scale={[1.05, 0.82, 0.36]} castShadow>
            <boxGeometry args={[1.2, 1, 0.62]} />{material}
          </mesh>
          <mesh position={[0, 0.78, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.48, 0.06, 18, 48, Math.PI]} />{material}
          </mesh>
        </>
      ) : null}

      {kind === 'shoe' ? (
        <mesh position={[0, 0, 0]} rotation={[0, 0, -0.04]} scale={[1.35, 0.42, 0.58]} castShadow>
          <capsuleGeometry args={[0.52, 1.2, 10, 30]} />{material}
        </mesh>
      ) : null}

      {kind === 'top' ? (
        <>
          <mesh position={[0, 0.3, 0]} scale={[0.82, 0.78, 0.42]} castShadow>
            <cylinderGeometry args={[0.65, 0.72, 1.25, 48, 1, true]} />{material}
          </mesh>
          <mesh position={[-0.78, 0.38, 0]} rotation={[0, 0, -0.2]} scale={[0.2, 0.65, 0.22]} castShadow>
            <capsuleGeometry args={[0.5, 1.1, 8, 20]} />{material}
          </mesh>
          <mesh position={[0.78, 0.38, 0]} rotation={[0, 0, 0.2]} scale={[0.2, 0.65, 0.22]} castShadow>
            <capsuleGeometry args={[0.5, 1.1, 8, 20]} />{material}
          </mesh>
        </>
      ) : null}
    </group>
  );
}

function fitCategory(category) {
  const value = String(category || '').toLowerCase();
  if (value.includes('vest') || value.includes('dress')) return 'DRESS';
  if (value.includes('cal') || value.includes('pants') || value.includes('jeans') || value.includes('saia') || value.includes('skirt')) return 'PANTS';
  if (value.includes('bolsa') || value.includes('bag')) return 'BAG';
  if (value.includes('sap') || value.includes('tênis') || value.includes('tenis') || value.includes('shoe')) return 'FOOTWEAR';
  if (value.includes('acess') || value.includes('access')) return 'ACCESSORY';
  return 'TOP';
}

export default function Garment3DPreview({ category, color, compact = false, reconstructed = false, fabricClass = 'STRUCTURED' }) {
  const { profile } = useDemo();
  const avatarSpec = useMemo(() => normalizeAvatarSpec(profile), [profile]);
  const fitProfile = useMemo(() => garmentFitProfile(fitCategory(category), avatarSpec, { fabricClass }), [category, avatarSpec, fabricClass]);
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

  return (
    <View style={[styles.wrapper, compact && styles.compact]}>
      <View style={styles.stage} {...controls.panHandlers}>
        <Canvas camera={{ position: [0, 0.2, 4.8], fov: 38 }} dpr={1.2}>
          <color attach="background" args={['#E8E1DA']} />
          <ambientLight intensity={1.8} />
          <directionalLight position={[3, 4, 4]} intensity={2.4} />
          <directionalLight position={[-3, 1, -2]} intensity={1.2} />
          <GarmentMesh category={category} angle={angle} color={color || '#7A3148'} fitScale={fitProfile.scale} />
          <mesh position={[0, -1.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.45, 48]} />
            <meshStandardMaterial color="#CFC4BA" roughness={0.95} />
          </mesh>
        </Canvas>
        <View style={styles.badge} pointerEvents="none">
          <Text style={styles.badgeText}>{reconstructed ? 'GLB VALIDADO' : 'PROXY 3D PARAMÉTRICO · AJUSTADO AO AVATAR'}</Text>
        </View>
      </View>
      {!compact ? (
        <View style={styles.footer}>
          <Text style={styles.title}>{reconstructed ? 'Geometria reconstruída' : 'Prévia volumétrica da peça'}</Text>
          <Text style={styles.copy}>{reconstructed ? 'Modelo privado aprovado pelo quality gate.' : `${fitProfile.label} · escala ${fitProfile.scale.map((value) => value.toFixed(2)).join(' × ')}. Prévia proporcional; a reconstrução real substitui este proxy após o quality gate.`}</Text>
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
  footer: { padding: 13, borderTopWidth: 1, borderColor: '#D9D0C8' },
  title: { color: '#151515', fontFamily: 'serif', fontSize: 18 },
  copy: { color: '#756D66', fontSize: 9, lineHeight: 14, marginTop: 4 },
});
