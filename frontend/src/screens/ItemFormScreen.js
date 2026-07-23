import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useDemo } from '../contexts/DemoContext';
import { demoImages, wardrobeCategories } from '../demo/data';
import { colors } from '../theme/colors';

const requiredAngles = [
  { id: 'front', label: 'Frente' },
  { id: 'right', label: 'Lado direito' },
  { id: 'back', label: 'Costas' },
  { id: 'left', label: 'Lado esquerdo' },
];

export default function ItemFormScreen({ navigation }) {
  const { addWardrobeItem } = useDemo();
  const [form, setForm] = useState({ name: '', subcategory: '', color: '', size: '' });
  const [category, setCategory] = useState(null);
  const [image, setImage] = useState(null);
  const [angleCaptures, setAngleCaptures] = useState({});

  const completedAngles = Object.keys(angleCaptures).length;
  const canSave = Boolean(form.name && category && image && completedAngles === requiredAngles.length);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function selectPhoto2D() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.85,
    });
    if (!result.canceled) setImage({ uri: result.assets[0].uri });
  }

  async function captureAngle(angle) {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Câmera necessária', 'Autorize a câmera para registrar os ângulos do scan 3D.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
      });
      if (!result.canceled) {
        setAngleCaptures((current) => ({ ...current, [angle.id]: result.assets[0].uri }));
      }
    } catch {
      Alert.alert(
        'Câmera indisponível',
        'Neste emulador, use o modo demonstrativo para visualizar o fluxo completo.'
      );
    }
  }

  function activateDemoCapture() {
    setImage((current) => current || demoImages.bomber);
    setAngleCaptures({
      front: 'demo-front',
      right: 'demo-right',
      back: 'demo-back',
      left: 'demo-left',
    });
    setForm((current) => ({
      name: current.name || 'Nova peça escaneada',
      subcategory: current.subcategory || 'Jaqueta',
      color: current.color || 'Lilás',
      size: current.size || 'M',
    }));
    setCategory((current) => current || wardrobeCategories[0]);
  }

  function save() {
    if (!canSave) return;
    addWardrobeItem({
      name: form.name,
      categoryId: category.id,
      category: category.label,
      subcategory: form.subcategory || category.examples.split(',')[0],
      color: form.color || 'Não informada',
      size: form.size || 'Não informado',
      source: 'Meu armário',
      image,
      model3d: {
        id: `scan-${Date.now()}`,
        status: 'ready',
        angles: completedAngles,
        captures: angleCaptures,
        reconstruction: 'demo-preview',
      },
    });
    navigation.goBack();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>CADASTRO OBRIGATÓRIO • 2D + 3D</Text>
      <Text style={styles.title}>Digitalize uma peça.</Text>
      <Text style={styles.description}>
        A peça só entra no armário quando a foto 2D e os quatro ângulos do scan estiverem completos.
      </Text>

      <Step number="01" title="Foto principal 2D" complete={Boolean(image)}>
        <Pressable style={styles.captureBox} onPress={selectPhoto2D}>
          {image ? (
            <Image source={image} style={styles.preview} />
          ) : (
            <>
              <Text style={styles.captureIcon}>▣</Text>
              <Text style={styles.captureTitle}>SELECIONAR FOTO 2D</Text>
              <Text style={styles.captureHint}>Imagem frontal, fundo limpo e peça inteira</Text>
            </>
          )}
        </Pressable>
      </Step>

      <Step number="02" title="Categoria clara" complete={Boolean(category)}>
        <View style={styles.categories}>
          {wardrobeCategories.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.categoryButton, category?.id === item.id && styles.categoryActive]}
              onPress={() => setCategory(item)}
            >
              <Text style={[styles.categoryName, category?.id === item.id && styles.categoryActiveText]}>
                {item.label}
              </Text>
              <Text style={[styles.categoryExamples, category?.id === item.id && styles.categoryActiveText]}>
                {item.examples}
              </Text>
            </Pressable>
          ))}
        </View>
      </Step>

      <Step number="03" title="Informações da peça" complete={Boolean(form.name)}>
        <Field label="NOME DA PEÇA *" value={form.name} onChangeText={(value) => update('name', value)} />
        <Field label="SUBCATEGORIA" value={form.subcategory} onChangeText={(value) => update('subcategory', value)} placeholder="Ex.: jaqueta, saia, tênis" />
        <View style={styles.fieldRow}>
          <View style={styles.half}>
            <Field label="COR" value={form.color} onChangeText={(value) => update('color', value)} />
          </View>
          <View style={styles.half}>
            <Field label="TAMANHO" value={form.size} onChangeText={(value) => update('size', value)} />
          </View>
        </View>
      </Step>

      <Step number="04" title="Captura para modelo 3D" complete={completedAngles === 4}>
        <Text style={styles.scanCopy}>
          Fotografe a peça parada nos quatro ângulos. O pacote será usado pela futura reconstrução 3D.
        </Text>
        <View style={styles.angleGrid}>
          {requiredAngles.map((angle, index) => {
            const complete = Boolean(angleCaptures[angle.id]);
            return (
              <Pressable
                key={angle.id}
                style={[styles.angleButton, complete && styles.angleComplete]}
                onPress={() => captureAngle(angle)}
              >
                <Text style={[styles.angleNumber, complete && styles.angleCompleteText]}>
                  {complete ? '✓' : String(index + 1).padStart(2, '0')}
                </Text>
                <Text style={[styles.angleLabel, complete && styles.angleCompleteText]}>{angle.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.progress}>
          <View style={[styles.progressFill, { width: `${(completedAngles / 4) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{completedAngles}/4 ÂNGULOS CAPTURADOS</Text>
        <Pressable style={styles.demoButton} onPress={activateDemoCapture}>
          <Text style={styles.demoButtonText}>▶ PREENCHER SCAN PARA A DEMONSTRAÇÃO</Text>
        </Pressable>
      </Step>

      <View style={styles.validation}>
        <Validation label="Foto 2D" complete={Boolean(image)} />
        <Validation label="Categoria" complete={Boolean(category)} />
        <Validation label="Nome" complete={Boolean(form.name)} />
        <Validation label="Scan 3D" complete={completedAngles === 4} />
      </View>
      <Pressable
        disabled={!canSave}
        style={[styles.saveButton, !canSave && styles.saveDisabled]}
        onPress={save}
      >
        <Text style={styles.saveText}>
          {canSave ? 'SALVAR PEÇA 2D + 3D →' : 'COMPLETE OS ITENS OBRIGATÓRIOS'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Step({ number, title, complete, children }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepNumber}>{number}</Text>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={[styles.stepStatus, complete && styles.stepStatusComplete]}>
          {complete ? 'CONCLUÍDO ✓' : 'OBRIGATÓRIO'}
        </Text>
      </View>
      {children}
    </View>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

function Validation({ label, complete }) {
  return (
    <View style={styles.validationItem}>
      <Text style={[styles.validationIcon, complete && styles.validationComplete]}>
        {complete ? '✓' : '○'}
      </Text>
      <Text style={styles.validationLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 18, paddingBottom: 40 },
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  title: { color: colors.text, fontFamily: 'serif', fontSize: 35, marginTop: 7 },
  description: { color: colors.muted, lineHeight: 21, marginTop: 9, marginBottom: 22 },
  step: { borderTopWidth: 1, borderColor: colors.line, paddingTop: 15, marginBottom: 28 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  stepNumber: { color: colors.bg, backgroundColor: colors.primary, padding: 7, fontSize: 9, fontWeight: '900' },
  stepTitle: { flex: 1, color: colors.text, fontWeight: '900', marginLeft: 9 },
  stepStatus: { color: colors.muted, fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  stepStatusComplete: { color: colors.accent },
  captureBox: { height: 230, backgroundColor: colors.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  preview: { width: '100%', height: '100%', resizeMode: 'cover' },
  captureIcon: { color: colors.accent, fontSize: 38 },
  captureTitle: { color: colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginTop: 10 },
  captureHint: { color: colors.muted, fontSize: 10, marginTop: 5 },
  categories: { gap: 8 },
  categoryButton: { borderWidth: 1, borderColor: colors.line, padding: 12 },
  categoryActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  categoryName: { color: colors.text, fontSize: 12, fontWeight: '900' },
  categoryExamples: { color: colors.muted, fontSize: 9, marginTop: 3 },
  categoryActiveText: { color: colors.bg },
  field: { marginBottom: 13 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  fieldLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  input: { borderBottomWidth: 1, borderColor: colors.line, color: colors.text, fontSize: 15, paddingVertical: 10 },
  scanCopy: { color: colors.muted, fontSize: 11, lineHeight: 17, marginBottom: 13 },
  angleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  angleButton: { width: '48%', borderWidth: 1, borderColor: colors.line, padding: 13 },
  angleComplete: { backgroundColor: colors.accent, borderColor: colors.accent },
  angleNumber: { color: colors.accent, fontSize: 18, fontWeight: '900' },
  angleLabel: { color: colors.text, fontSize: 10, fontWeight: '800', marginTop: 3 },
  angleCompleteText: { color: colors.bg },
  progress: { height: 7, backgroundColor: colors.surface, marginTop: 14 },
  progressFill: { height: '100%', backgroundColor: colors.accent },
  progressText: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1, textAlign: 'right', marginTop: 5 },
  demoButton: { borderWidth: 1, borderColor: colors.gold, padding: 12, alignItems: 'center', marginTop: 13 },
  demoButtonText: { color: colors.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  validation: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surface, padding: 14 },
  validationItem: { alignItems: 'center' },
  validationIcon: { color: colors.muted, fontSize: 18 },
  validationComplete: { color: colors.accent },
  validationLabel: { color: colors.muted, fontSize: 7, fontWeight: '800', marginTop: 3 },
  saveButton: { backgroundColor: colors.accent, padding: 17, alignItems: 'center', marginTop: 14 },
  saveDisabled: { backgroundColor: colors.muted, opacity: 0.55 },
  saveText: { color: colors.bg, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
});
