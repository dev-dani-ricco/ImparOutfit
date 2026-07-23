import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import { demoFeed } from '../demo/data';
import { colors } from '../theme/colors';

export default function FeedScreen() {
  const [saved, setSaved] = useState({});
  const savedCount = Object.values(saved).filter(Boolean).length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader
        step="01  •  DESCOBRIR"
        eyebrow="FEED PERSONALIZADO"
        title="Vista sua presença."
        description="Explore peças, looks e vitrines selecionados para você."
        stats={[
          { value: demoFeed.length, label: 'publicações' },
          { value: savedCount, label: 'salvas agora' },
        ]}
      />
      {demoFeed.map((item) => {
        const isSaved = Boolean(saved[item.id]);
        const totalSaves = item.saves + (isSaved ? 1 : 0);

        return (
          <Card
            key={item.id}
            image={item.image}
            subtitle={`${item.label} • ${item.author}`}
            title={item.title}
            description={item.description}
          >
            <View style={styles.metrics}>
              <View>
                <Text style={styles.metricValue}>{item.likes.toLocaleString('pt-BR')}</Text>
                <Text style={styles.metricLabel}>CURTIDAS</Text>
              </View>
              <View>
                <Text style={[styles.metricValue, isSaved && styles.changed]}>
                  {totalSaves.toLocaleString('pt-BR')}
                </Text>
                <Text style={styles.metricLabel}>SALVAMENTOS</Text>
              </View>
            </View>
            <Pressable
              style={[styles.button, isSaved && styles.active]}
              onPress={() => setSaved((current) => ({ ...current, [item.id]: !current[item.id] }))}
            >
              <Text style={styles.buttonText}>
                {isSaved ? '✓ SALVO — TOQUE PARA REMOVER' : '+1  SALVAR PUBLICAÇÃO'}
              </Text>
            </Pressable>
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingTop: 22, paddingBottom: 32 },
  metrics: { flexDirection: 'row', gap: 32, marginTop: 16, marginBottom: 14 },
  metricValue: { color: colors.text, fontSize: 22, fontWeight: '800' },
  changed: { color: colors.accent },
  metricLabel: { color: colors.muted, fontSize: 8, fontWeight: '700', letterSpacing: 1.2 },
  button: { backgroundColor: colors.primary, padding: 14, alignItems: 'center' },
  active: { backgroundColor: colors.accent },
  buttonText: { color: colors.bg, fontWeight: '800', fontSize: 9, letterSpacing: 1.2 },
});
