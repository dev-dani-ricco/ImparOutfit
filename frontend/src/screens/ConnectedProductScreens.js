import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api, authenticatedMediaSource } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useConnectedData } from '../contexts/ConnectedDataContext';
import { colors } from '../theme/colors';

function ContextHeader({ eyebrow, title, subtitle }) {
  const { user, activeContext, switchContext } = useAuth();
  const { refresh, loading } = useConnectedData();
  const activeMembership = user?.contexts?.find((item) => item.organization_id === activeContext);

  return <View style={styles.header}>
    <Text style={styles.eyebrow}>{eyebrow}</Text>
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contexts}>
      <ContextChip label="PESSOAL" active={activeContext === 'personal'} onPress={() => switchContext('personal')} />
      {user?.contexts?.map((item) => (
        <ContextChip
          key={item.organization_id}
          label={item.store_name || 'MARCA'}
          active={activeContext === item.organization_id}
          onPress={() => switchContext(item.organization_id)}
        />
      ))}
    </ScrollView>
    <View style={styles.headerMeta}>
      <Text style={styles.headerMetaText}>
        {activeMembership ? 'CONTEXTO LOJISTA' : 'CONTEXTO CLIENTE'}
      </Text>
      <Pressable onPress={refresh} disabled={loading}>
        <Text style={styles.refresh}>{loading ? 'ATUALIZANDO…' : 'ATUALIZAR'}</Text>
      </Pressable>
    </View>
  </View>;
}

function ContextChip({ label, active, onPress }) {
  return <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{String(label).toUpperCase()}</Text>
  </Pressable>;
}

function StateNotice() {
  const { loading, error, refresh } = useConnectedData();
  if (loading) return <View style={styles.state}><ActivityIndicator color={colors.accent}/><Text style={styles.muted}>Carregando dados reais…</Text></View>;
  if (error) return <View style={styles.error}><Text style={styles.errorText}>{error}</Text><Pressable onPress={refresh}><Text style={styles.refresh}>TENTAR NOVAMENTE</Text></Pressable></View>;
  return null;
}

function Stat({ value, label }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}
function Section({ label, title, children }) {
  return <View style={styles.section}>
    <Text style={styles.sectionLabel}>{label}</Text>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionBody}>{children}</View>
  </View>;
}

export function ConnectedHomeScreen() {
  const { user } = useAuth();
  const { personal, loading, error } = useConnectedData();
  const firstName = (personal.profile?.name || user?.name || '').split(' ')[0];

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <ContextHeader
      eyebrow="CLIENTE FINAL · HOMOLOGAÇÃO"
      title={firstName ? 'Olá, ' + firstName + '.' : 'Seu universo.'}
      subtitle="Seu perfil, armário, Looks e análises usando dados persistidos no ambiente de testes reais."
    />
    <StateNotice />
    {!loading && !error ? <>
      <View style={styles.stats}>
        <Stat value={personal.wardrobe.length} label="PEÇAS" />
        <Stat value={personal.looks.length} label="LOOKS" />
        <Stat value={personal.saves.length} label="REFERÊNCIAS" />
      </View>
      <Section label="PRÓXIMA AÇÃO" title={personal.wardrobe.length ? 'Continue construindo seus Looks.' : 'Comece pelo seu armário.'}>
        <Text style={styles.copy}>{personal.wardrobe.length
          ? 'As peças catalogadas já podem compor Looks privados e alimentar a Análise ÍMPAR.'
          : 'Cadastre sua primeira peça possuída. Referências de lojas continuam separadas do armário.'}</Text>
      </Section>
      <Section label="3D" title="Seu ambiente visual">
        <Text style={styles.copy}>{personal.jobs.length
          ? personal.jobs.length + ' job(s) de captura/reconstrução registrados.'
          : 'Nenhum job de reconstrução iniciado. O avatar paramétrico continua disponível sem depender de reconstrução real.'}</Text>
      </Section>
    </> : null}
  </ScrollView>;
}
export function ConnectedWardrobeScreen() {
  const { token } = useAuth();
  const { personal, loading, error } = useConnectedData();

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <ContextHeader eyebrow="CLIENTE FINAL · ARMÁRIO" title="Seu acervo real." subtitle="Somente peças catalogadas como possuídas aparecem aqui." />
    <StateNotice />
    {!loading && !error && personal.wardrobe.length === 0 ? <Empty text="Seu armário ainda está vazio."/> : null}
    {!loading && !error ? personal.wardrobe.map((item) => {
      const source = authenticatedMediaSource(item.image_urls?.[0], token);
      const sizes = Array.isArray(item.sizes) ? item.sizes.join(', ') : item.sizes;
      return <View key={item.id} style={styles.itemRow}>
        <View style={styles.thumb}>{source ? <Image source={source} style={styles.thumbImage}/> : <Text style={styles.thumbFallback}>◇</Text>}</View>
        <View style={styles.itemCopy}>
          <Text style={styles.itemCategory}>{item.category || 'PEÇA'}</Text>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.muted}>{[item.color, sizes].filter(Boolean).join(' · ') || 'Dados básicos catalogados'}</Text>
          <Text style={styles.realBadge}>OWNED ITEM · REAL</Text>
        </View>
      </View>;
    }) : null}
  </ScrollView>;
}

