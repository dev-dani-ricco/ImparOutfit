import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import FeedPost from '../components/FeedPost';
import SectionHeader from '../components/SectionHeader';
import SponsoredAdCard from '../components/SponsoredAdCard';
import { useDemo } from '../contexts/DemoContext';
import { demoFeed, featuredAd } from '../demo/data';
import { colors } from '../theme/colors';

export default function FeedScreen({ navigation }) {
  const { campaignState, favorites, likes } = useDemo();
  const storePosts = demoFeed.filter((item) => item.authorType === 'STORE');
  const favoriteCount = storePosts.filter((item) => favorites[item.id]).length
    + (favorites[featuredAd.id] ? 1 : 0);
  const likeCount = Object.values(likes).filter(Boolean).length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      stickyHeaderIndices={[0]}
    >
      <View style={styles.stickyBar}>
        <View>
          <Text style={styles.stickyEyebrow}>PUBLICADO PELAS</Text>
          <Text style={styles.stickyTitle}>LOJAS</Text>
        </View>
        <Pressable style={styles.favoriteShortcut} onPress={() => navigation.navigate('Favoritas')}>
          <Text style={styles.favoriteCount}>{favoriteCount}</Text>
          <Text style={styles.favoriteLabel}>◇ FAVORITAS</Text>
        </Pressable>
      </View>
      <SectionHeader
        step="04  •  ACOMPANHAR"
        eyebrow="FEED EXCLUSIVO DAS LOJAS"
        title="Novidades das marcas."
        description="Somente lojas publicam aqui: lançamentos, vitrines e campanhas para clientes."
        stats={[
          { value: storePosts.length, label: 'publicações de lojas' },
          { value: likeCount, label: 'curtidas agora' },
          { value: favoriteCount, label: 'favoritas' },
        ]}
      />
      {storePosts.map((item, index) => (
        <React.Fragment key={item.id}>
          <FeedPost item={item} />
          {index === 0 && campaignState.status === 'active' ? (
            <SponsoredAdCard onOpen={() => navigation.navigate('Campanha patrocinada')} />
          ) : null}
        </React.Fragment>
      ))}
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
