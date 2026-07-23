import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Card from './Card';
import { useDemo } from '../contexts/DemoContext';
import { colors } from '../theme/colors';

export default function FeedPost({ item }) {
  const { favorites, likes, toggleFavorite, toggleLike, like } = useDemo();
  const lastTap = useRef(0);
  const heartScale = useRef(new Animated.Value(0)).current;
  const isFavorite = Boolean(favorites[item.id]);
  const isLiked = Boolean(likes[item.id]);

  function animateHeart() {
    heartScale.setValue(0);
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 4,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.delay(350),
      Animated.timing(heartScale, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function handleImagePress() {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      like(item.id);
      animateHeart();
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
  }

  return (
    <Card
      image={item.image}
      subtitle={`${item.label} • ${item.author}`}
      title={item.title}
      description={item.description}
      onImagePress={handleImagePress}
      imageOverlay={
        <>
          <Animated.Text
            pointerEvents="none"
            style={[styles.bigHeart, { transform: [{ scale: heartScale }] }]}
          >
            ♥
          </Animated.Text>
          <View pointerEvents="none" style={styles.doubleTapHint}>
            <Text style={styles.doubleTapText}>TOQUE 2X PARA CURTIR</Text>
          </View>
        </>
      }
    >
      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={() => toggleLike(item.id)}>
          <Text style={[styles.actionIcon, isLiked && styles.activeIcon]}>
            {isLiked ? '♥' : '♡'}
          </Text>
          <View>
            <Text style={[styles.number, isLiked && styles.activeNumber]}>
              {(item.likes + (isLiked ? 1 : 0)).toLocaleString('pt-BR')}
            </Text>
            <Text style={styles.label}>CURTIDAS</Text>
          </View>
        </Pressable>
        <Pressable style={styles.action} onPress={() => toggleFavorite(item.id)}>
          <Text style={[styles.actionIcon, isFavorite && styles.activeIcon]}>
            {isFavorite ? '◆' : '◇'}
          </Text>
          <View>
            <Text style={[styles.number, isFavorite && styles.activeNumber]}>
              {(item.favorites + (isFavorite ? 1 : 0)).toLocaleString('pt-BR')}
            </Text>
            <Text style={styles.label}>FAVORITAS</Text>
          </View>
        </Pressable>
      </View>
      <Pressable
        style={[styles.favoriteButton, isFavorite && styles.favoriteActive]}
        onPress={() => toggleFavorite(item.id)}
      >
        <Text style={styles.favoriteText}>
          {isFavorite ? '✓ PUBLICAÇÃO FAVORITA' : '◇ ADICIONAR ÀS FAVORITAS'}
        </Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  bigHeart: {
    position: 'absolute',
    alignSelf: 'center',
    top: 78,
    color: '#FFFFFF',
    fontSize: 88,
    textShadowColor: 'rgba(0,0,0,0.28)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  doubleTapHint: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(10,10,10,0.66)',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  doubleTapText: { color: '#FFFFFF', fontSize: 7, fontWeight: '800', letterSpacing: 1 },
  actions: { flexDirection: 'row', gap: 30, marginTop: 16, marginBottom: 14 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionIcon: { color: colors.text, fontSize: 30 },
  activeIcon: { color: colors.accent },
  number: { color: colors.text, fontSize: 18, fontWeight: '800' },
  activeNumber: { color: colors.accent },
  label: { color: colors.muted, fontSize: 7, fontWeight: '700', letterSpacing: 1.2 },
  favoriteButton: { backgroundColor: colors.primary, padding: 13, alignItems: 'center' },
  favoriteActive: { backgroundColor: colors.accent },
  favoriteText: { color: colors.bg, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
});
