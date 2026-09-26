import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import { colors } from '../theme/colors';

export default function StoreCatalogScreen({ navigation }) {
  const { user, activeContext } = useAuth();
  const { stores } = useDemo();
  const membership = user?.contexts?.find((context) => context.organization_id === activeContext);
  const store = stores.find((item) => item.id === membership?.store_id);

  if (!store) {
    return <View style={styles.center}><Text style={styles.emptyTitle}>Contexto comercial indisponível.</Text></View>;
  }

  const addProduct = async () => {
    await Haptics.selectionAsync().catch(() => {});
    navigation.getParent()?.navigate('Nova peça');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topline}>
        <View>
          <Text style={styles.mode}>LOJISTA · CATÁLOGO</Text>
          <Text style={styles.store}>{store.store_name}</Text>
        </View>
        <View style={styles.count}><Text style={styles.countValue}>{store.items.length}</Text><Text style={styles.countLabel}>ATIVOS</Text></View>
      </View>

      <Text style={styles.title}>Seu catálogo é a vitrine operacional.</Text>
      <Text style={styles.subtitle}>Publique, revise e visualize cada produto antes de expor para a cliente.</Text>

      <Pressable style={styles.primary} onPress={addProduct}>
        <Text style={styles.primaryText}>＋ PUBLICAR NOVA PEÇA</Text>
      </Pressable>

      <View style={styles.grid}>
        {store.items.map((item, index) => (
          <Pressable
            key={item.id}
            style={styles.card}
            onPress={() => navigation.getParent()?.navigate('Peça publicada', { storeItemId: item.id })}
          >
            <Image source={item.image} style={styles.image} contentFit="cover" transition={160} cachePolicy="memory-disk" />
            <View style={styles.cardBody}>
              <Text style={styles.index}>{String(index + 1).padStart(2, '0')} · {item.category?.toUpperCase()}</Text>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>{item.price}</Text>
              <Text style={styles.open}>ABRIR PRÉVIA →</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.note}>
        <Text style={styles.noteTag}>REGRA DE PRODUTO</Text>
        <Text style={styles.noteText}>Produto comercial salvo por uma cliente continua sendo referência. Ele só vira peça possuída após um evento explícito de posse.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F3EE' },
  content: { padding: 18, paddingBottom: 110 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F3EE', padding: 24 },
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 },
  mode: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  store: { color: '#151515', fontFamily: 'serif', fontSize: 22, marginTop: 3 },
  count: { minWidth: 58, alignItems: 'center', borderWidth: 1, borderColor: '#D9D0C8', paddingVertical: 8, paddingHorizontal: 10 },
  countValue: { color: '#151515', fontFamily: 'serif', fontSize: 22 },
  countLabel: { color: '#7A7068', fontSize: 6, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#151515', fontFamily: 'serif', fontSize: 34, lineHeight: 37, marginTop: 28 },
  subtitle: { color: '#716961', fontSize: 12, lineHeight: 19, marginTop: 8 },
  primary: { backgroundColor: '#111112', padding: 15, alignItems: 'center', marginTop: 20 },
  primaryText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  grid: { gap: 14, marginTop: 24 },
  card: { flexDirection: 'row', minHeight: 146, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2DAD2' },
  image: { width: 118, minHeight: 146, backgroundColor: '#EEE8E2' },
  cardBody: { flex: 1, padding: 14, justifyContent: 'center' },
  index: { color: colors.accent, fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  name: { color: '#151515', fontFamily: 'serif', fontSize: 20, marginTop: 6 },
  price: { color: '#151515', fontSize: 12, fontWeight: '800', marginTop: 6 },
  open: { color: colors.accent, fontSize: 7, fontWeight: '900', letterSpacing: 1, marginTop: 14 },
  note: { marginTop: 24, backgroundColor: '#EDE5DC', borderLeftWidth: 3, borderLeftColor: colors.gold, padding: 16 },
  noteTag: { color: colors.gold, fontSize: 7, fontWeight: '900', letterSpacing: 1.2 },
  noteText: { color: '#625A53', fontSize: 10, lineHeight: 16, marginTop: 5 },
  emptyTitle: { color: '#151515', fontFamily: 'serif', fontSize: 22, textAlign: 'center' },
});
