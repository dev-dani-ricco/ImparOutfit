import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import { colors } from '../theme/colors';

export default function StoreAccountScreen() {
  const { user, activeContext, switchContext, logout, demoMode } = useAuth();
  const { stores, resetDemo } = useDemo();
  const membership = user?.contexts?.find((context) => context.organization_id === activeContext);
  const store = stores.find((item) => item.id === membership?.store_id);

  const toPersonal = async () => {
    await Haptics.selectionAsync().catch(() => {});
    switchContext('personal');
  };

  const reset = () => Alert.alert(
    'Reiniciar apresentação?',
    'Os dados fictícios dessa jornada voltarão ao estado inicial.',
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Reiniciar', style: 'destructive', onPress: resetDemo },
    ],
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.mode}>CONTEXTO ATIVO · LOJISTA</Text>
      <Text style={styles.title}>{store?.store_name || membership?.store_name || 'Minha marca'}</Text>
      <Text style={styles.subtitle}>Este ambiente controla catálogo, mídia e sinais comerciais. Seu armário pessoal continua isolado.</Text>

      <View style={styles.identity}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name?.slice(0, 1) || 'L'}</Text></View>
        <View style={styles.identityCopy}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        <View style={styles.role}><Text style={styles.roleText}>LOJISTA</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTag}>CONTEXTOS</Text>
        <Text style={styles.sectionTitle}>Uma pessoa, ambientes separados.</Text>
        <Pressable style={styles.personalCard} onPress={toPersonal}>
          <Text style={styles.personalTag}>CONTEXTO PESSOAL</Text>
          <Text style={styles.personalTitle}>Abrir meu armário e avatar</Text>
          <Text style={styles.personalText}>Troca de contexto sem misturar dados privados com dados da marca.</Text>
          <Text style={styles.arrow}>→</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTag}>CAPACIDADES</Text>
        <Text style={styles.sectionTitle}>O que este contexto pode fazer.</Text>
        <View style={styles.capabilities}>
          {(membership?.capabilities || []).map((capability) => <Text key={capability} style={styles.capability}>{capability}</Text>)}
        </View>
      </View>

      {demoMode ? (
        <View style={styles.demo}>
          <Text style={styles.demoTag}>APRESENTAÇÃO</Text>
          <Text style={styles.demoText}>A jornada da marca usa dados fictícios e pode ser reiniciada antes de uma reunião.</Text>
          <Pressable style={styles.outline} onPress={reset}><Text style={styles.outlineText}>REINICIAR DADOS DA DEMO</Text></Pressable>
        </View>
      ) : null}

      <Pressable style={styles.logout} onPress={logout}><Text style={styles.logoutText}>{demoMode ? 'TROCAR JORNADA' : 'SAIR DA CONTA'}</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F3EE' },
  content: { padding: 20, paddingBottom: 110 },
  mode: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.6 },
  title: { color: '#151515', fontFamily: 'serif', fontSize: 38, lineHeight: 41, marginTop: 6 },
  subtitle: { color: '#70675F', fontSize: 12, lineHeight: 19, marginTop: 8, maxWidth: 360 },
  identity: { flexDirection: 'row', alignItems: 'center', marginTop: 28, paddingVertical: 18, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#DDD4CC' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#111112', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.gold, fontFamily: 'serif', fontSize: 21 },
  identityCopy: { flex: 1, marginLeft: 12 },
  name: { color: '#151515', fontSize: 14, fontWeight: '800' },
  email: { color: '#7C726A', fontSize: 10, marginTop: 3 },
  role: { borderWidth: 1, borderColor: colors.accent, paddingHorizontal: 8, paddingVertical: 5 },
  roleText: { color: colors.accent, fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  section: { marginTop: 28 },
  sectionTag: { color: colors.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.4 },
  sectionTitle: { color: '#151515', fontFamily: 'serif', fontSize: 25, marginTop: 5 },
  personalCard: { marginTop: 14, padding: 18, backgroundColor: '#111112' },
  personalTag: { color: colors.gold, fontSize: 7, fontWeight: '900', letterSpacing: 1.2 },
  personalTitle: { color: '#FFFFFF', fontFamily: 'serif', fontSize: 22, marginTop: 5 },
  personalText: { color: '#BEB6AE', fontSize: 10, lineHeight: 16, marginTop: 5, paddingRight: 32 },
  arrow: { position: 'absolute', right: 18, bottom: 18, color: '#FFFFFF', fontSize: 24 },
  capabilities: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  capability: { color: '#5F5750', backgroundColor: '#ECE5DE', paddingHorizontal: 9, paddingVertical: 7, fontSize: 8, fontWeight: '800' },
  demo: { marginTop: 30, padding: 16, backgroundColor: '#EDE5DC', borderLeftWidth: 3, borderLeftColor: colors.gold },
  demoTag: { color: colors.gold, fontSize: 7, fontWeight: '900', letterSpacing: 1.2 },
  demoText: { color: '#625A53', fontSize: 10, lineHeight: 16, marginTop: 5 },
  outline: { marginTop: 12, borderWidth: 1, borderColor: '#B9AEA4', padding: 11, alignItems: 'center' },
  outlineText: { color: '#151515', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  logout: { marginTop: 16, backgroundColor: colors.accent, padding: 14, alignItems: 'center' },
  logoutText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
});
