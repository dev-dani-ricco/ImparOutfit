import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

export default function RegisterScreen() {
  const { demoMode, register } = useAuth();
  const [profileType, setProfileType] = useState('PERSON');
  const [form, setForm] = useState({ name: '', email: '', password: '', storeName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setError('');
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    if (!form.name.trim()) return setError('Informe seu nome.');
    if (!form.email.includes('@')) return setError('Informe um e-mail válido.');
    if (!demoMode && form.password.length < 10) return setError('A senha precisa ter pelo menos 10 caracteres.');
    if (profileType === 'STORE' && !form.storeName.trim()) return setError('Informe o nome da marca.');

    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password || 'presentation',
        profileType,
        store: profileType === 'STORE' ? { storeName: form.storeName.trim() } : undefined,
      });
    } catch (caught) {
      setError(caught.message || 'Não foi possível criar a conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>{demoMode ? 'ONBOARDING DEMONSTRATIVO' : 'BEM-VINDA À IMPAR'}</Text>
      <Text style={styles.heading}>Crie sua presença.</Text>
      <Text style={styles.description}>Escolha como você deseja viver a experiência IMPAR Outfit.</Text>

      <View style={styles.roles}>
        <Role
          active={profileType === 'PERSON'}
          title="Cliente"
          description="Estilo e armário"
          onPress={() => setProfileType('PERSON')}
        />
        <Role
          active={profileType === 'STORE'}
          title="Marca"
          description="Vitrine e gestão"
          onPress={() => setProfileType('STORE')}
        />
      </View>

      <Field label="NOME" value={form.name} onChangeText={(value) => update('name', value)} />
      <Field
        label="E-MAIL"
        value={form.email}
        onChangeText={(value) => update('email', value)}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {!demoMode ? (
        <Field label="SENHA" value={form.password} onChangeText={(value) => update('password', value)} secureTextEntry />
      ) : null}
      {profileType === 'STORE' ? (
        <Field label="NOME DA MARCA" value={form.storeName} onChangeText={(value) => update('storeName', value)} />
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={submit} disabled={loading}>
        {loading
          ? <ActivityIndicator color={colors.bg} />
          : <Text style={styles.buttonText}>{demoMode ? 'INICIAR EXPERIÊNCIA →' : 'CRIAR CONTA →'}</Text>}
      </Pressable>
      {demoMode ? (
        <Text style={styles.note}>Os dados informados são usados apenas nesta apresentação local.</Text>
      ) : null}
    </ScrollView>
  );
}

function Role({ active, title, description, onPress }) {
  return (
    <Pressable style={[styles.role, active && styles.roleActive]} onPress={onPress}>
      <Text style={[styles.roleTitle, active && styles.roleActiveText]}>{title}</Text>
      <Text style={[styles.roleDescription, active && styles.roleActiveText]}>{description}</Text>
    </Pressable>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput {...props} style={styles.input} placeholderTextColor={colors.muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 28, paddingTop: 34, paddingBottom: 45 },
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 2.2 },
  heading: { fontFamily: 'serif', fontSize: 39, color: colors.text, marginTop: 7 },
  description: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 25 },
  roles: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  role: { flex: 1, borderWidth: 1, borderColor: colors.line, padding: 15 },
  roleActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  roleTitle: { color: colors.text, fontFamily: 'serif', fontSize: 21 },
  roleDescription: { color: colors.muted, fontSize: 9, marginTop: 3 },
  roleActiveText: { color: colors.bg },
  field: { marginTop: 15 },
  fieldLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  input: { borderBottomWidth: 1, borderColor: colors.line, paddingVertical: 11, fontSize: 16, color: colors.text },
  error: { color: colors.accent, marginTop: 16 },
  button: { backgroundColor: colors.primary, padding: 18, alignItems: 'center', marginTop: 25 },
  buttonText: { color: colors.bg, fontWeight: '800', letterSpacing: 1.7, fontSize: 10 },
  note: { color: colors.muted, fontSize: 9, textAlign: 'center', marginTop: 14 },
});
