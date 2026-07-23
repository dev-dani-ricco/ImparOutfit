import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import { initialWardrobe } from '../demo/data';
import { colors } from '../theme/colors';

export default function WardrobeScreen({ navigation, route }) {
  const added = route.params?.newItem;
  const rows = added ? [{ id: 'new-item', ...added }, ...initialWardrobe] : initialWardrobe;
  const addedCount = added ? 1 : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader
        step="03  •  ORGANIZAR"
        eyebrow="MEU ARMÁRIO"
        title="Sua coleção pessoal."
        description="Visualize suas peças e amplie as possibilidades de combinação."
        stats={[
          { value: rows.length, label: 'peças no total' },
          { value: addedCount, label: 'adicionadas agora' },
        ]}
      />
      <Pressable style={styles.add} onPress={() => navigation.navigate('Nova peça')}>
        <Text style={styles.addText}>＋ ADICIONAR NOVA PEÇA</Text>
      </Pressable>
      {rows.map((item, index) => (
        <Card
          key={item.id}
          image={item.image}
          subtitle={`${String(index + 1).padStart(2, '0')} • ${item.category}`}
          title={item.name}
          description={`${item.source || 'Meu armário'} • ${item.color || 'Nova peça'} • Tamanho ${item.size || '—'}`}
        >
          {item.id === 'new-item' ? <Text style={styles.newBadge}>✓ PEÇA ADICIONADA AGORA</Text> : null}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingTop: 22, paddingBottom: 32 },
  add: {
    backgroundColor: colors.accent,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 18,
    marginBottom: 26,
  },
  addText: { color: colors.bg, fontWeight: '800', fontSize: 10, letterSpacing: 1.4 },
  newBadge: {
    alignSelf: 'flex-start',
    color: colors.bg,
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 14,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
});
