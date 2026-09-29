import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import ParametricAvatar3D from '../components/ParametricAvatar3D';
import {
  BODY_PRESETS,
  FACE_SHAPES,
  EYE_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  SKIN_TONES,
  applyBodyPreset,
  avatarSpecToProfile,
  normalizeAvatarSpec,
} from '../avatar/avatarSpec.mjs';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import { useConnectedData } from '../contexts/ConnectedDataContext';
import { colors } from '../theme/colors';

const SECTIONS = ['CORPO', 'ROSTO', 'CABELO'];

export default function AvatarStudioScreen({ navigation }) {
  const demo = useDemo();
  const connected = useConnectedData();
  const { token, demoMode } = useAuth();
  const profile = demoMode ? demo.profile : (connected.personal.profile || {});
  const [spec, setSpec] = useState(() => normalizeAvatarSpec(profile));
  const [section, setSection] = useState('CORPO');
  const [bodyPreset, setBodyPreset] = useState(null);
  const [advancedBody, setAdvancedBody] = useState(false);
  const [advancedFace, setAdvancedFace] = useState(false);

  const liveProfile = useMemo(() => avatarSpecToProfile(profile, spec), [profile, spec]);

  const updateBody = (key, value) => {
    setBodyPreset(null);
    setSpec((current) => ({ ...current, body: { ...current.body, [key]: value } }));
  };
  const updateFace = (key, value) => setSpec((current) => ({ ...current, face: { ...current.face, [key]: value } }));
  const updateAppearance = (key, value) => setSpec((current) => ({ ...current, appearance: { ...current.appearance, [key]: value } }));
  const updateMeasurement = (key, value) => setSpec((current) => ({ ...current, measurements: { ...current.measurements, [key]: value } }));

  async function chooseSection(next) {
    await Haptics.selectionAsync().catch(() => {});
    setSection(next);
  }

  async function chooseBodyPreset(presetId) {
    await Haptics.selectionAsync().catch(() => {});
    setSpec((current) => applyBodyPreset(current, presetId));
    setBodyPreset(presetId);
  }

  async function save() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const next = avatarSpecToProfile(profile, spec);
    if (!demoMode && token) {
      await api('/profile', { token, method: 'PUT', body: {
        height: Number(next.height),
        bust: Number(next.bust),
        waist: Number(next.waist),
        hips: Number(next.hips),
        hairStyle: next.hairStyle,
        avatarProvider: next.avatarProvider,
        avatarVersion: next.avatarVersion,
        avatarEngine: next.avatarEngine,
        avatarConfiguredAt: next.avatarConfiguredAt,
        avatarUpdatedAt: next.avatarUpdatedAt,
        avatarControls: next.avatarControls,
      } });
    }
    if (demoMode) demo.setProfile(next);
    else connected.refresh();
    Alert.alert('Avatar atualizado', 'Rosto, corpo, cabelo e medidas foram salvos.');
    navigation.goBack();
  }

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <View>
          <Text style={styles.kicker}>IMPAR DIGITAL ATELIER</Text>
          <Text style={styles.title}>Avatar Studio</Text>
        </View>
        <Pressable style={styles.saveTop} onPress={save}><Text style={styles.saveTopText}>SALVAR</Text></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <ParametricAvatar3D profile={liveProfile} spec={spec} focus={section} />

        <View style={styles.tabs}>
          {SECTIONS.map((item) => (
            <Pressable key={item} style={[styles.tab, section === item && styles.tabActive]} onPress={() => chooseSection(item)}>
              <Text style={[styles.tabText, section === item && styles.tabTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        {section === 'CORPO' ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Proporções corporais</Text>
            <Text style={styles.panelCopy}>Comece por uma base visual, confirme suas medidas e refine somente o que fizer sentido.</Text>

            <ChoiceRow
              label="APRESENTAÇÃO CORPORAL"
              options={[
                { id: 'feminine', label: 'Feminina' },
                { id: 'neutral', label: 'Neutra' },
                { id: 'masculine', label: 'Masculina' },
              ]}
              value={spec.body.presentation}
              onChange={(value) => updateBody('presentation', value)}
            />
            <ChoiceRow label="BASE CORPORAL" options={BODY_PRESETS} value={bodyPreset} onChange={chooseBodyPreset} />

            <NumericControl label="ALTURA" value={spec.heightCm} min={145} max={195} step={1} suffix=" cm" onChange={(value) => setSpec((current) => ({ ...current, heightCm: value }))} />
            <NumericControl label="BUSTO" value={spec.measurements.bust} min={70} max={130} step={1} suffix=" cm" onChange={(value) => updateMeasurement('bust', value)} />
            <NumericControl label="CINTURA" value={spec.measurements.waist} min={55} max={120} step={1} suffix=" cm" onChange={(value) => updateMeasurement('waist', value)} />
            <NumericControl label="QUADRIL" value={spec.measurements.hips} min={75} max={140} step={1} suffix=" cm" onChange={(value) => updateMeasurement('hips', value)} />

            <AdvancedToggle expanded={advancedBody} onPress={() => setAdvancedBody((value) => !value)} label="AJUSTES AVANÇADOS DO CORPO" />
            {advancedBody ? (
              <View>
                <MorphControl label="PESO VISUAL" value={spec.body.weight} left="Mais enxuto" right="Mais volume" onChange={(value) => updateBody('weight', value)} />
                <MorphControl label="MUSCULATURA" value={spec.body.muscle} left="Suave" right="Definida" onChange={(value) => updateBody('muscle', value)} />
                <MorphControl label="OMBROS" value={spec.body.shoulders} left="Estreitos" right="Largos" onChange={(value) => updateBody('shoulders', value)} />
                <MorphControl label="TÓRAX" value={spec.body.chest} left="Estreito" right="Profundo" onChange={(value) => updateBody('chest', value)} />
                <MorphControl label="CINTURA 3D" value={spec.body.waist} left="Marcada" right="Ampla" onChange={(value) => updateBody('waist', value)} />
                <MorphControl label="QUADRIL 3D" value={spec.body.hips} left="Estreito" right="Amplo" onChange={(value) => updateBody('hips', value)} />
                <MorphControl label="ABDÔMEN" value={spec.body.belly} left="Definido" right="Mais volume" onChange={(value) => updateBody('belly', value)} />
                <MorphControl label="BRAÇOS" value={spec.body.arms} left="Finos" right="Volumosos" onChange={(value) => updateBody('arms', value)} />
                <MorphControl label="COMPRIMENTO DOS BRAÇOS" value={spec.body.armsLength} left="Curtos" right="Longos" onChange={(value) => updateBody('armsLength', value)} />
                <MorphControl label="COXAS" value={spec.body.thighs} left="Finas" right="Volumosas" onChange={(value) => updateBody('thighs', value)} />
                <MorphControl label="PANTURRILHAS" value={spec.body.calves} left="Finas" right="Volumosas" onChange={(value) => updateBody('calves', value)} />
                <MorphControl label="GLÚTEOS" value={spec.body.glutes} left="Discretos" right="Projetados" onChange={(value) => updateBody('glutes', value)} />
                <MorphControl label="COMPRIMENTO DAS PERNAS" value={spec.body.legsLength} left="Curtas" right="Longas" onChange={(value) => updateBody('legsLength', value)} />
              </View>
            ) : null}
          </View>
        ) : null}

        {section === 'ROSTO' ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Estrutura do rosto</Text>
            <Text style={styles.panelCopy}>Escolha uma forma-base e aparência primeiro. Os ajustes anatômicos finos ficam disponíveis quando você quiser refinar.</Text>

            <ChoiceRow label="FORMATO-BASE" options={FACE_SHAPES} value={spec.face.shape} onChange={(value) => updateFace('shape', value)} />
            <ColorRow label="TOM DE PELE" colors={SKIN_TONES} value={spec.appearance.skinTone} onChange={(value) => updateAppearance('skinTone', value)} />
            <ColorRow label="COR DOS OLHOS" colors={EYE_COLORS} value={spec.appearance.eyeColor} onChange={(value) => updateAppearance('eyeColor', value)} />

            <AdvancedToggle expanded={advancedFace} onPress={() => setAdvancedFace((value) => !value)} label="AJUSTES AVANÇADOS DO ROSTO" />
            {advancedFace ? (
              <View>
                <MorphControl label="LARGURA DO ROSTO" value={spec.face.width} left="Estreito" right="Largo" onChange={(value) => updateFace('width', value)} />
                <MorphControl label="MANDÍBULA" value={spec.face.jaw} left="Delicada" right="Marcada" onChange={(value) => updateFace('jaw', value)} />
                <MorphControl label="QUEIXO" value={spec.face.chin} left="Curto" right="Longo" onChange={(value) => updateFace('chin', value)} />
                <MorphControl label="PROJEÇÃO DO QUEIXO" value={spec.face.chinProjection} left="Recuado" right="Projetado" onChange={(value) => updateFace('chinProjection', value)} />
                <MorphControl label="MAÇÃS DO ROSTO" value={spec.face.cheek} left="Definidas" right="Cheias" onChange={(value) => updateFace('cheek', value)} />
                <MorphControl label="TESTA" value={spec.face.forehead} left="Baixa" right="Alta" onChange={(value) => updateFace('forehead', value)} />
                <MorphControl label="PONTE DO NARIZ" value={spec.face.noseBridge} left="Estreita" right="Larga" onChange={(value) => updateFace('noseBridge', value)} />
                <MorphControl label="LARGURA DO NARIZ" value={spec.face.noseWidth} left="Estreito" right="Largo" onChange={(value) => updateFace('noseWidth', value)} />
                <MorphControl label="COMPRIMENTO DO NARIZ" value={spec.face.noseLength} left="Curto" right="Longo" onChange={(value) => updateFace('noseLength', value)} />
                <MorphControl label="PROJEÇÃO DO NARIZ" value={spec.face.noseProjection} left="Recuado" right="Projetado" onChange={(value) => updateFace('noseProjection', value)} />
                <MorphControl label="TAMANHO DOS OLHOS" value={spec.face.eyesSize} left="Pequenos" right="Grandes" onChange={(value) => updateFace('eyesSize', value)} />
                <MorphControl label="ESPAÇAMENTO DOS OLHOS" value={spec.face.eyesSpacing} left="Próximos" right="Afastados" onChange={(value) => updateFace('eyesSpacing', value)} />
                <MorphControl label="ALTURA DOS OLHOS" value={spec.face.eyesHeight} left="Baixos" right="Altos" onChange={(value) => updateFace('eyesHeight', value)} />
                <MorphControl label="LARGURA DA BOCA" value={spec.face.mouthWidth} left="Estreita" right="Larga" onChange={(value) => updateFace('mouthWidth', value)} />
                <MorphControl label="VOLUME DOS LÁBIOS" value={spec.face.lipFullness} left="Finos" right="Volumosos" onChange={(value) => updateFace('lipFullness', value)} />
              </View>
            ) : null}
          </View>
        ) : null}

        {section === 'CABELO' ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Cabelo 3D</Text>
            <Text style={styles.panelCopy}>Os quatro estilos atuais são geometrias 3D CC0, não formas desenhadas sobre a cabeça.</Text>

            <View style={styles.hairGrid}>
              {HAIR_STYLES.map((hair) => (
                <Pressable
                  key={hair.id}
                  style={[styles.hairCard, spec.appearance.hairStyle === hair.id && styles.hairCardActive]}
                  onPress={() => updateAppearance('hairStyle', hair.id)}
                >
                  <View style={[styles.hairGlyph, { backgroundColor: spec.appearance.hairColor }]} />
                  <Text style={[styles.hairLabel, spec.appearance.hairStyle === hair.id && styles.hairLabelActive]}>{hair.label}</Text>
                </Pressable>
              ))}
            </View>
            <ColorRow label="COR DO CABELO" colors={HAIR_COLORS} value={spec.appearance.hairColor} onChange={(value) => updateAppearance('hairColor', value)} />
          </View>
        ) : null}

        <View style={styles.realisticCard}>
          <View style={styles.realisticCopy}>
            <Text style={styles.realisticTag}>ROTA PREMIUM · FOTOS</Text>
            <Text style={styles.realisticTitle}>Quer mais semelhança facial?</Text>
            <Text style={styles.realisticText}>Use o Avatar Realista para gerar uma identidade 3D a partir de fotos com provedor especializado. O avatar paramétrico continua sendo o modo controlável e sem lock-in.</Text>
          </View>
          <Pressable style={styles.realisticButton} onPress={() => navigation.navigate('Avatar Realista')}>
            <Text style={styles.realisticButtonText}>ABRIR AVATAR REALISTA →</Text>
          </Pressable>
        </View>

        <View style={styles.quality}>
          <Text style={styles.qualityTag}>QUALIDADE E LIMITES</Text>
          <Text style={styles.qualityText}>
            Este avatar usa uma malha humana paramétrica licenciada em CC0 com centenas de morph targets. A forma pode representar medidas e características faciais, mas não deve ser tratada como escaneamento biométrico nem garantia de caimento físico de roupa.
          </Text>
        </View>

        <Pressable style={styles.save} onPress={save}><Text style={styles.saveText}>SALVAR AVATAR PROFISSIONAL →</Text></Pressable>
      </ScrollView>
    </View>
  );
}

