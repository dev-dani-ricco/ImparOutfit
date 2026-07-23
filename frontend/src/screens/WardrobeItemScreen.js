import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Model3DPreview from '../components/Model3DPreview';
import { useDemo } from '../contexts/DemoContext';
import { colors } from '../theme/colors';

export default function WardrobeItemScreen({ route }) {
  const { wardrobe } = useDemo();
  const [mode, setMode] = useState('2d');
  const item = wardrobe.find((piece) => piece.id === route.params?.itemId) || wardrobe[0];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>{item.category} • {item.subcategory}</Text>
      <Text style={styles.title}>{item.name}</Text>
      <View style={styles.switcher}>
        <Pressable style={[styles.switchButton, mode === '2d' && styles.active]} onPress={() => setMode('2d')}>
          <Text style={[styles.switchText, mode === '2d' && styles.activeText]}>FOTO 2D</Text>
        </Pressable>
        <Pressable style={[styles.switchButton, mode === '3d' && styles.active]} onPress={() => setMode('3d')}>
          <Text style={[styles.switchText, mode === '3d' && styles.activeText]}>MODELO 3D • 360°</Text>
        </Pressable>
      </View>
      {mode === '2d' ? (
        <View style={styles.twoD}>
          <Image source={item.image} style={styles.image} resizeMode="contain" />
          <Text style={styles.modeBadge}>VISUALIZAÇÃO 2D ✓</Text>
        </View>
      ) : (
        <Model3DPreview image={item.image} model={item.model3d} />
      )}
      <View style={styles.data}>
        <Data label="Categoria" value={item.category} />
        <Data label="Tipo" value={item.subcategory} />
        <Data label="Cor" value={item.color} />
        <Data label="Tamanho" value={item.size} />
        <Data label="Origem" value={item.source} />
        <Data label="Ativo 3D" value={`${item.model3d?.angles || 0} ângulos registrados`} />
      </View>
      <View style={styles.required}>
        <Text style={styles.requiredTitle}>PADRÃO DO ARMÁRIO INTELIGENTE</Text>
        <Text style={styles.requiredText}>Foto 2D validada ✓  •  Modelo 3D obrigatório ✓</Text>
      </View>
    </ScrollView>
  );
}

function Data({ label, value }) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 18, paddingBottom: 36 },
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.6 },
  title: { color: colors.text, fontFamily: 'serif', fontSize: 34, marginTop: 6, marginBottom: 16 },
  switcher: { flexDirection: 'row', borderWidth: 1, borderColor: colors.line, marginBottom: 14 },
  switchButton: { flex: 1, padding: 13, alignItems: 'center' },
  active: { backgroundColor: colors.accent },
  switchText: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  activeText: { color: colors.bg },
  twoD: { height: 330, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  image: { width: '90%', height: '90%' },
  modeBadge: { position: 'absolute', top: 12, right: 12, color: colors.bg, backgroundColor: colors.primary, padding: 7, fontSize: 8, fontWeight: '900' },
  data: { marginTop: 18, borderTopWidth: 1, borderColor: colors.line },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.line },
  dataLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  dataValue: { color: colors.text, fontSize: 11, fontWeight: '900' },
  required: { backgroundColor: colors.accent, padding: 15, marginTop: 18 },
  requiredTitle: { color: colors.bg, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  requiredText: { color: colors.bg, fontSize: 11, fontWeight: '700', marginTop: 5 },
});
