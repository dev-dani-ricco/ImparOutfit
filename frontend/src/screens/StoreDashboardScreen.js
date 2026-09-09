import React from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import { colors } from '../theme/colors';

const activity = [
  { id: 'a1', person: 'Camila Duarte', action: 'salvou', item: 'Bomber Nuvem Lilás', when: 'há 12 min' },
  { id: 'a2', person: 'Bianca Souza', action: 'seguiu', item: 'Ateliê Aurora', when: 'há 34 min' },
  { id: 'a3', person: 'Lívia Martins', action: 'favoritou', item: 'Vestido Horizonte', when: 'há 1 h' },
];

export default function StoreDashboardScreen({ navigation }) {
  const { logout, user, switchContext, activeContext } = useAuth();
  const { campaignState, commercialSaves, favorites, resetDemo, stores } = useDemo();
  const store = stores.find((item) => item.id === user?.contexts?.find(c=>c.organization_id===activeContext)?.store_id) ;
  if(!store)return <View><Text>Contexto indisponível.</Text></View>;
  const saves = Object.keys(commercialSaves).length + 86;
  const campaignFavorites = Object.keys(favorites).filter((id) => id.startsWith('showcase-')).length;

  function confirmReset() {
    Alert.alert(
      'Reiniciar apresentação?',
      'Curtidas, favoritos e itens adicionados voltarão ao estado inicial.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reiniciar', style: 'destructive', onPress: resetDemo },
      ]
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: store.brandColor }]}>
        <View style={styles.heroTop}>
          <View style={styles.logo}><Text style={[styles.logoText, { color: store.brandColor }]}>{store.initials}</Text></View>
          <View style={styles.live}><View style={styles.liveDot} /><Text style={styles.liveText}>VITRINE ATIVA</Text></View>
        </View>
        <Text style={styles.eyebrow}>PAINEL DA MARCA • DEMONSTRAÇÃO</Text>
        <Pressable onPress={()=>switchContext('personal')}><Text style={styles.subtitle}>ABRIR MEU CONTEXTO PESSOAL →</Text></Pressable>
        <Text style={styles.title}>Olá, {user?.name?.split(' ')[0]}.</Text>
        <Text style={styles.subtitle}>{store.store_name} está pronta para receber novas clientes.</Text>
      </View>

      <View style={styles.metrics}>
        <Metric value={store.items.length} label="itens ativos" />
        <Metric value={(store.followers / 1000).toFixed(1).replace('.', ',') + 'k'} label="seguidores" />
        <Metric value={saves} label="salvos" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>AÇÕES RÁPIDAS</Text>
        <Text style={styles.sectionTitle}>Conduza sua presença.</Text>
        <View style={styles.actions}>
          <Action icon="＋" title="Nova peça" description="Publique no catálogo" primary onPress={() => navigation.navigate('Nova peça')} />
          <Action icon="⌂" title="Ver vitrine" description="Visão da cliente" onPress={() => navigation.navigate('Prévia da vitrine')} />
          <Action
            icon="AD"
            title="Anúncios"
            description={campaignState.status === 'active' ? 'AD ativo no Feed' : 'Campanha pausada'}
            onPress={() => navigation.navigate('Campanhas')}
          />
          <Action icon="↗" title="Apresentação" description="Dados persistentes" onPress={() => Alert.alert('Modo apresentação', 'A experiência está funcionando localmente e pronta para o Expo Go.')} />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeadingRow}>
          <View>
            <Text style={styles.sectionEyebrow}>CATÁLOGO ATIVO</Text>
            <Text style={styles.sectionTitle}>Últimas peças</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Prévia da vitrine')}><Text style={styles.link}>VER TUDO →</Text></Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.products}>
          {store.items.map((item) => (
            <View key={item.id} style={styles.product}>
              <Image source={item.image} style={styles.productImage} />
              <Text numberOfLines={1} style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>{item.price}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>ENGAJAMENTO RECENTE</Text>
        <Text style={styles.sectionTitle}>Sinais de intenção.</Text>
        {activity.map((item) => (
          <View key={item.id} style={styles.activity}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{item.person.slice(0, 1)}</Text></View>
            <View style={styles.activityCopy}>
              <Text style={styles.activityPerson}>{item.person}</Text>
              <Text style={styles.activityAction}>{item.action} <Text style={styles.activityItem}>{item.item}</Text></Text>
            </View>
            <Text style={styles.when}>{item.when}</Text>
          </View>
        ))}
        {campaignFavorites ? <Text style={styles.signal}>＋ {campaignFavorites} nova interação em campanhas nesta apresentação.</Text> : null}
      </View>

      <View style={styles.presentationControls}>
        <Text style={styles.controlTitle}>CONTROLES DA APRESENTAÇÃO</Text>
        <Text style={styles.controlCopy}>Use estas ações para preparar o aplicativo antes de uma nova reunião.</Text>
        <View style={styles.controlRow}>
          <Pressable style={styles.secondaryButton} onPress={confirmReset}><Text style={styles.secondaryText}>REINICIAR DADOS</Text></Pressable>
          <Pressable style={styles.logoutButton} onPress={logout}><Text style={styles.logoutText}>TROCAR PERFIL</Text></Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function Metric({ value, label }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function Action({ icon, title, description, onPress, primary }) {
  return (
    <Pressable style={[styles.action, primary && styles.actionPrimary]} onPress={onPress}>
      <Text style={[styles.actionIcon, primary && styles.actionPrimaryText]}>{icon}</Text>
      <Text style={[styles.actionTitle, primary && styles.actionPrimaryText]}>{title}</Text>
      <Text style={[styles.actionDescription, primary && styles.actionDescriptionPrimary]}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 42 },
  hero: { padding: 24, paddingTop: 30, paddingBottom: 31 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  logo: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: 'serif', fontSize: 19, fontWeight: '900' },
  live: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', paddingHorizontal: 9, paddingVertical: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#BCE8B1', marginRight: 6 },
  liveText: { color: '#FFFFFF', fontSize: 7, fontWeight: '900', letterSpacing: 1.2 },
  eyebrow: { color: colors.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.9 },
  title: { color: '#FFFFFF', fontFamily: 'serif', fontSize: 38, marginTop: 5 },
  subtitle: { color: 'rgba(255,255,255,0.78)', fontSize: 12, lineHeight: 18, marginTop: 6 },
  metrics: { marginHorizontal: 18, marginTop: -1, flexDirection: 'row', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bg },
  metric: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  metricValue: { color: colors.accent, fontFamily: 'serif', fontSize: 25, fontWeight: '800' },
  metricLabel: { color: colors.muted, fontSize: 7, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  section: { marginTop: 30 },
  sectionEyebrow: { marginHorizontal: 18, color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.7 },
  sectionTitle: { marginHorizontal: 18, color: colors.text, fontFamily: 'serif', fontSize: 28, marginTop: 5 },
  sectionHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  link: { color: colors.accent, marginRight: 18, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  actions: { paddingHorizontal: 18, marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: { width: '48%', minHeight: 116, padding: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  actionPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionIcon: { color: colors.accent, fontSize: 22 },
  actionTitle: { color: colors.text, fontFamily: 'serif', fontSize: 19, marginTop: 10 },
  actionDescription: { color: colors.muted, fontSize: 9, marginTop: 3 },
  actionPrimaryText: { color: colors.bg },
  actionDescriptionPrimary: { color: colors.line },
  products: { paddingHorizontal: 18, gap: 12, marginTop: 15 },
  product: { width: 138 },
  productImage: { width: 138, height: 162, backgroundColor: colors.surface },
  productName: { color: colors.text, fontFamily: 'serif', fontSize: 16, marginTop: 8 },
  productPrice: { color: colors.accent, fontSize: 10, fontWeight: '900', marginTop: 3 },
  activity: { marginHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.accent, fontFamily: 'serif', fontSize: 17, fontWeight: '900' },
  activityCopy: { flex: 1, marginLeft: 11 },
  activityPerson: { color: colors.text, fontSize: 11, fontWeight: '800' },
  activityAction: { color: colors.muted, fontSize: 9, marginTop: 2 },
  activityItem: { color: colors.accent, fontWeight: '800' },
  when: { color: colors.muted, fontSize: 8 },
  signal: { marginHorizontal: 18, marginTop: 12, color: colors.accent, fontSize: 9, fontWeight: '800' },
  presentationControls: { margin: 18, marginTop: 34, padding: 16, backgroundColor: colors.surface, borderLeftWidth: 3, borderLeftColor: colors.gold },
  controlTitle: { color: colors.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.4 },
  controlCopy: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 5 },
  controlRow: { flexDirection: 'row', gap: 8, marginTop: 13 },
  secondaryButton: { flex: 1, borderWidth: 1, borderColor: colors.line, padding: 11, alignItems: 'center' },
  secondaryText: { color: colors.text, fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  logoutButton: { flex: 1, backgroundColor: colors.accent, padding: 11, alignItems: 'center' },
  logoutText: { color: colors.bg, fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
});
