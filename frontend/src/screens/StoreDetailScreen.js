import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDemo } from '../contexts/DemoContext';
import { demoStores } from '../demo/data';
import { colors } from '../theme/colors';

export default function StoreDetailScreen({ route }) {
  const { following, toggleFollowing } = useDemo();
  const store = demoStores.find((item) => item.id === route.params?.storeId) || demoStores[0];
  const isFollowing = Boolean(following[store.id]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: store.brandColor }]}>
        <View style={styles.logo}>
          <Text style={[styles.logoText, { color: store.brandColor }]}>{store.initials}</Text>
        </View>
        <Text style={styles.name}>{store.store_name}</Text>
        <Text style={styles.tagline}>{store.tagline}</Text>
        <Text style={styles.location}>{store.location}</Text>
      </View>
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {(store.followers + (isFollowing ? 1 : 0)).toLocaleString('pt-BR')}
          </Text>
          <Text style={styles.summaryLabel}>SEGUIDORES</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{store.items.length}</Text>
          <Text style={styles.summaryLabel}>PUBLICAÇÕES</Text>
        </View>
      </View>
      <Pressable
        style={[styles.follow, isFollowing && { backgroundColor: store.brandColor }]}
        onPress={() => toggleFollowing(store.id)}
      >
        <Text style={styles.followText}>{isFollowing ? '✓ VOCÊ SEGUE ESTA MARCA' : '+ SEGUIR ESTA MARCA'}</Text>
      </Pressable>
      <Text style={styles.sectionEyebrow}>CATÁLOGO DA MARCA</Text>
      <Text style={styles.sectionTitle}>Itens publicados</Text>
      {store.items.map((item, index) => (
        <View key={item.id} style={styles.product}>
          <Image source={item.image} style={styles.productImage} />
          <View style={styles.productCopy}>
            <Text style={styles.productIndex}>{String(index + 1).padStart(2, '0')} • {item.category}</Text>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.price}>{item.price}</Text>
            <Pressable style={styles.productButton}>
              <Text style={styles.productButtonText}>VER ITEM →</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 34 },
  hero: { alignItems: 'center', padding: 28 },
  logo: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: 'serif', fontSize: 31, fontWeight: '900' },
  name: { color: '#FFFFFF', fontFamily: 'serif', fontSize: 32, marginTop: 13 },
  tagline: { color: '#FFFFFF', fontWeight: '700', marginTop: 4 },
  location: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 6 },
  summary: { flexDirection: 'row', margin: 18, borderWidth: 1, borderColor: colors.line },
  summaryItem: { flex: 1, padding: 14, alignItems: 'center' },
  summaryNumber: { color: colors.accent, fontSize: 22, fontWeight: '900' },
  summaryLabel: { color: colors.muted, fontSize: 7, fontWeight: '800', letterSpacing: 1.1 },
  follow: { marginHorizontal: 18, backgroundColor: colors.accent, padding: 15, alignItems: 'center' },
  followText: { color: colors.bg, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  sectionEyebrow: { marginHorizontal: 18, marginTop: 30, color: colors.accent, fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  sectionTitle: { marginHorizontal: 18, color: colors.text, fontFamily: 'serif', fontSize: 30, marginTop: 6, marginBottom: 18 },
  product: { marginHorizontal: 18, marginBottom: 18, flexDirection: 'row', borderTopWidth: 1, borderColor: colors.line, paddingTop: 14 },
  productImage: { width: 130, height: 150, backgroundColor: colors.surface },
  productCopy: { flex: 1, paddingLeft: 14 },
  productIndex: { color: colors.accent, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  productName: { color: colors.text, fontFamily: 'serif', fontSize: 21, marginTop: 5 },
  price: { color: colors.text, fontWeight: '900', marginTop: 8 },
  productButton: { backgroundColor: colors.primary, padding: 10, alignItems: 'center', marginTop: 12 },
  productButtonText: { color: colors.bg, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
});