function ChoiceRow({ label, options, value, onChange }) {
  return (
    <View style={styles.control}>
      <Text style={styles.controlLabel}>{label}</Text>
      <View style={styles.choiceRow}>
        {options.map((option) => (
          <Pressable
            key={option.id}
            style={[styles.choice, value === option.id && styles.choiceActive]}
            onPress={() => onChange(option.id)}
          >
            <Text style={[styles.choiceText, value === option.id && styles.choiceTextActive]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function AdvancedToggle({ expanded, label, onPress }) {
  return (
    <Pressable style={styles.advancedToggle} onPress={onPress}>
      <View>
        <Text style={styles.advancedToggleLabel}>{label}</Text>
        <Text style={styles.advancedToggleCopy}>{expanded ? 'Ocultar refinamentos' : 'Abrir refinamentos anatômicos'}</Text>
      </View>
      <Text style={styles.advancedToggleIcon}>{expanded ? '−' : '+'}</Text>
    </Pressable>
  );
}

function NumericControl({ label, value, min, max, step, suffix, onChange }) {
  return (
    <View style={styles.control}>
      <View style={styles.controlHeader}><Text style={styles.controlLabel}>{label}</Text><Text style={styles.controlValue}>{Math.round(value)}{suffix}</Text></View>
      <Slider minimumValue={min} maximumValue={max} step={step} value={value} onValueChange={onChange} minimumTrackTintColor={colors.accent} maximumTrackTintColor="#D8CEC5" thumbTintColor={colors.accent} />
    </View>
  );
}

function MorphControl({ label, value, left, right, onChange }) {
  return (
    <View style={styles.control}>
      <View style={styles.controlHeader}><Text style={styles.controlLabel}>{label}</Text><Text style={styles.controlValue}>{Math.round(value * 100)}%</Text></View>
      <Slider minimumValue={0} maximumValue={1} step={0.01} value={value} onValueChange={onChange} minimumTrackTintColor={colors.accent} maximumTrackTintColor="#D8CEC5" thumbTintColor={colors.accent} />
      <View style={styles.range}><Text style={styles.rangeText}>{left}</Text><Text style={styles.rangeText}>{right}</Text></View>
    </View>
  );
}

function ColorRow({ label, colors, value, onChange }) {
  return (
    <View style={styles.control}>
      <Text style={styles.controlLabel}>{label}</Text>
      <View style={styles.colorRow}>
        {colors.map((color) => (
          <Pressable key={color} style={[styles.colorOuter, value === color && styles.colorOuterActive]} onPress={() => onChange(color)}>
            <View style={[styles.color, { backgroundColor: color }]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F3EE' },
  top: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12, backgroundColor: '#0B0B0C', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { color: colors.gold, fontSize: 7, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: '#FFFFFF', fontFamily: 'serif', fontSize: 25, marginTop: 2 },
  saveTop: { borderWidth: 1, borderColor: '#61554A', paddingHorizontal: 12, paddingVertical: 8 },
  saveTopText: { color: '#FFFFFF', fontSize: 7, fontWeight: '900', letterSpacing: 1.1 },
  content: { padding: 16, paddingBottom: 80 },
  tabs: { flexDirection: 'row', marginTop: 14, borderWidth: 1, borderColor: '#DDD4CC' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#FFFFFF' },
  tabActive: { backgroundColor: '#111112' },
  tabText: { color: '#7A7068', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  tabTextActive: { color: '#FFFFFF' },
  panel: { marginTop: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E1D8D0', padding: 16 },
  panelTitle: { color: '#151515', fontFamily: 'serif', fontSize: 27 },
  panelCopy: { color: '#756B63', fontSize: 10, lineHeight: 16, marginTop: 5, marginBottom: 16 },
  control: { marginTop: 15 },
  controlHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  controlLabel: { color: '#5F5750', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  controlValue: { color: colors.accent, fontSize: 9, fontWeight: '900' },
  range: { flexDirection: 'row', justifyContent: 'space-between' },
  rangeText: { color: '#9A9088', fontSize: 7 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9 },
  choice: { borderWidth: 1, borderColor: '#D8CEC5', paddingHorizontal: 10, paddingVertical: 9 },
  choiceActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  choiceText: { color: '#5F5750', fontSize: 8, fontWeight: '800' },
  choiceTextActive: { color: '#FFFFFF' },
  advancedToggle: { marginTop: 18, borderWidth: 1, borderColor: '#D8CEC5', backgroundColor: '#F8F4EF', paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  advancedToggleLabel: { color: '#38332F', fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  advancedToggleCopy: { color: '#8A8078', fontSize: 8, marginTop: 3 },
  advancedToggleIcon: { color: colors.accent, fontSize: 20, fontWeight: '500' },
  colorRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  colorOuter: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: 'transparent', padding: 3 },
  colorOuterActive: { borderColor: colors.accent },
  color: { flex: 1, borderRadius: 16 },
  hairGrid: { flexDirection: 'row', gap: 8, marginTop: 8 },
  hairCard: { flex: 1, minHeight: 82, borderWidth: 1, borderColor: '#D8CEC5', alignItems: 'center', justifyContent: 'center' },
  hairCardActive: { borderColor: colors.accent, backgroundColor: '#F5EBE8' },
  hairGlyph: { width: 30, height: 34, borderTopLeftRadius: 15, borderTopRightRadius: 15, borderBottomLeftRadius: 9, borderBottomRightRadius: 9 },
  hairLabel: { color: '#756B63', fontSize: 7, fontWeight: '800', marginTop: 7 },
  hairLabelActive: { color: colors.accent },
  realisticCard: { marginTop: 18, backgroundColor: '#111112', padding: 16, borderWidth: 1, borderColor: '#2B2927' },
  realisticCopy: { marginBottom: 13 },
  realisticTag: { color: colors.gold, fontSize: 7, fontWeight: '900', letterSpacing: 1.1 },
  realisticTitle: { color: '#FFFFFF', fontFamily: 'serif', fontSize: 24, marginTop: 5 },
  realisticText: { color: '#B9B0A7', fontSize: 9, lineHeight: 15, marginTop: 5 },
  realisticButton: { borderWidth: 1, borderColor: colors.gold, padding: 12, alignItems: 'center' },
  realisticButtonText: { color: colors.gold, fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  quality: { marginTop: 18, backgroundColor: '#ECE5DE', borderLeftWidth: 3, borderLeftColor: colors.gold, padding: 15 },
  qualityTag: { color: colors.gold, fontSize: 7, fontWeight: '900', letterSpacing: 1.1 },
  qualityText: { color: '#615950', fontSize: 9, lineHeight: 15, marginTop: 5 },
  save: { marginTop: 16, backgroundColor: colors.accent, padding: 16, alignItems: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
});
