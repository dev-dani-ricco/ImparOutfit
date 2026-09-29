import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ParametricAvatar3D from '../components/ParametricAvatar3D';
import RealisticAvatar3D from '../components/RealisticAvatar3D';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import { colors } from '../theme/colors';
import { BODY_PRESETS, FACE_SHAPES, HAIR_COLORS, HAIR_STYLES, SKIN_TONES, withProfessionalAvatarDefaults } from '../avatar/avatarProfile';
import { REALISTIC_AVATAR_ENABLED } from '../config/features';

export default function ProfileScreen({ navigation, route }) {
  const { logout, user, switchContext } = useAuth();
  const { profile, resetDemo, setProfile, wardrobe, wardrobeCapacity } = useDemo();
  const [draft, setDraft] = useState(() => withProfessionalAvatarDefaults(profile));
  const [editing, setEditing] = useState(false);
  const firstName = String(draft.name || 'Cliente').split(' ')[0];

  useEffect(() => {
    setDraft(withProfessionalAvatarDefaults(profile));
  }, [profile]);

  useEffect(() => {
    if (!route?.params?.startEditing) return;
    setEditing(true);
    navigation.setParams({ startEditing: undefined });
  }, [navigation, route?.params?.startEditing]);

  function update(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function selectProfilePhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled) update('profilePhoto', { uri: result.assets[0].uri });
  }

  function save() {
    const nextProfile = {
      ...withProfessionalAvatarDefaults(draft),
      avatarProvider: draft.realisticAvatar?.url ? 'AVATURN' : 'MAKEHUMAN_CC0',
      avatarVersion: draft.realisticAvatar?.url ? String(draft.realisticAvatar.version || 1) : '3.0.0',
      avatarConfiguredAt: draft.avatarConfiguredAt || new Date().toISOString(),
      avatarUpdatedAt: new Date().toISOString(),
    };
    setDraft(nextProfile);
    setProfile(nextProfile);
    setEditing(false);
    Alert.alert('Avatar atualizado', 'Suas medidas e referências foram salvas para esta experiência.');
  }

  function cancelEditing() {
    setDraft(withProfessionalAvatarDefaults(profile));
    setEditing(false);
  }

  function openTab(name, params) {
    navigation.getParent()?.navigate(name, params);
  }

  function confirmReset() {
    Alert.alert(
      'Reiniciar apresentação?',
      'Todas as interações locais voltarão ao estado inicial.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reiniciar', style: 'destructive', onPress: resetDemo },
      ]
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.coverHeader}>
        <Text style={styles.brand}>IMPAR OUTFIT</Text>
        <Text style={styles.eyebrow}>SEU PERFIL • DEMONSTRAÇÃO</Text>
        {user?.contexts?.map(context=><Pressable key={context.organization_id} onPress={()=>switchContext(context.organization_id)}><Text style={styles.intro}>ABRIR {context.store_name} →</Text></Pressable>)}
        <Text style={styles.greeting}>Olá, {firstName}.</Text>
        <Text style={styles.intro}>
          Seu corpo, suas medidas e seu armário formam a base de todas as recomendações.
        </Text>
      </View>

      <View style={styles.avatarSection}>
        {draft.realisticAvatar?.url ? <RealisticAvatar3D avatar={draft.realisticAvatar} /> : <ParametricAvatar3D profile={draft} />}
        <View style={styles.avatarActions}>
          <Pressable style={styles.photoButton} onPress={selectProfilePhoto}>
            <Text style={styles.photoButtonText}>
              {draft.profilePhoto ? 'ALTERAR FOTO DO ROSTO' : '＋ ADICIONAR FOTO DO ROSTO'}
            </Text>
          </Pressable>
          <Pressable style={styles.editButton} onPress={() => navigation.navigate('Avatar Studio')}>
            <Text style={styles.editButtonText}>AJUSTAR AVATAR PARAMÉTRICO →</Text>
          </Pressable>
          {REALISTIC_AVATAR_ENABLED ? (
            <Pressable style={styles.realisticButton} onPress={() => navigation.navigate('Avatar Realista')}>
              <Text style={styles.realisticButtonText}>{draft.realisticAvatar?.url ? 'ATUALIZAR AVATAR REALISTA →' : 'CRIAR AVATAR REALISTA POR FOTOS →'}</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.avatarNote}>
          {draft.realisticAvatar?.url
            ? 'Avatar realista ativo. A aparência vem do modelo exportado; medidas do perfil continuam orientando o ajuste visual das roupas.'
            : 'Arraste para girar. O avatar paramétrico responde a rosto, corpo, cabelo, altura e medidas.'}
        </Text>
      </View>

      <View style={styles.dashboard}>
        <DashboardMetric value={wardrobe.length} label="PEÇAS" />
        <DashboardMetric value={wardrobeCapacity.available} label="ESPAÇOS LIVRES" />
        <DashboardMetric value={wardrobeCapacity.plan.name} label="PLANO" small />
      </View>

      <View style={styles.quickActions}>
        <Pressable style={styles.primaryAction} onPress={() => openTab('Armário')}>
          <Text style={styles.primaryActionTag}>MEU ACERVO</Text>
          <Text style={styles.primaryActionTitle}>Abrir armário</Text>
          <Text style={styles.primaryActionText}>Veja peças, coleções e capacidade.</Text>
        </Pressable>
        <Pressable style={styles.secondaryAction} onPress={() => openTab('Lojas')}>
          <Text style={styles.secondaryActionTag}>DESCOBRIR</Text>
          <Text style={styles.secondaryActionTitle}>Explorar lojas</Text>
          <Text style={styles.secondaryActionText}>Encontre peças para seu estilo.</Text>
        </Pressable>
      </View>

      {editing ? (
        <View style={styles.editor}>
          <Text style={styles.editorEyebrow}>DADOS DO AVATAR</Text>
          <Text style={styles.editorTitle}>Ajuste sua representação.</Text>
          <Text style={styles.editorDescription}>
            As medidas em centímetros recalculam a proporção corporal da prévia acima.
          </Text>

          <Section title="Foto e informações pessoais" description="A foto é aplicada ao rosto do avatar.">
            <View style={styles.photoEditor}>
              {draft.profilePhoto ? (
                <Image source={draft.profilePhoto} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}><Text style={styles.photoPlaceholderText}>SEM FOTO</Text></View>
              )}
              <Pressable style={styles.photoEditorButton} onPress={selectProfilePhoto}>
                <Text style={styles.photoEditorButtonText}>SELECIONAR FOTO QUADRADA</Text>
              </Pressable>
            </View>
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

          <Section title="Base corporal" description="Escolha uma base e refine com suas medidas reais. A base não substitui busto, cintura, quadril e altura.">
            <OptionGrid
              items={BODY_PRESETS}
              value={draft.bodyPreset}
              onChange={(value) => update('bodyPreset', value)}
            />
            <View style={styles.measureGrid}>
              <Measure label="OMBROS" value={draft.shoulders} onChangeText={(value) => update('shoulders', value)} suffix="%" />
              <Measure label="TRONCO" value={draft.torso} onChangeText={(value) => update('torso', value)} suffix="%" />
              <Measure label="COXAS" value={draft.thighs} onChangeText={(value) => update('thighs', value)} suffix="%" />
            </View>
            <Text style={styles.adjustHint}>Use valores entre -50 e +50 para refinamento visual. O zero mantém a base escolhida.</Text>
          </Section>

          <Section title="Rosto paramétrico" description="Ajuste a geometria do rosto sem transformar sua foto em textura pública.">
            <OptionGrid
              items={FACE_SHAPES}
              value={draft.faceShape}
              onChange={(value) => update('faceShape', value)}
            />
            <View style={styles.measureGrid}>
              <Measure label="LARGURA" value={draft.headWidth} onChangeText={(value) => update('headWidth', value)} suffix="%" />
              <Measure label="MANDÍBULA" value={draft.jaw} onChangeText={(value) => update('jaw', value)} suffix="%" />
              <Measure label="QUEIXO" value={draft.chin} onChangeText={(value) => update('chin', value)} suffix="%" />
              <Measure label="PROFUNDIDADE" value={draft.faceDepth} onChangeText={(value) => update('faceDepth', value)} suffix="%" />
            </View>
          </Section>

          <Section title="Tom de pele" description="Escolha a aproximação visual usada no renderer 3D.">
            <ColorGrid
              items={SKIN_TONES}
              value={draft.skinTone}
              onChange={(value) => update('skinTone', value)}
            />
          </Section>

          <Section title="Cabelo" description="Forma e cor são independentes para permitir uma representação mais próxima da cliente.">
            <OptionGrid
              items={HAIR_STYLES}
              value={draft.hairStyleId}
              onChange={(value) => update('hairStyleId', value)}
            />
            <ColorGrid
              items={HAIR_COLORS}
              value={draft.hairColor}
              onChange={(value) => update('hairColor', value)}
            />
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

          <Section title="Medidas corporais" description="Use centímetros para gerar o avatar proporcional.">
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
              Foto e medidas pertencem à cliente e só devem ser compartilhadas com especialistas autorizadas.
            </Text>
          </View>
          <View style={styles.saveRow}>
            <Pressable style={styles.cancel} onPress={cancelEditing}>
              <Text style={styles.cancelText}>CANCELAR</Text>
            </Pressable>
            <Pressable style={styles.save} onPress={save}>
              <Text style={styles.saveText}>SALVAR E ATUALIZAR AVATAR →</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.presentation}>
        <Text style={styles.presentationTag}>CONTA E APRESENTAÇÃO</Text>
        <Text style={styles.presentationTitle}>Controle desta experiência.</Text>
        <Text style={styles.presentationCopy}>As alterações ficam salvas neste aparelho até você reiniciar os dados.</Text>
        <View style={styles.presentationActions}>
          <Pressable style={styles.reset} onPress={confirmReset}>
            <Text style={styles.resetText}>REINICIAR DADOS</Text>
          </Pressable>
          <Pressable style={styles.logout} onPress={logout}>
            <Text style={styles.logoutText}>TROCAR PERFIL</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function DashboardMetric({ value, label, small }) {
  return (
    <View style={styles.dashboardMetric}>
      <Text style={[styles.dashboardValue, small && styles.dashboardValueSmall]}>{value}</Text>
      <Text style={styles.dashboardLabel}>{label}</Text>
    </View>
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

function Measure({ label, value, onChangeText, suffix = 'cm' }) {
  return (
    <View style={styles.measure}>
      <Text style={styles.measureLabel}>{label}</Text>
      <View style={styles.measureInputRow}>
        <TextInput
          style={styles.measureInput}
          value={String(value ?? '')}
          onChangeText={onChangeText}
          keyboardType="numbers-and-punctuation"
          placeholder="0"
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.cm}>{suffix}</Text>
      </View>
    </View>
  );
}

function OptionGrid({ items, value, onChange }) {
  return (
    <View style={styles.optionGrid}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <Pressable key={item.id} style={[styles.option, active && styles.optionActive]} onPress={() => onChange(item.id)}>
            <Text style={[styles.optionText, active && styles.optionTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ColorGrid({ items, value, onChange }) {
  return (
    <View style={styles.colorGrid}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <Pressable key={item.id} style={[styles.colorOption, active && styles.colorOptionActive]} onPress={() => onChange(item.id)}>
            <View style={[styles.colorSwatch, { backgroundColor: item.color }]} />
            <Text style={[styles.colorLabel, active && styles.colorLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 42 },
  coverHeader: { paddingHorizontal: 18, paddingTop: 28, paddingBottom: 20 },
  brand: { color: colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 3 },
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.8, marginTop: 24 },
  greeting: { color: colors.text, fontFamily: 'serif', fontSize: 39, lineHeight: 44, marginTop: 5 },
  intro: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 7 },
  avatarSection: { marginHorizontal: 18 },
  avatarActions: { gap: 8, marginTop: 10 },
  photoButton: { flex: 1, borderWidth: 1, borderColor: colors.accent, padding: 12, alignItems: 'center' },
  photoButtonText: { color: colors.accent, fontSize: 7, fontWeight: '900', letterSpacing: 0.7, textAlign: 'center' },
  editButton: { backgroundColor: colors.accent, padding: 12, alignItems: 'center' },
  editButtonText: { color: colors.bg, fontSize: 7, fontWeight: '900', letterSpacing: 0.7 },
  realisticButton: { backgroundColor: '#0B0B0C', borderWidth: 1, borderColor: colors.gold, padding: 13, alignItems: 'center' },
  realisticButtonText: { color: colors.gold, fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  avatarNote: { color: colors.muted, fontSize: 8, lineHeight: 13, textAlign: 'center', marginTop: 8 },
  dashboard: { margin: 18, flexDirection: 'row', borderWidth: 1, borderColor: colors.line },
  dashboardMetric: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRightWidth: 1, borderRightColor: colors.line },
  dashboardValue: { color: colors.accent, fontFamily: 'serif', fontSize: 24, fontWeight: '700' },
  dashboardValueSmall: { fontSize: 16, marginTop: 5, marginBottom: 4 },
  dashboardLabel: { color: colors.muted, fontSize: 6, fontWeight: '900', letterSpacing: 0.8, marginTop: 2 },
  quickActions: { flexDirection: 'row', gap: 10, marginHorizontal: 18, marginBottom: 28 },
  primaryAction: { flex: 1, minHeight: 130, backgroundColor: colors.primary, padding: 15, justifyContent: 'flex-end' },
  secondaryAction: { flex: 1, minHeight: 130, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 15, justifyContent: 'flex-end' },
  primaryActionTag: { color: colors.gold, fontSize: 7, fontWeight: '900', letterSpacing: 1.1 },
  secondaryActionTag: { color: colors.accent, fontSize: 7, fontWeight: '900', letterSpacing: 1.1 },
  primaryActionTitle: { color: colors.bg, fontFamily: 'serif', fontSize: 21, marginTop: 4 },
  secondaryActionTitle: { color: colors.text, fontFamily: 'serif', fontSize: 21, marginTop: 4 },
  primaryActionText: { color: '#BEB5AA', fontSize: 8, lineHeight: 13, marginTop: 4 },
  secondaryActionText: { color: colors.muted, fontSize: 8, lineHeight: 13, marginTop: 4 },
  editor: { borderTopWidth: 1, borderColor: colors.line, paddingTop: 22 },
  editorEyebrow: { marginHorizontal: 18, color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  editorTitle: { marginHorizontal: 18, color: colors.text, fontFamily: 'serif', fontSize: 30, marginTop: 4 },
  editorDescription: { marginHorizontal: 18, color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 5, marginBottom: 20 },
  section: { marginHorizontal: 18, marginBottom: 26, borderTopWidth: 1, borderColor: colors.line, paddingTop: 14 },
  sectionTitle: { color: colors.text, fontFamily: 'serif', fontSize: 25 },
  sectionDescription: { color: colors.muted, fontSize: 11, marginTop: 4, marginBottom: 14 },
  photoEditor: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 7 },
  photoPreview: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surface },
  photoPlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderText: { color: colors.muted, fontSize: 7, fontWeight: '900' },
  photoEditorButton: { flex: 1, borderWidth: 1, borderColor: colors.line, padding: 12, alignItems: 'center' },
  photoEditorButtonText: { color: colors.text, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
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
  hairStyles: { flexDirection: 'row', gap: 7 },
  hairStyle: { flex: 1, minHeight: 76, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', padding: 6 },
  hairStyleActive: { borderColor: colors.accent, backgroundColor: '#F3E8E5' },
  hairPreview: { width: 28, height: 31, borderTopLeftRadius: 14, borderTopRightRadius: 14, borderBottomLeftRadius: 9, borderBottomRightRadius: 9, backgroundColor: '#39251F' },
  hairCurto: { height: 23 },
  hairLongo: { height: 39 },
  hairCacheado: { width: 34, height: 32, borderRadius: 14 },
  hairCoque: { height: 29, borderTopLeftRadius: 17, borderTopRightRadius: 17 },
  hairText: { color: colors.muted, fontSize: 7, fontWeight: '800', marginTop: 6 },
  hairTextActive: { color: colors.accent },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  option: { minWidth: '30%', flexGrow: 1, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 10, paddingVertical: 11, alignItems: 'center', backgroundColor: colors.bg },
  optionActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  optionText: { color: colors.text, fontSize: 8, fontWeight: '800', textAlign: 'center' },
  optionTextActive: { color: '#FFFFFF' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  colorOption: { width: '31%', borderWidth: 1, borderColor: colors.line, padding: 8, alignItems: 'center', backgroundColor: colors.bg },
  colorOptionActive: { borderColor: colors.accent, borderWidth: 2 },
  colorSwatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
  colorLabel: { color: colors.muted, fontSize: 7, fontWeight: '800', textAlign: 'center', marginTop: 6 },
  colorLabelActive: { color: colors.accent },
  adjustHint: { color: colors.muted, fontSize: 8, lineHeight: 13, marginTop: 8 },
  measureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  measure: { width: '48%', backgroundColor: colors.surface, padding: 13 },
  measureLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  measureInputRow: { flexDirection: 'row', alignItems: 'flex-end' },
  measureInput: { flex: 1, color: colors.accent, fontFamily: 'serif', fontSize: 28, fontWeight: '900', paddingVertical: 4 },
  cm: { color: colors.muted, fontSize: 10, marginBottom: 10 },
  privacy: { marginHorizontal: 18, backgroundColor: colors.surface, padding: 15 },
  privacyTag: { color: colors.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  privacyText: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  saveRow: { flexDirection: 'row', gap: 8, margin: 18 },
  cancel: { flex: 0.36, borderWidth: 1, borderColor: colors.line, padding: 15, alignItems: 'center' },
  cancelText: { color: colors.text, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  save: { flex: 1, backgroundColor: colors.accent, padding: 15, alignItems: 'center' },
  saveText: { color: colors.bg, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  presentation: { marginHorizontal: 18, marginTop: 10, padding: 16, backgroundColor: colors.surface, borderLeftWidth: 3, borderLeftColor: colors.gold },
  presentationTag: { color: colors.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.3 },
  presentationTitle: { color: colors.text, fontFamily: 'serif', fontSize: 22, marginTop: 5 },
  presentationCopy: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 4 },
  presentationActions: { flexDirection: 'row', gap: 8, marginTop: 13 },
  reset: { flex: 1, borderWidth: 1, borderColor: colors.line, padding: 11, alignItems: 'center' },
  resetText: { color: colors.text, fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  logout: { flex: 1, backgroundColor: colors.accent, padding: 11, alignItems: 'center' },
  logoutText: { color: colors.bg, fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
});
