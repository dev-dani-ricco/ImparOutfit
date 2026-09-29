import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import * as Haptics from 'expo-haptics';

export default function LoginScreen({ navigation }) {
  const { demoMode, login, loginDemo, setDemoMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingRole, setLoadingRole] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setEmail('');
    setPassword('');
    setError('');
  }, [demoMode]);

  async function enterPresentation(role) {
    setError('');
    setLoadingRole(role);
    try {
      await Haptics.selectionAsync().catch(() => {});
      await loginDemo(role);
    } catch (caught) {
      setError(caught.message || 'Não foi possível abrir a apresentação.');
    } finally {
      setLoadingRole(null);
    }
  }

  async function handleLogin() {
    setError('');
    setLoadingRole('LOGIN');
    try {
      await login(email, password);
    } catch (caught) {
      setError(caught.message || 'Não foi possível entrar.');
    } finally {
      setLoadingRole(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Pressable onPress={()=>setDemoMode(!demoMode)}>
          <Text style={{color:colors.accent,padding:12}}>{demoMode?'TESTAR COM CONTA REAL':'VOLTAR À SHOWCASE'}</Text>
        </Pressable>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.brand}>IMPAR</Text>
            <Text style={styles.signature}>Outfit</Text>
          </View>
          {demoMode ? <Text style={styles.presentationBadge}>APRESENTAÇÃO</Text> : null}
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>GUARDA-ROUPA INTELIGENTE</Text>
          <Text style={styles.heading}>Sua imagem, com intenção.</Text>
          <Text style={styles.copy}>
            Descubra marcas, organize suas peças e transforme escolhas em uma experiência pessoal.
          </Text>
        </View>

        {demoMode ? (
          <View style={styles.presentation}>
            <Text style={styles.sectionLabel}>ESCOLHA COMO VOCÊ QUER TESTAR</Text>
            <Pressable
              disabled={Boolean(loadingRole)}
              style={styles.personButton}
              onPress={() => enterPresentation('PERSON')}
            >
              <View style={styles.roleIconDark}><Text style={styles.roleIconLight}>◇</Text></View>
              <View style={styles.roleCopy}>
                <Text style={styles.personEyebrow}>CLIENTE FINAL · EXPERIÊNCIA PESSOAL</Text>
                <Text style={styles.personTitle}>Explorar meu estilo</Text>
                <Text style={styles.personDescription}>Avatar pessoal, guarda-roupa, Looks, descoberta de marcas e Análise IMPAR.</Text>
              </View>
              {loadingRole === 'PERSON'
                ? <ActivityIndicator color={colors.bg} />
                : <Text style={styles.personArrow}>→</Text>}
            </Pressable>

            <Pressable
              disabled={Boolean(loadingRole)}
              style={styles.storeButton}
              onPress={() => enterPresentation('STORE')}
            >
              <View style={styles.roleIconLightWrap}><Text style={styles.roleIconDarkText}>▣</Text></View>
              <View style={styles.roleCopy}>
                <Text style={styles.storeEyebrow}>LOJISTA · CONTEXTO COMERCIAL</Text>
                <Text style={styles.storeTitle}>Gerenciar minha vitrine</Text>
                <Text style={styles.storeDescription}>Painel, catálogo, campanhas, prévias comerciais e capacidades da equipe.</Text>
              </View>
              {loadingRole === 'STORE'
                ? <ActivityIndicator color={colors.accent} />
                : <Text style={styles.storeArrow}>→</Text>}
            </Pressable>

            <View style={styles.demoNote}>
              <Text style={styles.demoNoteTitle}>PRONTO PARA O EXPO GO</Text>
              <Text style={styles.demoNoteCopy}>
                Os dados fictícios de cada jornada ficam separados. A cada abertura você escolhe Cliente final ou Lojista.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.sectionLabel}>HOMOLOGAÇÃO · CONTA REAL</Text>
            <Text style={styles.realModeNote}>Use uma conta criada neste ambiente ou crie uma nova abaixo. Credenciais da Showcase não funcionam aqui.</Text>
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Pressable style={styles.loginButton} onPress={handleLogin} disabled={Boolean(loadingRole)}>
              {loadingRole === 'LOGIN'
                ? <ActivityIndicator color={colors.bg} />
                : <Text style={styles.loginText}>ENTRAR →</Text>}
            </Pressable>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable onPress={() => navigation.navigate('Cadastro')}>
          <Text style={styles.registerLink}>{demoMode ? 'Criar uma nova conta' : 'CRIAR CONTA DE HOMOLOGAÇÃO →'}</Text>
        </Pressable>
        <Text style={styles.version}>IMPAR OUTFIT · EXPERIENCE PREVIEW 1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { flexGrow: 1, padding: 26, paddingTop: 34, paddingBottom: 30 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand: { fontSize: 24, letterSpacing: 7, color: colors.text, fontWeight: '800' },
  signature: { fontSize: 22, fontFamily: 'serif', fontStyle: 'italic', color: colors.accent, marginTop: -2 },
  presentationBadge: { color: colors.accent, borderWidth: 1, borderColor: colors.accent, paddingHorizontal: 9, paddingVertical: 6, fontSize: 7, fontWeight: '900', letterSpacing: 1.3 },
  hero: { marginTop: 42, marginBottom: 30 },
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 2.1 },
  heading: { fontFamily: 'serif', fontSize: 42, lineHeight: 46, color: colors.text, maxWidth: 330, marginTop: 8 },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 12, maxWidth: 345 },
  presentation: { gap: 12 },
  sectionLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.7, marginBottom: 4 },
  personButton: { minHeight: 116, backgroundColor: colors.primary, padding: 16, flexDirection: 'row', alignItems: 'center' },
  storeButton: { minHeight: 116, borderWidth: 1, borderColor: colors.accent, padding: 16, flexDirection: 'row', alignItems: 'center' },
  roleIconDark: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  roleIconLightWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  roleIconLight: { color: colors.gold, fontSize: 23 },
  roleIconDarkText: { color: colors.bg, fontSize: 17 },
  roleCopy: { flex: 1, marginHorizontal: 13 },
  personEyebrow: { color: colors.gold, fontSize: 7, fontWeight: '900', letterSpacing: 1.3 },
  personTitle: { color: colors.bg, fontFamily: 'serif', fontSize: 22, marginTop: 4 },
  personDescription: { color: colors.line, fontSize: 10, lineHeight: 15, marginTop: 4 },
  personArrow: { color: colors.bg, fontSize: 24 },
  storeEyebrow: { color: colors.accent, fontSize: 7, fontWeight: '900', letterSpacing: 1.3 },
  storeTitle: { color: colors.text, fontFamily: 'serif', fontSize: 22, marginTop: 4 },
  storeDescription: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  storeArrow: { color: colors.accent, fontSize: 24 },
  demoNote: { padding: 13, backgroundColor: colors.surface, borderLeftWidth: 3, borderLeftColor: colors.gold },
  demoNoteTitle: { color: colors.gold, fontSize: 7, fontWeight: '900', letterSpacing: 1.2 },
  demoNoteCopy: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  form: { gap: 8 },
  realModeNote: { color: colors.muted, fontSize: 11, lineHeight: 17, marginBottom: 4 },
  input: { borderBottomWidth: 1, borderColor: colors.line, paddingVertical: 14, color: colors.text, fontSize: 16 },
  loginButton: { backgroundColor: colors.primary, padding: 18, marginTop: 15, alignItems: 'center' },
  loginText: { color: colors.bg, fontWeight: '800', letterSpacing: 2, fontSize: 10 },
  error: { color: colors.accent, marginTop: 12, textAlign: 'center' },
  registerLink: { textAlign: 'center', marginTop: 22, color: colors.accent, textDecorationLine: 'underline', fontSize: 12 },
  version: { textAlign: 'center', marginTop: 28, color: colors.muted, fontSize: 7, letterSpacing: 1.3 },
});