export function ConnectedDiscoveryScreen() {
  const { token } = useAuth();
  const { personal, loading, error, refresh } = useConnectedData();
  const [busy, setBusy] = useState('');
  const savedIds = useMemo(() => new Set(personal.saves.map((item) => item.product_id)), [personal.saves]);

  async function toggleSave(productId) {
    setBusy(productId);
    try {
      const path = '/products/' + productId + '/save';
      if (savedIds.has(productId)) await api(path, { token, method: 'DELETE' });
      else await api(path, { token, method: 'POST', body: { kind: 'COMMERCIAL_PREVIEW' } });
      refresh();
    } finally {
      setBusy('');
    }
  }
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <ContextHeader eyebrow="CLIENTE FINAL · DESCOBRIR" title="Marcas e referências." subtitle="Salvar uma referência comercial não transforma o produto em peça possuída." />
    <StateNotice />
    {!loading && !error ? <>
      <Text style={styles.smallHeading}>MARCAS ATIVAS · {personal.stores.length}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
        {personal.stores.map((store) => <View key={store.id} style={styles.storeCard}>
          <Text style={styles.storeName}>{store.store_name}</Text>
          <Text numberOfLines={3} style={styles.muted}>{store.description || 'Marca disponível no Universo ÍMPAR.'}</Text>
        </View>)}
      </ScrollView>
      <Text style={styles.smallHeading}>PRODUTOS PUBLICADOS · {personal.products.length}</Text>
      {personal.products.length === 0 ? <Empty text="Nenhum produto publicado neste ambiente."/> : personal.products.map((product) => {
        const source = authenticatedMediaSource(product.image_urls?.[0], token);
        const saved = savedIds.has(product.id);
        return <View key={product.id} style={styles.productCard}>
          <View style={styles.productMedia}>{source ? <Image source={source} style={styles.productImage}/> : <Text style={styles.thumbFallback}>◇</Text>}</View>
          <View style={styles.productBody}>
            <Text style={styles.itemCategory}>{product.category || 'PRODUTO'}</Text>
            <Text style={styles.itemName}>{product.name}</Text>
            <Text style={styles.muted}>{product.price ? 'R$ ' + product.price : 'Preço não informado'}</Text>
            <Pressable disabled={busy === product.id} style={[styles.save, saved && styles.saveActive]} onPress={() => toggleSave(product.id)}>
              <Text style={[styles.saveText, saved && styles.saveTextActive]}>{busy === product.id ? 'SALVANDO…' : saved ? 'REMOVER REFERÊNCIA' : 'SALVAR REFERÊNCIA'}</Text>
            </Pressable>
          </View>
        </View>;
      })}
    </> : null}
  </ScrollView>;
}
export function ConnectedProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { personal, loading, error } = useConnectedData();
  const profile = personal.profile;

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <ContextHeader eyebrow="CLIENTE FINAL · PERFIL" title={profile?.name || user?.name || 'Meu perfil'} subtitle="Identidade, medidas e configuração do avatar ficam vinculadas à sua conta." />
    <StateNotice />
    {!loading && !error ? <>
      <Section label="PERFIL" title="Dados atuais">
        <DataRow label="E-mail" value={profile?.email || user?.email} />
        <DataRow label="Profissão" value={profile?.profession || 'Não informada'} />
        <DataRow label="Altura" value={profile?.height ? profile.height + ' cm' : 'Não informada'} />
        <DataRow label="Busto" value={profile?.bust ? profile.bust + ' cm' : 'Não informado'} />
        <DataRow label="Cintura" value={profile?.waist ? profile.waist + ' cm' : 'Não informada'} />
        <DataRow label="Quadril" value={profile?.hips ? profile.hips + ' cm' : 'Não informado'} />
      </Section>
      <Section label="AVATAR" title={profile?.avatarEngine ? 'Avatar configurado' : 'Configure seu avatar'}>
        <Text style={styles.copy}>O avatar paramétrico é a rota padrão do MVP. A rota realista permanece opcional.</Text>
        <Pressable style={styles.primary} onPress={() => navigation.navigate('Avatar Studio Conectado')}><Text style={styles.primaryText}>ABRIR AVATAR STUDIO</Text></Pressable>
      </Section>
      <Pressable style={styles.outline} onPress={logout}><Text style={styles.outlineText}>SAIR DA CONTA</Text></Pressable>
    </> : null}
  </ScrollView>;
}
export function ConnectedStoreDashboardScreen() {
  const { organization, loading, error } = useConnectedData();
  const saves = organization.engagement.reduce((sum, item) => sum + Number(item.saves || 0), 0);

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <ContextHeader eyebrow="LOJISTA · PAINEL" title={organization.store?.store_name || 'Minha marca'} subtitle="Visão operacional baseada nos dados reais disponíveis neste ambiente." />
    <StateNotice />
    {!loading && !error ? <>
      <View style={styles.stats}>
        <Stat value={organization.products.length} label="PRODUTOS" />
        <Stat value={organization.store?.followers || 0} label="SEGUIDORES" />
        <Stat value={saves} label="SALVOS" />
      </View>
      <Section label="CATÁLOGO" title="Presença comercial">
        <Text style={styles.copy}>{organization.products.length
          ? organization.products.length + ' produto(s) publicado(s) e disponível(is) para descoberta.'
          : 'Ainda não há produtos publicados neste contexto.'}</Text>
      </Section>
    </> : null}
  </ScrollView>;
}

