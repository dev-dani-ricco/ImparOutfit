import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import SponsoredAdCard from '../components/SponsoredAdCard';
import { useDemo } from '../contexts/DemoContext';
import { colors } from '../theme/colors';

const objectives = ['Visitas à vitrine', 'Salvar referência', 'Novos seguidores'];
const budgets = [35, 45, 80];

export default function StoreCampaignScreen() {
  const { campaignState, toggleCampaignStatus, updateCampaign } = useDemo();
  const [saved, setSaved] = useState(false);
  const active = campaignState.status === 'active';

  function chooseObjective(objective) {
    setSaved(false);
    updateCampaign({ objective });
  }

  function chooseBudget(dailyBudget) {
    setSaved(false);
    updateCampaign({ dailyBudget });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={styles.eyebrow}>GESTÃO DE MÍDIA • AD</Text>
          <View style={[styles.status, !active && styles.statusPaused]}>
            <View style={[styles.statusDot, !active && styles.statusDotPaused]} />
            <Text style={styles.statusText}>{active ? 'EM VEICULAÇÃO' : 'PAUSADA'}</Text>
          </View>
        </View>
        <Text style={styles.title}>Essenciais em Cores</Text>
        <Text style={styles.description}>Campanha do Ateliê Aurora entregue como anúncio nativo no Feed da cliente.</Text>
      </View>

      <View style={styles.metrics}>
        <Metric value="24,8k" label="alcance" />
        <Metric value="1.462" label="aberturas" />
        <Metric value="318" label="itens salvos" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionNumber}>01  •  CONFIGURAÇÃO</Text>
        <Text style={styles.sectionTitle}>Objetivo da campanha</Text>
        <Text style={styles.sectionCopy}>Defina a ação que deve ser priorizada na entrega deste AD.</Text>
        <View style={styles.choices}>
          {objectives.map((objective) => {
            const selected = campaignState.objective === objective;
            return (
              <Pressable
                key={objective}
                style={[styles.choice, selected && styles.choiceActive]}
                onPress={() => chooseObjective(objective)}
              >
                <Text style={[styles.choiceText, selected && styles.choiceTextActive]}>{selected ? '✓ ' : ''}{objective}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionNumber}>02  •  INVESTIMENTO</Text>
        <Text style={styles.sectionTitle}>Verba diária</Text>
        <Text style={styles.sectionCopy}>Simulação local para demonstrar a configuração comercial.</Text>
        <View style={styles.budgets}>
          {budgets.map((budget) => {
            const selected = campaignState.dailyBudget === budget;
            return (
              <Pressable
                key={budget}
                style={[styles.budget, selected && styles.budgetActive]}
                onPress={() => chooseBudget(budget)}
              >
                <Text style={[styles.budgetValue, selected && styles.budgetValueActive]}>R$ {budget}</Text>
                <Text style={[styles.budgetLabel, selected && styles.budgetLabelActive]}>POR DIA</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.estimate}>
          <Text style={styles.estimateLabel}>ESTIMATIVA DE ENTREGA</Text>
          <Text style={styles.estimateValue}>{(campaignState.dailyBudget * 410).toLocaleString('pt-BR')}–{(campaignState.dailyBudget * 620).toLocaleString('pt-BR')} pessoas / dia</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionNumber}>03  •  POSICIONAMENTO</Text>
        <Text style={styles.sectionTitle}>Prévia no Feed</Text>
        <Text style={styles.sectionCopy}>O rótulo “AD • conteúdo patrocinado” aparece antes da imagem e separa publicidade do conteúdo orgânico.</Text>
        <View style={styles.previewLabel}><Text style={styles.previewLabelText}>TELA DA CLIENTE • ENTRE PUBLICAÇÕES</Text></View>
        <SponsoredAdCard preview />
      </View>

      <View style={styles.controls}>
        <Pressable style={[styles.saveButton, saved && styles.savedButton]} onPress={() => setSaved(true)}>
          <Text style={styles.saveText}>{saved ? '✓ CONFIGURAÇÃO SALVA' : 'SALVAR CONFIGURAÇÃO →'}</Text>
        </Pressable>
        <Pressable style={[styles.statusButton, !active && styles.reactivateButton]} onPress={toggleCampaignStatus}>
          <Text style={[styles.statusButtonText, !active && styles.reactivateText]}>
            {active ? 'PAUSAR VEICULAÇÃO' : 'REATIVAR AD NO FEED'}
          </Text>
        </Pressable>
        <Text style={styles.controlHint}>
          {active
            ? 'O anúncio está visível na jornada da cliente.'
            : 'Enquanto pausado, o anúncio deixa de aparecer no Feed da cliente.'}
        </Text>
      </View>
    </ScrollView>
  );
}

function Metric({ value, label }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  hero: { backgroundColor: colors.primary, padding: 22, paddingTop: 28, paddingBottom: 30 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: colors.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.7 },
  status: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#4B6344', paddingHorizontal: 8, paddingVertical: 6 },
  statusPaused: { borderColor: '#72545C' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#A9D19E', marginRight: 6 },
  statusDotPaused: { backgroundColor: '#D8A5B2' },
  statusText: { color: colors.bg, fontSize: 6, fontWeight: '900', letterSpacing: 0.9 },
  title: { color: colors.bg, fontFamily: 'serif', fontSize: 35, marginTop: 18 },
  description: { color: colors.line, fontSize: 11, lineHeight: 18, marginTop: 7 },
  metrics: { marginHorizontal: 18, flexDirection: 'row', borderWidth: 1, borderColor: colors.line },
  metric: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  metricValue: { color: colors.accent, fontFamily: 'serif', fontSize: 22, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 7, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  section: { marginHorizontal: 18, marginTop: 30, borderTopWidth: 1, borderColor: colors.line, paddingTop: 14 },
  sectionNumber: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  sectionTitle: { color: colors.text, fontFamily: 'serif', fontSize: 27, marginTop: 5 },
  sectionCopy: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 5, marginBottom: 13 },
  choices: { gap: 8 },
  choice: { borderWidth: 1, borderColor: colors.line, padding: 13 },
  choiceActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  choiceText: { color: colors.text, fontSize: 10, fontWeight: '800' },
  choiceTextActive: { color: colors.bg },
  budgets: { flexDirection: 'row', gap: 8 },
  budget: { flex: 1, borderWidth: 1, borderColor: colors.line, paddingVertical: 13, alignItems: 'center' },
  budgetActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  budgetValue: { color: colors.text, fontFamily: 'serif', fontSize: 20, fontWeight: '900' },
  budgetValueActive: { color: colors.bg },
  budgetLabel: { color: colors.muted, fontSize: 6, fontWeight: '900', letterSpacing: 0.8, marginTop: 2 },
  budgetLabelActive: { color: colors.gold },
  estimate: { backgroundColor: colors.surface, padding: 13, marginTop: 10 },
  estimateLabel: { color: colors.gold, fontSize: 7, fontWeight: '900', letterSpacing: 1.1 },
  estimateValue: { color: colors.text, fontSize: 11, fontWeight: '800', marginTop: 4 },
  previewLabel: { backgroundColor: colors.gold, padding: 8, alignItems: 'center' },
  previewLabelText: { color: colors.primary, fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  controls: { margin: 18, marginTop: 31, padding: 15, backgroundColor: colors.surface },
  saveButton: { backgroundColor: colors.primary, padding: 15, alignItems: 'center' },
  savedButton: { backgroundColor: colors.accent },
  saveText: { color: colors.bg, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  statusButton: { marginTop: 8, borderWidth: 1, borderColor: colors.accent, padding: 13, alignItems: 'center' },
  reactivateButton: { backgroundColor: colors.accent },
  statusButtonText: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  reactivateText: { color: colors.bg },
  controlHint: { color: colors.muted, fontSize: 9, textAlign: 'center', marginTop: 9 },
});
