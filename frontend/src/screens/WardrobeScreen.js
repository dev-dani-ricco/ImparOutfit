import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import SectionHeader from '../components/SectionHeader';
import { useDemo } from '../contexts/DemoContext';
import { wardrobeCategories } from '../demo/data';
import { colors } from '../theme/colors';

export default function WardrobeScreen({ navigation }) {
  const { wardrobe, personalCollections } = useDemo();
  const [section, setSection] = useState('pieces');
  const [category, setCategory] = useState('all');

  const visibleItems = useMemo(
    () => category === 'all' ? wardrobe : wardrobe.filter((item) => item.categoryId === category),
    [category, wardrobe]
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader
        step="03  •  ORGANIZAR"
        eyebrow="GUARDA-ROUPA INTELIGENTE"
        title="Seu acervo digital."
        description="Cada peça reúne foto 2D e modelo 3D para futuras combinações."
        stats={[
          { value: wardrobe.length, label: 'peças 2D + 3D' },
          { value: personalCollections.length, label: 'coleções pessoais' },
        ]}
      />
      <View style={styles.segment}>
        <Pressable
          style={[styles.segmentButton, section === 'pieces' && styles.segmentActive]}
          onPress={() => setSection('pieces')}
        >
          <Text style={[styles.segmentText, section === 'pieces' && styles.segmentTextActive]}>
            PEÇAS ({wardrobe.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmentButton, section === 'collections' && styles.segmentActive]}
          onPress={() => setSection('collections')}
        >
          <Text style={[styles.segmentText, section === 'collections' && styles.segmentTextActive]}>
            MINHAS COLEÇÕES ({personalCollections.length})
          </Text>
        </Pressable>
      </View>

      {section === 'pieces' ? (
        <>
          <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Nova peça')}>
            <Text style={styles.primaryText}>＋ CADASTRAR PEÇA EM 2D + 3D</Text>
          </Pressable>
          <Text style={styles.filterTitle}>FILTRAR POR CATEGORIA</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            <CategoryChip label="Todas" active={category === 'all'} onPress={() => setCategory('all')} />
            {wardrobeCategories.map((item) => (
              <CategoryChip
                key={item.id}
                label={item.label}
                active={category === item.id}
                onPress={() => setCategory(item.id)}
              />
            ))}
          </ScrollView>
          <Text style={styles.resultCount}>{visibleItems.length} PEÇAS NESTA CATEGORIA</Text>
          {visibleItems.map((item, index) => (
            <Pressable
              key={item.id}
              style={styles.itemCard}
              onPress={() => navigation.navigate('Peça 2D e 3D', { itemId: item.id })}
            >
              <Image source={item.image} style={styles.itemImage} />
              <View style={styles.itemCopy}>
                <Text style={styles.category}>
                  {String(index + 1).padStart(2, '0')} • {item.category}
                </Text>
                <Text style={styles.subcategory}>{item.subcategory}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>{item.color} • Tamanho {item.size}</Text>
                <View style={styles.formatRow}>
                  <Text style={styles.formatBadge}>FOTO 2D ✓</Text>
                  <Text style={styles.formatBadge}>MODELO 3D ✓</Text>
                </View>
                <Text style={styles.openItem}>ABRIR ITEM E GIRAR 3D →</Text>
              </View>
            </Pressable>
          ))}
        </>
      ) : (
        <>
          <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Nova coleção')}>
            <Text style={styles.primaryText}>＋ CRIAR COLEÇÃO PARTICULAR</Text>
          </Pressable>
          <View style={styles.specialist}>
            <Text style={styles.specialistTag}>PRÓXIMA ETAPA</Text>
            <Text style={styles.specialistTitle}>Visão da especialista</Text>
            <Text style={styles.specialistCopy}>
              A profissional poderá acessar o armário autorizado e sugerir combinações.
            </Text>
          </View>
          {personalCollections.map((collection) => (
            <View key={collection.id} style={styles.collectionCard}>
              <Image source={collection.image || wardrobe.find((item) => collection.itemIds.includes(item.id))?.image} style={styles.collectionImage} />
              <View style={styles.collectionCopy}>
                <Text style={styles.category}>COLEÇÃO PARTICULAR • {collection.occasion}</Text>
                <Text style={styles.collectionTitle}>{collection.title}</Text>
                <Text style={styles.collectionMeta}>{collection.itemIds.length} PEÇAS COMBINADAS</Text>
                <View style={styles.collectionItems}>
                  {collection.itemIds.slice(0, 3).map((id) => {
                    const piece = wardrobe.find((item) => item.id === id);
                    return piece ? <Text key={id} style={styles.collectionItem}>• {piece.name}</Text> : null;
                  })}
                </View>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function CategoryChip({ label, active, onPress }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingTop: 22, paddingBottom: 34 },
  segment: { flexDirection: 'row', marginHorizontal: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.line },
  segmentButton: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.accent },
  segmentText: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  segmentTextActive: { color: colors.bg },
  primaryButton: { marginHorizontal: 18, backgroundColor: colors.primary, padding: 16, alignItems: 'center', marginBottom: 22 },
  primaryText: { color: colors.bg, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  filterTitle: { marginHorizontal: 18, color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  filters: { paddingHorizontal: 18, gap: 8, paddingVertical: 12 },
  chip: { borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 9 },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 9, fontWeight: '800' },
  chipTextActive: { color: colors.bg },
  resultCount: { marginHorizontal: 18, marginBottom: 12, color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  itemCard: { marginHorizontal: 18, marginBottom: 18, flexDirection: 'row', borderTopWidth: 1, borderColor: colors.line, paddingTop: 14 },
  itemImage: { width: 132, height: 170, backgroundColor: colors.surface },
  itemCopy: { flex: 1, paddingLeft: 13 },
  category: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  subcategory: { color: colors.muted, fontSize: 10, fontWeight: '700', marginTop: 3 },
  itemName: { color: colors.text, fontFamily: 'serif', fontSize: 20, marginTop: 4 },
  itemMeta: { color: colors.muted, fontSize: 10, marginTop: 5 },
  formatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 10 },
  formatBadge: { color: colors.bg, backgroundColor: colors.accent, paddingHorizontal: 7, paddingVertical: 5, fontSize: 7, fontWeight: '900' },
  openItem: { color: colors.text, fontSize: 7, fontWeight: '900', letterSpacing: 0.8, marginTop: 10 },
  specialist: { marginHorizontal: 18, marginBottom: 22, padding: 17, backgroundColor: colors.surface, borderLeftWidth: 4, borderLeftColor: colors.gold },
  specialistTag: { color: colors.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.4 },
  specialistTitle: { color: colors.text, fontFamily: 'serif', fontSize: 23, marginTop: 5 },
  specialistCopy: { color: colors.muted, lineHeight: 19, marginTop: 5, fontSize: 12 },
  collectionCard: { marginHorizontal: 18, marginBottom: 22, borderWidth: 1, borderColor: colors.line },
  collectionImage: { width: '100%', height: 180, backgroundColor: colors.surface },
  collectionCopy: { padding: 15 },
  collectionTitle: { color: colors.text, fontFamily: 'serif', fontSize: 25, marginTop: 5 },
  collectionMeta: { color: colors.text, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 9 },
  collectionItems: { marginTop: 8 },
  collectionItem: { color: colors.muted, fontSize: 11, marginTop: 3 },
});
