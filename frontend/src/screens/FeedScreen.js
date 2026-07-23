import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import FeedPost from '../components/FeedPost';
import SectionHeader from '../components/SectionHeader';
import { useDemo } from '../contexts/DemoContext';
import { demoFeed } from '../demo/data';
import { colors } from '../theme/colors';

export default function FeedScreen({ navigation }) {
  const { favorites, likes } = useDemo();
  const favoriteCount = Object.values(favorites).filter(Boolean).length;
  const likeCount = Object.values(likes).filter(Boolean).length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      stickyHeaderIndices={[0]}
    >
      <View style={styles.stickyBar}>
        <View>
          <Text style={styles.stickyEyebrow}>VOCÊ ESTÁ NO</Text>
          <Text style={styles.stickyTitle}>FEED</Text>
        </View>
        <Pressable style={styles.favoriteShortcut} onPress={() => navigation.navigate('Favoritas')}>
          <Text style={styles.favoriteCount}>{favoriteCount}</Text>
          <Text style={styles.favoriteLabel}>◇ FAVORITAS</Text>
        </Pressable>
      </View>
      <SectionHeader
        step="01  •  DESCOBRIR"
        eyebrow="FEED PERSONALIZADO"
        title="Vista sua presença."
        description="Seu ponto de partida continua exatamente onde você deixou."
        stats={[
          { value: demoFeed.length, label: 'publicações' },
          { value: likeCount, label: 'curtidas agora' },
          { value: favoriteCount, label: 'favoritas' },
        ]}
      />
      {demoFeed.map((item) => <FeedPost key={item.id} item={item} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 32 },
  stickyBar: {
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: 18,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
    elevation: 8,
  },
  stickyEyebrow: { color: colors.muted, fontSize: 7, fontWeight: '700', letterSpacing: 1.4 },
  stickyTitle: { color: colors.text, fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  favoriteShortcut: {
    backgroundColor: colors.accent,
    minWidth: 94,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center',
  },
  favoriteCount: { color: colors.bg, fontSize: 18, fontWeight: '900' },
  favoriteLabel: { color: colors.bg, fontSize: 7, fontWeight: '800', letterSpacing: 1 },
});
