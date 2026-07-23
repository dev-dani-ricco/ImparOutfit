import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import FeedPost from '../components/FeedPost';
import { useDemo } from '../contexts/DemoContext';
import { demoFeed } from '../demo/data';
import { colors } from '../theme/colors';

export default function FavoritesScreen() {
  const { favorites } = useDemo();
  const items = demoFeed.filter((item) => favorites[item.id]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>SUA CURADORIA</Text>
      <Text style={styles.title}>Publicações favoritas</Text>
      <Text style={styles.description}>
        Ao voltar, o Feed continuará na mesma posição e com as mesmas interações.
      </Text>
      <View style={styles.counter}>
        <Text style={styles.counterValue}>{items.length}</Text>
        <Text style={styles.counterLabel}>PUBLICAÇÕES FAVORITAS</Text>
      </View>
      {items.length ? (
        items.map((item) => <FeedPost key={item.id} item={item} />)
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>◇</Text>
          <Text style={styles.emptyTitle}>Sua seleção começa no Feed.</Text>
          <Text style={styles.emptyCopy}>Toque em “Adicionar às favoritas” em uma publicação.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingTop: 28, paddingBottom: 32 },
  eyebrow: { marginHorizontal: 18, color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  title: { marginHorizontal: 18, marginTop: 7, color: colors.text, fontFamily: 'serif', fontSize: 34 },
  description: { marginHorizontal: 18, marginTop: 9, color: colors.muted, lineHeight: 21 },
  counter: { margin: 18, padding: 15, backgroundColor: colors.surface, alignItems: 'center' },
  counterValue: { color: colors.accent, fontSize: 28, fontWeight: '900' },
  counterLabel: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.4 },
  empty: { margin: 18, padding: 28, borderWidth: 1, borderColor: colors.line, alignItems: 'center' },
  emptyIcon: { color: colors.accent, fontSize: 42 },
  emptyTitle: { color: colors.text, fontFamily: 'serif', fontSize: 22, marginTop: 8 },
  emptyCopy: { color: colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
