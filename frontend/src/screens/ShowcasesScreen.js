import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import { initialShowcases } from '../demo/data';
import { colors } from '../theme/colors';

export default function ShowcasesScreen() {
  const [favorites, setFavorites] = useState({});
  const favoriteCount = Object.values(favorites).filter(Boolean).length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader
        step="04  •  INSPIRAR"
        eyebrow="VITRINES DIGITAIS"
        title="Coleções em destaque."
        description="Navegue por seleções completas e transforme inspiração em escolha."
        stats={[
          { value: initialShowcases.length, label: 'coleções' },
          { value: favoriteCount, label: 'favoritas agora' },
        ]}
      />
      {initialShowcases.map((item) => {
        const isFavorite = Boolean(favorites[item.id]);
        return (
          <Card
            key={item.id}
            image={item.image}
            subtitle={item.store_name}
            title={item.title}
            description={item.description}
          >
            <View style={styles.metrics}>
              <View>
                <Text style={styles.number}>{item.pieces}</Text>
                <Text style={styles.label}>PEÇAS</Text>
              </View>
              <View>
                <Text style={styles.number}>{item.rating}</Text>
                <Text style={styles.label}>AVALIAÇÃO</Text>
              </View>
            </View>
            <Pressable
              style={[styles.button, isFavorite && styles.active]}
              onPress={() =>
                setFavorites((current) => ({ ...current, [item.id]: !current[item.id] }))
              }
            >
              <Text style={[styles.buttonText, isFavorite && styles.activeText]}>
                {isFavorite ? '♥ FAVORITA — TOTAL +1' : '♡  FAVORITAR COLEÇÃO'}
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
  metrics: { flexDirection: 'row', gap: 36, marginTop: 16, marginBottom: 14 },
  number: { color: colors.text, fontSize: 23, fontWeight: '800' },
  label: { color: colors.muted, fontSize: 8, fontWeight: '700', letterSpacing: 1.3 },
  button: {
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 13,
    alignItems: 'center',
  },
  active: { backgroundColor: colors.accent },
  buttonText: { color: colors.accent, fontWeight: '800', fontSize: 9, letterSpacing: 1.1 },
  activeText: { color: colors.bg },
});