export function ConnectedStoreCatalogScreen() {
  const { token } = useAuth();
  const { organization, loading, error } = useConnectedData();

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <ContextHeader eyebrow="LOJISTA · CATÁLOGO" title="Catálogo publicado." subtitle="Produtos reais deste contexto comercial." />
    <StateNotice />
    {!loading && !error && organization.products.length === 0 ? <Empty text="Nenhum produto publicado."/> : null}
    {!loading && !error ? organization.products.map((product) => {
      const source = authenticatedMediaSource(product.image_urls?.[0], token);
      return <View key={product.id} style={styles.productCard}>
        <View style={styles.productMedia}>{source ? <Image source={source} style={styles.productImage}/> : <Text style={styles.thumbFallback}>◇</Text>}</View>
        <View style={styles.productBody}>
          <Text style={styles.itemCategory}>{product.category || 'PRODUTO'}</Text>
          <Text style={styles.itemName}>{product.name}</Text>
          <Text style={styles.realBadge}>CATÁLOGO REAL</Text>
        </View>
      </View>;
    }) : null}
  </ScrollView>;
}
export function ConnectedStoreCampaignScreen() {
  const { organization, loading, error } = useConnectedData();

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <ContextHeader eyebrow="LOJISTA · CAMPANHAS" title="Showcases publicados." subtitle="No MVP, campanha significa conteúdo/vitrine. Não há compra de mídia ou alcance fictício." />
    <StateNotice />
    {!loading && !error && organization.showcases.length === 0 ? <Empty text="Nenhuma campanha/showcase criada neste ambiente."/> : null}
    {!loading && !error ? organization.showcases.map((item) => <View key={item.id} style={styles.campaign}>
      <Text style={styles.sectionLabel}>SHOWCASE REAL</Text>
      <Text style={styles.sectionTitle}>{item.title}</Text>
      <Text style={styles.copy}>{item.description || 'Sem descrição.'}</Text>
      <Text style={styles.muted}>{(item.item_ids?.length || 0) + ' produto(s) vinculados'}</Text>
    </View>) : null}
  </ScrollView>;
}

