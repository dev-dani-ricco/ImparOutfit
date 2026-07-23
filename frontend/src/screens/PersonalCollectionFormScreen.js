import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useDemo } from '../contexts/DemoContext';
import { colors } from '../theme/colors';

export default function PersonalCollectionFormScreen({ navigation }) {
  const { wardrobe, addPersonalCollection } = useDemo();
  const [title, setTitle] = useState('');
  const [occasion, setOccasion] = useState('');
  const [selected, setSelected] = useState({});
  const selectedIds = Object.keys(selected).filter((id) => selected[id]);
  const canSave = Boolean(title && selectedIds.length >= 2);

  function toggle(id) {
    setSelected((current) => ({ ...current, [id]: !current[id] }));
  }

  function save() {
    if (!canSave) return;
    const cover = wardrobe.find((item) => item.id === selectedIds[0])?.image;
    addPersonalCollection({
      title,
      occasion: occasion || 'Uso pessoal',
      itemIds: selectedIds,
      image: cover,
    });
    navigation.goBack();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>COLEÇÃO PARTICULAR</Text>
      <Text style={styles.title}>Combine seu armário.</Text>
      <Text style={styles.description}>
        Agrupe peças do seu acervo para reencontrar combinações completas.
      </Text>
      <Text style={styles.label}>NOME DA COLEÇÃO *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Ex.: Reuniões importantes"
        placeholderTextColor={colors.muted}
      />
      <Text style={styles.label}>OCASIÃO</Text>
      <TextInput
        style={styles.input}
        value={occasion}
        onChangeText={setOccasion}
        placeholder="Ex.: Trabalho, viagem, evento"
        placeholderTextColor={colors.muted}
      />
      <View style={styles.selectionHeader}>
        <Text style={styles.selectionTitle}>SELECIONE AO MENOS 2 PEÇAS</Text>
        <Text style={styles.selectionCount}>{selectedIds.length} SELECIONADAS</Text>
      </View>
      {wardrobe.map((item) => {
        const active = Boolean(selected[item.id]);
        return (
          <Pressable key={item.id} style={[styles.item, active && styles.itemActive]} onPress={() => toggle(item.id)}>
            <Image source={item.image} style={styles.image} />
            <View style={styles.copy}>
              <Text style={[styles.category, active && styles.activeText]}>{item.category} • {item.subcategory}</Text>
              <Text style={[styles.name, active && styles.activeText]}>{item.name}</Text>
              <Text style={[styles.format, active && styles.activeText]}>2D ✓ • 3D ✓</Text>
            </View>
            <Text style={[styles.check, active && styles.activeText]}>{active ? '✓' : '○'}</Text>
          </Pressable>
        );
      })}
      <Pressable disabled={!canSave} style={[styles.save, !canSave && styles.disabled]} onPress={save}>
        <Text style={styles.saveText}>
          {canSave ? `SALVAR COLEÇÃO COM ${selectedIds.length} PEÇAS →` : 'INFORME O NOME E ESCOLHA 2 PEÇAS'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 18, paddingBottom: 40 },
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  title: { color: colors.text, fontFamily: 'serif', fontSize: 34, marginTop: 7 },
  description: { color: colors.muted, lineHeight: 21, marginTop: 8, marginBottom: 24 },
  label: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.1, marginTop: 10 },
  input: { borderBottomWidth: 1, borderColor: colors.line, color: colors.text, fontSize: 15, paddingVertical: 11 },
  selectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 },
  selectionTitle: { color: colors.text, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  selectionCount: { color: colors.accent, fontSize: 8, fontWeight: '900' },
  item: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.line, marginBottom: 10, padding: 9 },
  itemActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  image: { width: 72, height: 82, backgroundColor: colors.surface },
  copy: { flex: 1, marginLeft: 11 },
  category: { color: colors.accent, fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  name: { color: colors.text, fontFamily: 'serif', fontSize: 18, marginTop: 4 },
  format: { color: colors.muted, fontSize: 8, fontWeight: '800', marginTop: 5 },
  check: { color: colors.muted, fontSize: 24 },
  activeText: { color: colors.bg },
  save: { backgroundColor: colors.accent, padding: 17, alignItems: 'center', marginTop: 18 },
  disabled: { backgroundColor: colors.muted, opacity: 0.55 },
  saveText: { color: colors.bg, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
});
