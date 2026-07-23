import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import SectionHeader from '../components/SectionHeader';
import { useDemo } from '../contexts/DemoContext';
import { demoStores } from '../demo/data';
import { colors } from '../theme/colors';

export default function StoresScreen({ navigation }) {
  const { following, toggleFollowing } = useDemo();
  const followingCount = Object.values(following).filter(Boolean).length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader
        step="02  •  CONECTAR"
        eyebrow="LOJAS E MARCAS"
        title="Conheça quem publica."
        description="Entre no perfil de cada marca para explorar seus itens e lançamentos."
        stats={[
          { value: demoStores.length, label: 'lojas' },
          { value: followingCount, label: 'seguindo' },
        ]}
      />
      {demoStores.map((store) => {
        const isFollowing = Boolean(following[store.id]);
        return (
          <View key={store.id} style={styles.storeCard}>
            <Pressable style={styles.storeIdentity} onPress={() => navigation.navigate('Loja', { storeId: store.id })}>
              <View style={[styles.logo, { backgroundColor: store.brandColor }]}>
                <Text style={styles.logoText}>{store.initials}</Text>
              </View>
              <View style={styles.storeCopy}>
                <Text style={styles.storeName}>{store.store_name}</Text>
                <Text style={styles.tagline}>{store.tagline}</Text>
                <Text style={styles.meta}>{store.category} • {store.location}</Text>
              </View>
            </Pressable>
            <View style={styles.storeNumbers}>
              <View>
                <Text style={[styles.number, isFollowing && styles.changed]}>
                  {(store.followers + (isFollowing ? 1 : 0)).toLocaleString('pt-BR')}
                </Text>
                <Text style={styles.label}>SEGUIDORES</Text>
              </View>
              <View>
                <Text style={styles.number}>{store.items.length}</Text>
                <Text style={styles.label}>ITENS PUBLICADOS</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <Pressable
                style={styles.openButton}
                onPress={() => navigation.navigate('Loja', { storeId: store.id })}
              >
                <Text style={styles.openText}>VER PERFIL E ITENS →</Text>
              </Pressable>
              <Pressable
                style={[styles.followButton, isFollowing && styles.following]}
                onPress={() => toggleFollowing(store.id)}
              >
                <Text style={[styles.followText, isFollowing && styles.followActiveText]}>
                  {isFollowing ? '✓ SEGUINDO' : '+ SEGUIR'}
                </Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingTop: 22, paddingBottom: 32 },
  storeCard: {
    marginHorizontal: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: 16,
  },
  storeIdentity: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#FFFFFF', fontFamily: 'serif', fontSize: 27, fontWeight: '800' },
  storeCopy: { flex: 1, marginLeft: 14 },
  storeName: { color: colors.text, fontFamily: 'serif', fontSize: 24 },
  tagline: { color: colors.accent, fontSize: 11, fontWeight: '700', marginTop: 3 },
  meta: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  storeNumbers: {
    flexDirection: 'row',
    gap: 34,
    marginTop: 18,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  number: { color: colors.text, fontSize: 20, fontWeight: '900' },
  changed: { color: colors.accent },
  label: { color: colors.muted, fontSize: 7, fontWeight: '800', letterSpacing: 1.1 },
  actions: { flexDirection: 'row', marginTop: 14, gap: 8 },
  openButton: { flex: 1, backgroundColor: colors.primary, padding: 13, alignItems: 'center' },
  followButton: { minWidth: 95, borderWidth: 1, borderColor: colors.accent, padding: 13, alignItems: 'center' },
  following: { backgroundColor: colors.accent },
  openText: { color: colors.bg, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  followText: { color: colors.accent, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  followActiveText: { color: colors.bg },
});
