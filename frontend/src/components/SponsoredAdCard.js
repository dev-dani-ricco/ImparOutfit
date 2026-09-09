import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useDemo } from '../contexts/DemoContext';
import { featuredAd } from '../demo/data';
import { colors } from '../theme/colors';

export default function SponsoredAdCard({ onOpen, preview = false }) {
  const { favorites, toggleFavorite } = useDemo();
  const isFavorite = Boolean(favorites[featuredAd.id]);

  return (
    <View style={[styles.card, preview && styles.previewCard]}>
      <View style={styles.disclosureRow}>
        <Text style={styles.disclosure}>{featuredAd.eyebrow}</Text>
        <Text style={styles.options}>•••</Text>
      </View>
      <Image source={featuredAd.image} style={[styles.image, preview && styles.previewImage]} />
      <View style={styles.copy}>
        <Text style={styles.store}>{featuredAd.storeName}</Text>
        <Text style={styles.title}>{featuredAd.title}</Text>
        <Text style={styles.description}>{featuredAd.description}</Text>
        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={onOpen}>
            <Text style={styles.primaryText}>{featuredAd.cta} →</Text>
          </Pressable>
          {!preview ? (
            <Pressable
              accessibilityLabel={isFavorite ? 'Remover campanha dos favoritos' : 'Favoritar campanha'}
              style={[styles.favoriteButton, isFavorite && styles.favoriteActive]}
              onPress={() => toggleFavorite(featuredAd.id)}
            >
              <Text style={[styles.favoriteText, isFavorite && styles.favoriteTextActive]}>
                {isFavorite ? '◆' : '◇'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 18,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.card,
  },
  previewCard: { marginHorizontal: 0, marginBottom: 0 },
  disclosureRow: {
    minHeight: 34,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
  },
  disclosure: { color: colors.gold, fontSize: 7, fontWeight: '900', letterSpacing: 1.3 },
  options: { color: colors.bg, fontSize: 12, letterSpacing: 2 },
  image: { width: '100%', height: 310, backgroundColor: colors.surface },
  previewImage: { height: 230 },
  copy: { padding: 15 },
  store: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { color: colors.text, fontFamily: 'serif', fontSize: 28, marginTop: 5 },
  description: { color: colors.muted, fontSize: 11, lineHeight: 18, marginTop: 7 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  primaryButton: { flex: 1, backgroundColor: colors.accent, padding: 13, alignItems: 'center' },
  primaryText: { color: colors.bg, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  favoriteButton: { width: 46, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  favoriteActive: { backgroundColor: colors.accent },
  favoriteText: { color: colors.accent, fontSize: 20 },
  favoriteTextActive: { color: colors.bg },
});
