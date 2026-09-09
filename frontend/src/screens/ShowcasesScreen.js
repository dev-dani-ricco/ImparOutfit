import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import { useDemo } from '../contexts/DemoContext';
import { sponsoredCollections } from '../demo/data';
import { colors } from '../theme/colors';

export default function ShowcasesScreen({ navigation }) {
  const { favorites, toggleFavorite } = useDemo();
  const favoriteCount = sponsoredCollections.filter((item) => favorites[item.id]).length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader
        step="04  •  DESCOBRIR MARCAS"
        eyebrow="DESTAQUES PATROCINADOS"
        title="A vitrine das marcas."
        description="Espaço comercial para campanhas, lançamentos e itens impulsionados pelas marcas."
        stats={[
          { value: sponsoredCollections.length, label: 'campanhas' },
          { value: favoriteCount, label: 'favoritas' },
        ]}
      />
      <View style={styles.explainer}>
        <Text style={styles.explainerTag}>MÍDIA • MODELO ADS</Text>
        <Text style={styles.explainerTitle}>Este espaço é patrocinado.</Text>
        <Text style={styles.explainerCopy}>
          Diferente das coleções particulares, disponíveis dentro do seu Armário.
        </Text>
      </View>
      {sponsoredCollections.map((item) => {
        const isFavorite = Boolean(favorites[item.id]);
        return (
          <Card
            key={item.id}
            image={item.image}
            subtitle={`PATROCINADO • ${item.store_name}`}
            title={item.title}
            description={item.description}
          >
            <Text style={styles.campaign}>{item.campaign}</Text>
            <View style={styles.metrics}>
              <View>
                <Text style={styles.number}>{item.pieces}</Text>
                <Text style={styles.label}>ITENS DA CAMPANHA</Text>
              </View>
              <View>
                <Text style={styles.number}>{item.rating}</Text>
                <Text style={styles.label}>AVALIAÇÃO</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <Pressable
                style={styles.openButton}
                onPress={() => navigation.navigate('Loja do anúncio', { storeId: item.storeId })}
              >
                <Text style={styles.openButtonText}>ABRIR VITRINE →</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={isFavorite ? 'Remover destaque dos favoritos' : 'Favoritar destaque'}
                style={[styles.button, isFavorite && styles.active]}
                onPress={() => toggleFavorite(item.id)}
              >
                <Text style={[styles.buttonText, isFavorite && styles.activeText]}>
                  {isFavorite ? '◆' : '◇'}
                </Text>
              </Pressable>
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingTop: 22, paddingBottom: 32 },
  explainer: { marginHorizontal: 18, marginBottom: 26, padding: 16, backgroundColor: colors.primary },
  explainerTag: { color: colors.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.3 },
  explainerTitle: { color: colors.bg, fontFamily: 'serif', fontSize: 23, marginTop: 5 },
  explainerCopy: { color: colors.line, fontSize: 11, lineHeight: 17, marginTop: 5 },
  campaign: { alignSelf: 'flex-start', color: colors.gold, borderWidth: 1, borderColor: colors.gold, paddingHorizontal: 8, paddingVertical: 5, marginTop: 13, fontSize: 8, fontWeight: '900' },
  metrics: { flexDirection: 'row', gap: 36, marginTop: 16, marginBottom: 14 },
  number: { color: colors.text, fontSize: 23, fontWeight: '900' },
  label: { color: colors.muted, fontSize: 7, fontWeight: '800', letterSpacing: 1.1 },
  actions: { flexDirection: 'row', gap: 8 },
  openButton: { flex: 1, backgroundColor: colors.accent, padding: 13, alignItems: 'center' },
  openButtonText: { color: colors.bg, fontWeight: '900', fontSize: 8, letterSpacing: 1 },
  button: { width: 48, borderWidth: 1, borderColor: colors.accent, padding: 10, alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: colors.accent },
  buttonText: { color: colors.accent, fontWeight: '900', fontSize: 20 },
  activeText: { color: colors.bg },
});