export function ConnectedStoreAccountScreen() {
  const { user, activeContext, switchContext, logout } = useAuth();
  const { organization, loading, error } = useConnectedData();
  const membership = user?.contexts?.find((item) => item.organization_id === activeContext);

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <ContextHeader eyebrow="LOJISTA · CONTA" title={organization.store?.store_name || membership?.store_name || 'Minha marca'} subtitle="A autoridade comercial pertence ao contexto. Seu perfil pessoal continua separado." />
    <StateNotice />
    {!loading && !error ? <>
      <Section label="CAPACIDADES" title="Permissões deste contexto">
        <View style={styles.capabilities}>{(membership?.capabilities || []).map((cap) => <Text key={cap} style={styles.capability}>{cap}</Text>)}</View>
      </Section>
      <Pressable style={styles.primary} onPress={() => switchContext('personal')}><Text style={styles.primaryText}>ABRIR CONTEXTO PESSOAL</Text></Pressable>
      <Pressable style={styles.outline} onPress={logout}><Text style={styles.outlineText}>SAIR DA CONTA</Text></Pressable>
    </> : null}
  </ScrollView>;
}
function DataRow({ label, value }) {
  return <View style={styles.dataRow}><Text style={styles.dataLabel}>{label}</Text><Text style={styles.dataValue}>{value || '—'}</Text></View>;
}

