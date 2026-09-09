import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDemo } from '../contexts/DemoContext';
import { formatPlanPrice, WARDROBE_PLANS } from '../config/wardrobePlans';
import { colors } from '../theme/colors';

export default function WardrobePlansScreen({ navigation }) {
  const { changeWardrobePlan, wardrobeCapacity } = useDemo();

  function selectPlan(plan) {
    const result = changeWardrobePlan(plan.id);
    if (!result.ok) {
      Alert.alert(
        'Plano incompatível',
        `Seu armário tem ${wardrobeCapacity.used} peças. Este plano comporta até ${plan.limit}.`
      );
      return;
    }

    Alert.alert(
      plan.id === wardrobeCapacity.plan.id ? 'Plano atual' : 'Capacidade atualizada',
      `Seu armário agora comporta até ${plan.limit} peças.`,
      [{ text: 'Voltar ao armário', onPress: () => navigation.goBack() }]
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>CAPACIDADE DO ARMÁRIO</Text>
      <Text style={styles.title}>Espaço para cada fase.</Text>
      <Text style={styles.description}>
        Escolha a capacidade que acompanha o tamanho do seu acervo digital.
      </Text>

      <View style={styles.usageCard}>
        <View style={styles.usageHeader}>
          <View>
            <Text style={styles.usageLabel}>PLANO ATUAL</Text>
            <Text style={styles.usagePlan}>{wardrobeCapacity.plan.name}</Text>
          </View>
          <Text style={styles.usageValue}>
            {wardrobeCapacity.used}/{wardrobeCapacity.limit}
          </Text>
        </View>
        <View style={styles.progress}>
          <View style={[styles.progressFill, { width: `${wardrobeCapacity.percentage}%` }]} />
        </View>
        <Text style={styles.usageHint}>
          {wardrobeCapacity.isFull
            ? 'Seu armário atingiu o limite deste plano.'
            : `${wardrobeCapacity.available} espaços disponíveis.`}
        </Text>
      </View>

      {WARDROBE_PLANS.map((plan) => {
        const current = plan.id === wardrobeCapacity.plan.id;
        const incompatible = wardrobeCapacity.used > plan.limit;
        return (
          <View key={plan.id} style={[styles.planCard, current && styles.currentCard]}>
            <View style={styles.planHeader}>
              <View style={styles.planTitleRow}>
                <Text style={styles.planName}>{plan.name}</Text>
                {current ? <Text style={styles.currentBadge}>ATUAL</Text> : null}
              </View>
              <Text style={styles.price}>{formatPlanPrice(plan.priceMonthly)}</Text>
            </View>
            <Text style={styles.planDescription}>{plan.description}</Text>
            <Text style={styles.capacity}>{plan.limit} PEÇAS 2D + 3D</Text>
            {plan.benefits.map((benefit) => (
              <Text key={benefit} style={styles.benefit}>✓ {benefit}</Text>
            ))}
            <Pressable
              disabled={current || incompatible}
              style={[
                styles.selectButton,
                current && styles.currentButton,
                incompatible && styles.disabledButton,
              ]}
              onPress={() => selectPlan(plan)}
            >
              <Text style={[styles.selectText, current && styles.currentButtonText]}>
                {current
                  ? 'PLANO ATIVO'
                  : incompatible
                    ? `REMOVA ${wardrobeCapacity.used - plan.limit} PEÇAS PARA ESCOLHER`
                    : plan.limit > wardrobeCapacity.limit ? 'AUMENTAR CAPACIDADE →' : 'ESCOLHER ESTE PLANO'}
              </Text>
            </Pressable>
          </View>
        );
      })}

      <Text style={styles.disclaimer}>
        Na apresentação, a alteração é simulada e não realiza cobrança. A ativação comercial dependerá da confirmação do pagamento.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 18, paddingBottom: 40 },
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  title: { color: colors.text, fontFamily: 'serif', fontSize: 35, marginTop: 7 },
  description: { color: colors.muted, lineHeight: 20, marginTop: 8, marginBottom: 20 },
  usageCard: { padding: 16, backgroundColor: colors.primary, marginBottom: 18 },
  usageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  usageLabel: { color: colors.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  usagePlan: { color: colors.bg, fontFamily: 'serif', fontSize: 25, marginTop: 3 },
  usageValue: { color: colors.bg, fontSize: 21, fontWeight: '900' },
  progress: { height: 7, backgroundColor: '#35312E', marginTop: 14 },
  progressFill: { height: '100%', backgroundColor: colors.gold },
  usageHint: { color: colors.bg, fontSize: 10, marginTop: 8 },
  planCard: { borderWidth: 1, borderColor: colors.line, padding: 17, marginBottom: 14 },
  currentCard: { borderColor: colors.accent, borderWidth: 2 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planName: { color: colors.text, fontFamily: 'serif', fontSize: 27 },
  currentBadge: { color: colors.bg, backgroundColor: colors.accent, paddingHorizontal: 7, paddingVertical: 4, fontSize: 7, fontWeight: '900' },
  price: { color: colors.accent, fontSize: 12, fontWeight: '900', marginTop: 7 },
  planDescription: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 7 },
  capacity: { color: colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginTop: 14, marginBottom: 7 },
  benefit: { color: colors.muted, fontSize: 10, marginTop: 5 },
  selectButton: { backgroundColor: colors.accent, padding: 13, alignItems: 'center', marginTop: 16 },
  currentButton: { backgroundColor: colors.surface },
  disabledButton: { backgroundColor: colors.muted, opacity: 0.55 },
  selectText: { color: colors.bg, fontSize: 8, fontWeight: '900', letterSpacing: 0.9, textAlign: 'center' },
  currentButtonText: { color: colors.accent },
  disclaimer: { color: colors.muted, fontSize: 9, lineHeight: 15, textAlign: 'center', marginTop: 5 },
});
