import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import SectionHeader from '../components/SectionHeader';
import { useDemo } from '../contexts/DemoContext';
import { colors } from '../theme/colors';

const bodyShapes = ['Ampulheta', 'Triângulo', 'Triângulo invertido', 'Retângulo', 'Oval'];

export default function ProfileScreen() {
  const { profile, setProfile } = useDemo();
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);

  function update(key, value) {
    setSaved(false);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function save() {
    setProfile(draft);
    setSaved(true);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader
        step="05  •  PERSONALIZAR"
        eyebrow="PERFIL DE ATENDIMENTO"
        title="Medidas que orientam."
        description="Informações para recomendações individuais e criação de looks mais precisos."
        stats={[
          { value: draft.age || '—', label: 'idade' },
          { value: draft.mannequinTop || '—', label: 'manequim superior' },
          { value: draft.mannequinBottom || '—', label: 'manequim inferior' },
        ]}
      />
      <Section title="Informações pessoais" description="Contexto para estilo de vida e rotina.">
        <Field label="NOME COMPLETO" value={draft.name} onChangeText={(value) => update('name', value)} />
        <View style={styles.row}>
          <View style={styles.ageField}>
            <Field label="IDADE" value={draft.age} onChangeText={(value) => update('age', value)} keyboardType="numeric" suffix="anos" />
          </View>
          <View style={styles.flex}>
            <Field label="PROFISSÃO" value={draft.profession} onChangeText={(value) => update('profession', value)} />
          </View>
        </View>
      </Section>
      <Section title="Formato do corpo" description="Referência visual para proporções e caimento.">
        <View style={styles.shapes}>
          {bodyShapes.map((shape) => (
            <Pressable
              key={shape}
              style={[styles.shape, draft.bodyShape === shape && styles.shapeActive]}
              onPress={() => update('bodyShape', shape)}
            >
              <View style={[styles.silhouette, draft.bodyShape === shape && styles.silhouetteActive]} />
              <Text style={[styles.shapeText, draft.bodyShape === shape && styles.shapeTextActive]}>{shape}</Text>
            </Pressable>
          ))}
        </View>
      </Section>
      <Section title="Manequim" description="Numeração usual para partes superior e inferior.">
        <View style={styles.row}>
          <View style={styles.flex}>
            <Field label="PARTE DE CIMA" value={draft.mannequinTop} onChangeText={(value) => update('mannequinTop', value)} placeholder="Ex.: M / 40" />
          </View>
          <View style={styles.flex}>
            <Field label="PARTE DE BAIXO" value={draft.mannequinBottom} onChangeText={(value) => update('mannequinBottom', value)} placeholder="Ex.: 42" />
          </View>
        </View>
      </Section>
      <Section title="Medidas corporais" description="Use centímetros para padronizar o atendimento individual.">
        <View style={styles.measureGrid}>
          <Measure label="BUSTO" value={draft.bust} onChangeText={(value) => update('bust', value)} />
          <Measure label="CINTURA" value={draft.waist} onChangeText={(value) => update('waist', value)} />
          <Measure label="QUADRIL" value={draft.hips} onChangeText={(value) => update('hips', value)} />
          <Measure label="ALTURA" value={draft.height} onChangeText={(value) => update('height', value)} />
        </View>
      </Section>
      <View style={styles.privacy}>
        <Text style={styles.privacyTag}>DADOS DE ATENDIMENTO</Text>
        <Text style={styles.privacyText}>
          Estas informações pertencem à cliente e só serão compartilhadas com especialistas autorizadas.
        </Text>
      </View>
      <Pressable style={[styles.save, saved && styles.saved]} onPress={save}>
        <Text style={styles.saveText}>{saved ? '✓ PERFIL ATUALIZADO' : 'SALVAR PERFIL E MEDIDAS →'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Section({ title, description, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{description}</Text>
      {children}
    </View>
  );
}

function Field({ label, suffix, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput {...props} style={styles.input} placeholderTextColor={colors.muted} />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

function Measure({ label, value, onChangeText }) {
  return (
    <View style={styles.measure}>
      <Text style={styles.measureLabel}>{label}</Text>
      <View style={styles.measureInputRow}>
        <TextInput
          style={styles.measureInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholder="—"
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.cm}>cm</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingTop: 22, paddingBottom: 40 },
  section: { marginHorizontal: 18, marginBottom: 26, borderTopWidth: 1, borderColor: colors.line, paddingTop: 14 },
  sectionTitle: { color: colors.text, fontFamily: 'serif', fontSize: 25 },
  sectionDescription: { color: colors.muted, fontSize: 11, marginTop: 4, marginBottom: 14 },
  field: { flex: 1, marginTop: 10 },
  fieldLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: colors.line },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 10 },
  suffix: { color: colors.muted, fontSize: 10 },
  row: { flexDirection: 'row', gap: 14 },
  flex: { flex: 1 },
  ageField: { width: 94 },
  shapes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  shape: { width: '31%', minHeight: 86, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', padding: 8 },
  shapeActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  silhouette: { width: 22, height: 39, borderRadius: 11, backgroundColor: colors.line },
  silhouetteActive: { backgroundColor: colors.bg },
  shapeText: { color: colors.muted, fontSize: 8, fontWeight: '800', textAlign: 'center', marginTop: 6 },
  shapeTextActive: { color: colors.bg },
  measureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  measure: { width: '48%', backgroundColor: colors.surface, padding: 13 },
  measureLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  measureInputRow: { flexDirection: 'row', alignItems: 'flex-end' },
  measureInput: { flex: 1, color: colors.accent, fontFamily: 'serif', fontSize: 28, fontWeight: '900', paddingVertical: 4 },
  cm: { color: colors.muted, fontSize: 10, marginBottom: 10 },
  privacy: { marginHorizontal: 18, backgroundColor: colors.surface, padding: 15 },
  privacyTag: { color: colors.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  privacyText: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  save: { margin: 18, backgroundColor: colors.primary, padding: 17, alignItems: 'center' },
  saved: { backgroundColor: colors.accent },
  saveText: { color: colors.bg, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
});