function Empty({ text }) {
  return <View style={styles.empty}><Text style={styles.emptyTitle}>{text}</Text><Text style={styles.muted}>Este estado é real e não será preenchido com dados fictícios.</Text></View>;
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:'#F7F3EE'},
  content:{padding:18,paddingBottom:110,gap:18},
  header:{paddingTop:10,gap:8},
  eyebrow:{color:colors.accent,fontSize:8,fontWeight:'900',letterSpacing:1.7},
  title:{color:'#151515',fontSize:34,lineHeight:38,fontWeight:'800'},
  subtitle:{color:'#716961',fontSize:12,lineHeight:19,maxWidth:560},
  contexts:{gap:7,paddingVertical:8},
  chip:{borderWidth:1,borderColor:'#D8CFC7',paddingHorizontal:11,paddingVertical:8,backgroundColor:'#FFFFFF'},
  chipActive:{backgroundColor:'#151515',borderColor:'#151515'},
  chipText:{color:'#746A62',fontSize:7,fontWeight:'900',letterSpacing:1},
  chipTextActive:{color:'#FFFFFF'},
  headerMeta:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  headerMetaText:{color:colors.gold,fontSize:7,fontWeight:'900',letterSpacing:1.2},
  refresh:{color:colors.accent,fontSize:8,fontWeight:'900',letterSpacing:1},
  state:{minHeight:150,alignItems:'center',justifyContent:'center',gap:10},
  error:{padding:16,borderWidth:1,borderColor:'#A33',gap:10,backgroundColor:'#FFF'},
  errorText:{color:'#852323',fontSize:12,lineHeight:18},
  muted:{color:'#7A7068',fontSize:10,lineHeight:16},
  stats:{flexDirection:'row',gap:8},
  stat:{flex:1,minHeight:88,padding:13,borderWidth:1,borderColor:'#DED6CE',backgroundColor:'#FFFFFF',justifyContent:'space-between'},
  statValue:{color:'#151515',fontSize:27,fontWeight:'800'},
  statLabel:{color:'#7A7068',fontSize:7,fontWeight:'900',letterSpacing:1},
  section:{padding:17,borderWidth:1,borderColor:'#DED6CE',backgroundColor:'#FFFFFF',gap:6},
  sectionLabel:{color:colors.gold,fontSize:7,fontWeight:'900',letterSpacing:1.3},
  sectionTitle:{color:'#151515',fontSize:22,fontWeight:'800'},
  sectionBody:{gap:8,marginTop:3},
  copy:{color:'#655D56',fontSize:11,lineHeight:18},
  itemRow:{flexDirection:'row',borderWidth:1,borderColor:'#DED6CE',backgroundColor:'#FFFFFF',minHeight:132},
  thumb:{width:105,alignItems:'center',justifyContent:'center',backgroundColor:'#EEE8E2'},
  thumbImage:{width:'100%',height:'100%'},
  thumbFallback:{fontSize:30,color:colors.accent},
  itemCopy:{flex:1,padding:14,justifyContent:'center'},
  itemCategory:{color:colors.accent,fontSize:7,fontWeight:'900',letterSpacing:1},
  itemName:{color:'#151515',fontSize:19,fontWeight:'800',marginTop:4},
  realBadge:{alignSelf:'flex-start',marginTop:9,paddingHorizontal:7,paddingVertical:5,backgroundColor:'#151515',color:'#FFFFFF',fontSize:6,fontWeight:'900',letterSpacing:0.8},
  smallHeading:{color:'#6D625A',fontSize:8,fontWeight:'900',letterSpacing:1.3,marginTop:4},
  horizontal:{gap:9},
  storeCard:{width:210,minHeight:105,padding:14,borderWidth:1,borderColor:'#DED6CE',backgroundColor:'#FFFFFF'},
  storeName:{color:'#151515',fontSize:18,fontWeight:'800',marginBottom:6},
  productCard:{flexDirection:'row',borderWidth:1,borderColor:'#DED6CE',backgroundColor:'#FFFFFF',minHeight:145},
  productMedia:{width:112,alignItems:'center',justifyContent:'center',backgroundColor:'#EEE8E2'},
  productImage:{width:'100%',height:'100%'},
  productBody:{flex:1,padding:14,justifyContent:'center'},
  save:{alignSelf:'flex-start',borderWidth:1,borderColor:colors.accent,paddingHorizontal:9,paddingVertical:7,marginTop:10},
  saveActive:{backgroundColor:colors.accent},
  saveText:{color:colors.accent,fontSize:7,fontWeight:'900',letterSpacing:0.8},
  saveTextActive:{color:'#FFFFFF'},
  primary:{backgroundColor:'#151515',padding:14,alignItems:'center',marginTop:8},
  primaryText:{color:'#FFFFFF',fontSize:8,fontWeight:'900',letterSpacing:1},
  outline:{borderWidth:1,borderColor:'#BEB4AA',padding:13,alignItems:'center',marginTop:4},
  outlineText:{color:'#151515',fontSize:8,fontWeight:'900',letterSpacing:1},
  dataRow:{flexDirection:'row',justifyContent:'space-between',gap:12,paddingVertical:9,borderBottomWidth:1,borderBottomColor:'#EEE7E0'},
  dataLabel:{color:'#80756D',fontSize:9,fontWeight:'700'},
  dataValue:{color:'#151515',fontSize:10,fontWeight:'800',flex:1,textAlign:'right'},
  campaign:{padding:17,borderWidth:1,borderColor:'#DED6CE',backgroundColor:'#FFFFFF',gap:6},
  capabilities:{flexDirection:'row',flexWrap:'wrap',gap:6},
  capability:{backgroundColor:'#ECE5DE',paddingHorizontal:8,paddingVertical:6,color:'#5E554E',fontSize:7,fontWeight:'800'},
  empty:{padding:20,borderWidth:1,borderStyle:'dashed',borderColor:'#CFC5BC',backgroundColor:'#FFFFFF',gap:6},
  emptyTitle:{color:'#151515',fontSize:18,fontWeight:'800'}
});
