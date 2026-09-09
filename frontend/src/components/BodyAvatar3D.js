import React, { useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const numberFrom = (value, fallback) => {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

function bodyDimensions(profile) {
  const bust = numberFrom(profile.bust, 94);
  const waist = numberFrom(profile.waist, 76);
  const hips = numberFrom(profile.hips, 104);
  const height = numberFrom(profile.height, 168);
  const shape = profile.bodyShape || 'Ampulheta';
  const shapeAdjustments = {
    Ampulheta: { bust: 3, waist: -5, hips: 3 },
    Triângulo: { bust: -3, waist: 0, hips: 8 },
    'Triângulo invertido': { bust: 8, waist: 0, hips: -4 },
    Retângulo: { bust: 1, waist: 5, hips: 0 },
    Oval: { bust: 4, waist: 10, hips: 3 },
  }[shape] || { bust: 0, waist: 0, hips: 0 };

  return {
    bust,
    waist,
    hips,
    height,
    bustWidth: clamp(78 + (bust - 88) * 0.72 + shapeAdjustments.bust, 70, 116),
    waistWidth: clamp(56 + (waist - 65) * 0.7 + shapeAdjustments.waist, 48, 100),
    hipWidth: clamp(82 + (hips - 92) * 0.7 + shapeAdjustments.hips, 72, 122),
    legHeight: clamp(119 + (height - 160) * 1.05, 105, 151),
  };
}

function photoSource(profilePhoto) {
  if (!profilePhoto) return null;
  if (typeof profilePhoto === 'string') return { uri: profilePhoto };
  return profilePhoto;
}

export default function BodyAvatar3D({ profile }) {
  const dimensions = useMemo(() => bodyDimensions(profile), [profile]);
  const rotation = useRef(new Animated.Value(0)).current;
  const [angle, setAngle] = useState(0);
  const source = photoSource(profile.profilePhoto || profile.profilePhotoUrl || profile.avatar_url);
  const initials = String(profile.name || 'Cliente')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  function rotate(delta) {
    const next = clamp(angle + delta, -55, 55);
    setAngle(next);
    Animated.spring(rotation, {
      toValue: next,
      friction: 7,
      tension: 55,
      useNativeDriver: true,
    }).start();
  }

  const rotateY = rotation.interpolate({
    inputRange: [-55, 55],
    outputRange: ['-55deg', '55deg'],
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.stage}>
        <View style={styles.gridBack} />
        <Animated.View
          style={[
            styles.avatar,
            { transform: [{ perspective: 720 }, { rotateY }] },
          ]}
        >
          <View style={styles.head}>
            {source ? (
              <Image source={source} style={styles.facePhoto} />
            ) : (
              <Text style={styles.initials}>{initials}</Text>
            )}
          </View>
          <View style={styles.neck} />
          <View style={[styles.shoulders, { width: dimensions.bustWidth + 22 }]} />
          <View style={[styles.chest, { width: dimensions.bustWidth }]} />
          <View style={[styles.waist, { width: dimensions.waistWidth }]} />
          <View style={[styles.hips, { width: dimensions.hipWidth }]} />
          <View style={[styles.arm, styles.leftArm, { height: dimensions.legHeight - 1 }]} />
          <View style={[styles.arm, styles.rightArm, { height: dimensions.legHeight - 1 }]} />
          <View style={[styles.leg, styles.leftLeg, { height: dimensions.legHeight }]} />
          <View style={[styles.leg, styles.rightLeg, { height: dimensions.legHeight }]} />
          <View style={[styles.foot, styles.leftFoot, { top: 205 + dimensions.legHeight }]} />
          <View style={[styles.foot, styles.rightFoot, { top: 205 + dimensions.legHeight }]} />
        </Animated.View>
        <View style={styles.floorShadow} />
        <View style={styles.measureBadge}>
          <Text style={styles.measureBadgeText}>{dimensions.height} CM</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable style={styles.rotateButton} onPress={() => rotate(-15)}>
          <Text style={styles.rotateText}>↶ GIRAR</Text>
        </Pressable>
        <View style={styles.angleIndicator}>
          <Text style={styles.angleText}>{angle > 0 ? '+' : ''}{angle}°</Text>
          <Text style={styles.angleLabel}>PRÉVIA CORPORAL</Text>
        </View>
        <Pressable style={styles.rotateButton} onPress={() => rotate(15)}>
          <Text style={styles.rotateText}>GIRAR ↷</Text>
        </Pressable>
      </View>

      <View style={styles.measurements}>
        <Measurement label="BUSTO" value={dimensions.bust} />
        <Measurement label="CINTURA" value={dimensions.waist} />
        <Measurement label="QUADRIL" value={dimensions.hips} />
      </View>
    </View>
  );
}

function Measurement({ label, value }) {
  return (
    <View style={styles.measurement}>
      <Text style={styles.measurementValue}>{value}</Text>
      <Text style={styles.measurementLabel}>{label} • CM</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  stage: { height: 390, overflow: 'hidden', alignItems: 'center', backgroundColor: '#E8E1D8' },
  gridBack: { position: 'absolute', top: 24, bottom: 24, width: 1, backgroundColor: 'rgba(122,23,51,0.12)' },
  avatar: { position: 'absolute', top: 16, width: 190, height: 360, alignItems: 'center', zIndex: 2 },
  head: { position: 'absolute', top: 0, width: 58, height: 68, borderRadius: 29, backgroundColor: '#CFA58D', borderWidth: 3, borderColor: '#FFFFFF', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', zIndex: 8 },
  facePhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  initials: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  neck: { position: 'absolute', top: 61, width: 24, height: 24, backgroundColor: '#CFA58D', zIndex: 2 },
  shoulders: { position: 'absolute', top: 76, height: 31, borderRadius: 20, backgroundColor: colors.accentDark, shadowColor: '#000000', shadowOpacity: 0.14, shadowRadius: 7, shadowOffset: { width: 0, height: 4 } },
  chest: { position: 'absolute', top: 83, height: 74, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.accent },
  waist: { position: 'absolute', top: 137, height: 55, backgroundColor: colors.accent, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  hips: { position: 'absolute', top: 177, height: 50, borderRadius: 24, backgroundColor: '#24211F', zIndex: 3 },
  arm: { position: 'absolute', top: 88, width: 22, maxHeight: 126, borderRadius: 13, backgroundColor: '#CFA58D', zIndex: 1 },
  leftArm: { left: 35, transform: [{ rotate: '4deg' }] },
  rightArm: { right: 35, transform: [{ rotate: '-4deg' }] },
  leg: { position: 'absolute', top: 205, width: 34, borderRadius: 17, backgroundColor: '#24211F' },
  leftLeg: { left: 58, transform: [{ rotate: '1.5deg' }] },
  rightLeg: { right: 58, transform: [{ rotate: '-1.5deg' }] },
  foot: { position: 'absolute', width: 42, height: 15, borderRadius: 8, backgroundColor: colors.accentDark },
  leftFoot: { left: 50 },
  rightFoot: { right: 50 },
  floorShadow: { position: 'absolute', bottom: 11, width: 142, height: 16, borderRadius: 70, backgroundColor: 'rgba(10,10,10,0.13)' },
  measureBadge: { position: 'absolute', top: 15, right: 13, borderWidth: 1, borderColor: colors.accent, paddingHorizontal: 8, paddingVertical: 5 },
  measureBadgeText: { color: colors.accent, fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  controls: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: colors.line },
  rotateButton: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  rotateText: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  angleIndicator: { minWidth: 100, alignItems: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.line, paddingVertical: 8 },
  angleText: { color: colors.text, fontSize: 14, fontWeight: '900' },
  angleLabel: { color: colors.muted, fontSize: 6, fontWeight: '800', letterSpacing: 0.7 },
  measurements: { flexDirection: 'row', borderTopWidth: 1, borderColor: colors.line },
  measurement: { flex: 1, alignItems: 'center', paddingVertical: 11 },
  measurementValue: { color: colors.text, fontFamily: 'serif', fontSize: 20 },
  measurementLabel: { color: colors.muted, fontSize: 6, fontWeight: '900', letterSpacing: 0.8, marginTop: 2 },
});
