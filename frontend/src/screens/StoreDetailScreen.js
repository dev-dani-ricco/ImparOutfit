import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import { colors } from '../theme/colors';

export default function StoreDetailScreen({ navigation, route }) {
  const { activeContext } = useAuth();
  const { commercialSaves, saveCommercialItem, following, stores, toggleFollowing } = useDemo();
  const store = stores.find((item) => item.id === route.params?.storeId) ;
  const isFollowing = Boolean(store && following[store.id]);
  const isPreview = activeContext !== 'personal' || route.params?.preview;
  const [notice, setNotice] = useState('');

  function saveReference(item) {
    saveCommercialItem(store.id,item);
    setNotice(`${item.name} salva como referência comercial. A posse não foi alterada.`);
  }
  if(!store)return <View style={styles.content}><Text>Loja não encontrada.</Text></View>;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: store.brandColor }]}>
        {isPreview ? <Text style={styles.previewBadge}>PRÉVIA DA EXPERIÊNCIA DA CLIENTE</Text> : null}
        <View style={styles.logo}>
          <Text style={[styles.logoText, { color: store.brandColor }]}>{store.initials}</Text>
        </View>
        <Text style={styles.name}>{store.store_name}</Text>
        <Text style={styles.tagline}>{store.tagline}</Text>
        <Text style={styles.location}>{store.location}</Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{(store.followers + (isFollowing ? 1 : 0)).toLocaleString('pt-BR')}</Text>
          <Text style={styles.summaryLabel}>SEGUIDORES</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{store.items.length}</Text>
          <Text style={styles.summaryLabel}>PUBLICAÇÕES</Text>
        </View>
      </View>

      {notice ? (
        <Pressable style={styles.notice} onPress={() => setNotice('')}>
          <Text style={styles.noticeIcon}>✓</Text>
          <View style={styles.noticeCopy}>
            <Text style={styles.noticeTitle}>ITEM SALVO</Text>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
          <Text style={styles.noticeClose}>×</Text>
        </Pressable>
      ) : null}

      <Pressable
        disabled={isPreview}
        style={[styles.follow, isFollowing && { backgroundColor: store.brandColor }, isPreview && styles.previewButton]}
        onPress={() => toggleFollowing(store.id)}
      >
        <Text style={[styles.followText, isPreview && styles.previewButtonText]}>
          {isPreview ? 'VITRINE PUBLICADA • VISÍVEL' : isFollowing ? '✓ VOCÊ SEGUE ESTA MARCA' : '+ SEGUIR ESTA MARCA'}
        </Text>
      </Pressable>

      <Text style={styles.sectionEyebrow}>CATÁLOGO DA MARCA</Text>
      <Text style={styles.sectionTitle}>Itens publicados</Text>
      <Text style={styles.sectionDescription}>
        {isPreview
          ? 'Esta é a visão que suas clientes recebem no aplicativo.'
          : 'Salve referências para comparar e combinar com suas peças.'}
      </Text>

      {store.items.map((item, index) => {
        const copied = Boolean(commercialSaves[item.id]);
        return (
          <View key={item.id} style={styles.product}>
            <Image source={item.image} style={styles.productImage} />
            <View style={styles.productCopy}>
              <Text style={styles.productIndex}>{String(index + 1).padStart(2, '0')} • {item.category}</Text>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.price}>{item.price}</Text>
              <View style={styles.tags}>
                <Text style={styles.tag}>FOTO 2D</Text>
                <Text style={styles.tag}>PRÉVIA COMERCIAL</Text>
              </View>
              <Pressable
                disabled={isPreview || copied}
                style={[styles.productButton, copied && styles.productButtonDone, isPreview && styles.productButtonPreview]}
                onPress={() => saveReference(item)}
              >
                <Text style={styles.productButtonText}>
                  {isPreview ? 'ITEM ATIVO ✓' : copied ? 'REFERÊNCIA SALVA ✓' : '+ SALVAR REFERÊNCIA'}
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
  content: { paddingBottom: 34 },
  hero: { alignItems: 'center', padding: 28 },
  previewBadge: { color: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', paddingHorizontal: 9, paddingVertical: 6, fontSize: 7, fontWeight: '900', letterSpacing: 1.2, marginBottom: 18 },
  logo: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: 'serif', fontSize: 31, fontWeight: '900' },
  name: { color: '#FFFFFF', fontFamily: 'serif', fontSize: 32, marginTop: 13 },
  tagline: { color: '#FFFFFF', fontWeight: '700', marginTop: 4 },
  location: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 6 },
  summary: { flexDirection: 'row', margin: 18, borderWidth: 1, borderColor: colors.line },
  summaryItem: { flex: 1, padding: 14, alignItems: 'center' },
  summaryNumber: { color: colors.accent, fontSize: 22, fontWeight: '900' },
  summaryLabel: { color: colors.muted, fontSize: 7, fontWeight: '800', letterSpacing: 1.1 },
  notice: { marginHorizontal: 18, marginBottom: 12, backgroundColor: colors.accent, padding: 12, flexDirection: 'row', alignItems: 'center' },
  noticeIcon: { color: colors.bg, fontSize: 21, marginRight: 11 },
  noticeCopy: { flex: 1 },
  noticeTitle: { color: colors.gold, fontSize: 7, fontWeight: '900', letterSpacing: 1.1 },
  noticeText: { color: colors.bg, fontSize: 10, marginTop: 2 },
  noticeClose: { color: colors.bg, fontSize: 20 },
  follow: { marginHorizontal: 18, backgroundColor: colors.accent, padding: 15, alignItems: 'center' },
  previewButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  followText: { color: colors.bg, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  previewButtonText: { color: colors.accent },
  sectionEyebrow: { marginHorizontal: 18, marginTop: 30, color: colors.accent, fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  sectionTitle: { marginHorizontal: 18, color: colors.text, fontFamily: 'serif', fontSize: 30, marginTop: 6 },
  sectionDescription: { marginHorizontal: 18, color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5, marginBottom: 18 },
  product: { marginHorizontal: 18, marginBottom: 20, flexDirection: 'row', borderTopWidth: 1, borderColor: colors.line, paddingTop: 14 },
  productImage: { width: 130, height: 166, backgroundColor: colors.surface },
  productCopy: { flex: 1, paddingLeft: 14 },
  productIndex: { color: colors.accent, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  productName: { color: colors.text, fontFamily: 'serif', fontSize: 21, marginTop: 5 },
  price: { color: colors.text, fontWeight: '900', marginTop: 7 },
  tags: { flexDirection: 'row', gap: 4, marginTop: 8 },
  tag: { color: colors.accent, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 5, paddingVertical: 3, fontSize: 6, fontWeight: '900' },
  productButton: { backgroundColor: colors.primary, padding: 10, alignItems: 'center', marginTop: 10 },
  productButtonDone: { backgroundColor: colors.accent },
  productButtonPreview: { backgroundColor: colors.muted },
  productButtonText: { color: colors.bg, fontSize: 7, fontWeight: '800', letterSpacing: 0.8 },
});
