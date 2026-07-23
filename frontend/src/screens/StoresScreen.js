import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import { demoStores } from '../demo/data';
import { colors } from '../theme/colors';

export default function StoresScreen() {
  const [following, setFollowing] = useState({});
  const followingCount = Object.values(following).filter(Boolean).length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader
        step="02  •  CONECTAR"
        eyebrow="LOJAS SELECIONADAS"
        title="Marcas para descobrir."
        description="Acompanhe lojas independentes com identidade e propósito."
        stats={[
          { value: demoStores.length, label: 'lojas' },
          { value: followingCount, label: 'seguindo agora' },
        ]}
      />
      {demoStores.map((store) => {
        const isFollowing = Boolean(following[store.id]);
        const followers = store.followers + (isFollowing ? 1 : 0);

        return (
          <Card
            key={store.id}
            image={store.image}
            subtitle={`${store.category} • ${store.location}`}
            title={store.store_name}
          >
            <Text style={[styles.number, isFollowing && styles.changed]}>
              {followers.toLocaleString('pt-BR')}
            </Text>
            <Text style={styles.label}>SEGUIDORES</Text>
            <Pressable
              style={[styles.button, isFollowing && styles.active]}
              onPress={() =>
                setFollowing((current) => ({ ...current, [store.id]: !current[store.id] }))
              }
            >
              <Text style={styles.buttonText}>
                {isFollowing ? '✓ SEGUINDO — CONTAGEM +1' : '+1  SEGUIR ESTA LOJA'}
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
  number: { color: colors.text, fontSize: 25, fontWeight: '800', marginTop: 16 },
  changed: { color: colors.accent },
  label: { color: colors.muted, fontSize: 8, fontWeight: '700', letterSpacing: 1.3 },
  button: { backgroundColor: colors.primary, padding: 14, alignItems: 'center', marginTop: 14 },
  active: { backgroundColor: colors.accent },
  buttonText: { color: colors.bg, fontWeight: '800', fontSize: 9, letterSpacing: 1.2 },
});
