import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export default function Model3DPreview({ image, model, compact = false }) {
  const rotation = useRef(new Animated.Value(0)).current;
  const animation = useRef(null);

  function spin() {
    animation.current?.stop();
    rotation.setValue(0);
    animation.current = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 3200,
        useNativeDriver: true,
      }),
      { iterations: 1 }
    );
    animation.current.start();
  }

  useEffect(() => () => animation.current?.stop(), []);

  const rotateY = rotation.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['0deg', '70deg', '180deg', '290deg', '360deg'],
  });

  return (
    <Pressable style={[styles.stage, compact && styles.compact]} onPress={spin}>
      <View style={styles.orbit} />
      <Animated.Image
        source={image}
        resizeMode="contain"
        style={[
          styles.model,
          compact && styles.compactModel,
          { transform: [{ perspective: 700 }, { rotateY }] },
        ]}
      />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>3D ✓</Text>
      </View>
      {!compact ? (
        <View style={styles.instruction}>
          <Text style={styles.instructionText}>TOQUE PARA GIRAR 360°</Text>
          <Text style={styles.modelId}>{model?.angles || 0} ÂNGULOS • MODELO VALIDADO</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: 330,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  compact: { height: 170 },
  orbit: {
    position: 'absolute',
    width: '78%',
    height: 70,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 999,
    bottom: 55,
    opacity: 0.45,
  },
  model: { width: '76%', height: 250 },
  compactModel: { height: 135 },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  badgeText: { color: colors.bg, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  instruction: { position: 'absolute', bottom: 13, alignItems: 'center' },
  instructionText: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  modelId: { color: colors.muted, fontSize: 7, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
});
