import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import { colors } from '../theme/colors';
import ReconstructionScreen from './ReconstructionScreen';
import ParametricAvatar3D from '../components/ParametricAvatar3D';
import RealisticAvatar3D from '../components/RealisticAvatar3D';

export default function ApiFoundationScreen({navigation}) {
  const [reconstruction,setReconstruction]=useState(false);
  const {token,user,activeContext,switchContext,logout}=useAuth();
  const [data,setData]=useState(null);
  const [error,setError]=useState('');
  const [refreshKey,setRefreshKey]=useState(0);
  const [pieceForm,setPieceForm]=useState({name:'',category:'',color:''});
  const [lookTitle,setLookTitle]=useState('');
  const [selectedItemId,setSelectedItemId]=useState('');
  const [actionBusy,setActionBusy]=useState(false);
  const [actionError,setActionError]=useState('');
  const reload=useCallback(()=>setRefreshKey(value=>value+1),[]);
  useFocusEffect(useCallback(()=>{ reload(); },[reload]));

  async function createPiece(){
    if(!pieceForm.name.trim()||!pieceForm.category.trim())return;
    setActionBusy(true);setActionError('');
    try{
      await api('/wardrobe/items',{token,method:'POST',body:{
        name:pieceForm.name.trim(),category:pieceForm.category.trim(),color:pieceForm.color.trim()||null,
        ownershipSource:'MANUAL_CATALOG',ownershipAttested:true
      }});
      setPieceForm({name:'',category:'',color:''});
      reload();
    }catch(err){setActionError(err.message||'Não foi possível adicionar a peça.');}
    finally{setActionBusy(false);}
  }

  async function createLook(itemId){
    const wardrobeItemId=itemId||selectedItemId;
    if(!lookTitle.trim()||!wardrobeItemId)return;
    setActionBusy(true);setActionError('');
    try{
      await api('/looks',{token,method:'POST',body:{
        title:lookTitle.trim(),items:[{kind:'OWNED_ITEM',wardrobeItemId}]
      }});
      setLookTitle('');setSelectedItemId('');
      reload();
    }catch(err){setActionError(err.message||'Não foi possível criar o Look.');}
    finally{setActionBusy(false);}
  }

  useEffect(()=>{
    let cancelled=false;
    setData(null); setError('');
    const requests=activeContext==='personal'
      ? ['/profile','/wardrobe/items','/commercial-saves','/looks','/reconstruction/jobs'].map(path=>api(path,{token}))
      : [api('/stores/me',{token,headers:{'X-Organization-Id':activeContext}})];
    Promise.all(requests)
      .then(result=>{if(!cancelled)setData(result);})
      .catch(err=>{if(!cancelled)setError(err.message||'Não foi possível carregar este contexto.');});
    return ()=>{cancelled=true;};
  },[token,activeContext,refreshKey]);

  if(reconstruction)return <ReconstructionScreen onClose={()=>{setReconstruction(false);reload();}}/>;

  const personal=activeContext==='personal'&&data;
  const profile=personal?data[0]:null;
  const wardrobe=personal?data[1]:[];
  const saves=personal?data[2]:[];
  const looks=personal?data[3]:[];
  const jobs=personal?data[4]:[];
  const firstName=(user?.name||profile?.name||'').trim().split(/\s+/)[0];

  return <ScrollView contentContainerStyle={styles.page}>
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>UNIVERSO ÍMPAR</Text>
      <Text style={styles.title}>{firstName ? 'Olá, '+firstName+'.' : 'Seu universo começa aqui.'}</Text>
      <Text style={styles.subtitle}>Seu armário, seus Looks e seu contexto trabalhando juntos para decisões mais conscientes.</Text>
    </View>

    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contextRow}>
      <Pressable onPress={()=>switchContext('personal')} style={[styles.contextChip,activeContext==='personal'&&styles.contextChipActive]}>
        <Text style={[styles.contextText,activeContext==='personal'&&styles.contextTextActive]}>PESSOAL</Text>
      </Pressable>
      {user?.contexts?.map(context=><Pressable key={context.organization_id} onPress={()=>switchContext(context.organization_id)} style={[styles.contextChip,activeContext===context.organization_id&&styles.contextChipActive]}>
        <Text style={[styles.contextText,activeContext===context.organization_id&&styles.contextTextActive]}>{context.store_name?.toUpperCase()}</Text>
      </Pressable>)}
    </ScrollView>

    {error?<View style={styles.notice}><Text style={styles.noticeText}>{error}</Text><Pressable onPress={reload}><Text style={styles.link}>TENTAR NOVAMENTE</Text></Pressable></View>:null}
    {!data&&!error?<View style={styles.loading}><ActivityIndicator color={colors.accent}/><Text style={styles.muted}>Carregando seu universo...</Text></View>:null}

    {personal?<>
      <View style={styles.statsRow}>
        <Stat label="PEÇAS" value={wardrobe.length}/>
        <Stat label="LOOKS" value={looks.length}/>
        <Stat label="REFERÊNCIAS" value={saves.length}/>
      </View>
      {actionError?<Text style={styles.actionError}>{actionError}</Text>:null}

      <Section title="Meu avatar" subtitle={profile?.realisticAvatar?.url?'Avatar realista conectado ao seu perfil.':'Avatar paramétrico conectado às suas medidas e preferências.'}>
        {profile?.realisticAvatar?.url ? <RealisticAvatar3D avatar={profile.realisticAvatar} compact /> : <ParametricAvatar3D profile={profile||{}} compact />}
        <View style={styles.avatarActions}>
          <Pressable style={styles.primaryButton} onPress={()=>navigation.navigate('Avatar Studio',{profile})}>
            <Text style={styles.primaryButtonText}>AJUSTAR AVATAR PARAMÉTRICO</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={()=>navigation.navigate('Avatar Realista',{profile})}>
            <Text style={styles.secondaryButtonText}>{profile?.realisticAvatar?.url?'ATUALIZAR AVATAR REALISTA':'CRIAR AVATAR REALISTA'}</Text>
          </Pressable>
        </View>
        <Text style={styles.muted}>As configurações ficam vinculadas ao seu perfil autenticado. O avatar realista continua sujeito à qualidade da captura e ao provedor.</Text>
      </Section>

      <Section title="Meu armário" subtitle={wardrobe.length?'Suas peças catalogadas e possuídas.':'Seu armário ainda está vazio.'}>
        {wardrobe.slice(0,5).map(item=><View key={item.id} style={styles.row}>
          <View><Text style={styles.rowTitle}>{item.name}</Text><Text style={styles.muted}>{[item.category,item.color].filter(Boolean).join(' • ')}</Text></View>
        </View>)}
        <Text style={styles.formLabel}>ADICIONAR PEÇA</Text>
        <TextInput value={pieceForm.name} onChangeText={name=>setPieceForm(current=>({...current,name}))} placeholder="Nome da peça" placeholderTextColor={colors.muted} style={styles.input}/>
        <TextInput value={pieceForm.category} onChangeText={category=>setPieceForm(current=>({...current,category}))} placeholder="Categoria (ex.: blazer, vestido)" placeholderTextColor={colors.muted} style={styles.input}/>
        <TextInput value={pieceForm.color} onChangeText={color=>setPieceForm(current=>({...current,color}))} placeholder="Cor (opcional)" placeholderTextColor={colors.muted} style={styles.input}/>
        <Pressable disabled={actionBusy||!pieceForm.name.trim()||!pieceForm.category.trim()} style={[styles.primaryButton,(actionBusy||!pieceForm.name.trim()||!pieceForm.category.trim())&&styles.disabled]} onPress={createPiece}>
          <Text style={styles.primaryButtonText}>{actionBusy?'SALVANDO...':'ADICIONAR AO ARMÁRIO'}</Text>
        </Pressable>
      </Section>

      <Section title="Meus Looks" subtitle={looks.length?'Combinações privadas salvas no seu universo.':'Crie seu primeiro Look para liberar análises.'}>
        {looks.slice(0,5).map(item=><View key={item.id} style={styles.row}><Text style={styles.rowTitle}>{item.title||'Look'}</Text></View>)}
        {wardrobe.length?<>
          <Text style={styles.formLabel}>NOVO LOOK</Text>
          <TextInput value={lookTitle} onChangeText={setLookTitle} placeholder="Nome do Look" placeholderTextColor={colors.muted} style={styles.input}/>
          <Text style={styles.muted}>Escolha uma peça para iniciar. Depois o Look poderá receber novas versões e combinações.</Text>
          <View style={styles.choiceWrap}>{wardrobe.slice(0,8).map(item=><Pressable key={item.id} onPress={()=>setSelectedItemId(item.id)} style={[styles.choice,selectedItemId===item.id&&styles.choiceActive]}><Text style={[styles.choiceText,selectedItemId===item.id&&styles.choiceTextActive]}>{item.name}</Text></Pressable>)}</View>
          <Pressable disabled={actionBusy||!lookTitle.trim()||!selectedItemId} style={[styles.primaryButton,(actionBusy||!lookTitle.trim()||!selectedItemId)&&styles.disabled]} onPress={()=>createLook()}>
            <Text style={styles.primaryButtonText}>{actionBusy?'CRIANDO...':'CRIAR LOOK'}</Text>
          </Pressable>
        </>:<Text style={styles.muted}>Adicione uma peça ao armário antes de criar seu primeiro Look.</Text>}
      </Section>

      <Section title="Digitalização e 3D" subtitle="Capture peças e acompanhe o processamento sem promessas de resultado antes do quality gate.">
        <Pressable style={styles.primaryButton} onPress={()=>setReconstruction(true)}>
          <Text style={styles.primaryButtonText}>{jobs.length?'CONTINUAR CAPTURA / PROCESSAMENTO':'INICIAR CAPTURA'}</Text>
        </Pressable>
        {jobs.slice(0,3).map(job=><Pressable key={job.id} onPress={()=>setReconstruction(true)} style={styles.row}>
          <View><Text style={styles.rowTitle}>{job.category||'Reconstrução'}</Text><Text style={styles.muted}>{job.state}</Text></View>
          <Text style={styles.link}>ABRIR</Text>
        </Pressable>)}
      </Section>
    </>:data&&activeContext!=='personal'?<Section title="Contexto da marca" subtitle="Ambiente comercial vinculado à sua conta.">
      <Text style={styles.rowTitle}>{data[0]?.store_name}</Text>
      <Text style={styles.muted}>{data[0]?.pieces??0} produtos publicados</Text>
    </Section>:null}

    <View style={styles.footer}>
      <Pressable onPress={reload}><Text style={styles.link}>ATUALIZAR</Text></Pressable>
      <Pressable onPress={logout}><Text style={styles.logout}>SAIR</Text></Pressable>
    </View>
  </ScrollView>;
}

function Stat({label,value}) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function Section({title,subtitle,children}) {
  return <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle?<Text style={styles.sectionSubtitle}>{subtitle}</Text>:null}
    <View style={styles.sectionBody}>{children}</View>
  </View>;
}

const styles=StyleSheet.create({
  page:{padding:20,paddingBottom:52,gap:18,backgroundColor:colors.bg,flexGrow:1},
  hero:{paddingTop:18,paddingBottom:8,gap:8},
  eyebrow:{fontSize:10,fontWeight:'900',letterSpacing:2.4,color:colors.accent},
  title:{fontSize:34,lineHeight:40,fontWeight:'700',color:colors.text},
  subtitle:{fontSize:15,lineHeight:22,color:colors.muted,maxWidth:560},
  contextRow:{gap:8,paddingVertical:2},
  contextChip:{paddingHorizontal:14,paddingVertical:10,borderRadius:999,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface},
  contextChipActive:{backgroundColor:colors.text,borderColor:colors.text},
  contextText:{fontSize:9,fontWeight:'900',letterSpacing:1,color:colors.muted},
  contextTextActive:{color:colors.bg},
  loading:{minHeight:180,alignItems:'center',justifyContent:'center',gap:12},
  muted:{fontSize:12,lineHeight:18,color:colors.muted},
  notice:{padding:16,borderRadius:16,borderWidth:1,borderColor:colors.line,gap:10},
  noticeText:{fontSize:14,lineHeight:20,color:colors.text},
  statsRow:{flexDirection:'row',gap:10},
  stat:{flex:1,minHeight:94,padding:14,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line,justifyContent:'space-between'},
  statValue:{fontSize:28,fontWeight:'700',color:colors.text},
  statLabel:{fontSize:8,fontWeight:'900',letterSpacing:1.2,color:colors.muted},
  section:{padding:18,borderRadius:22,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line,gap:5},
  sectionTitle:{fontSize:20,fontWeight:'800',color:colors.text},
  sectionSubtitle:{fontSize:12,lineHeight:18,color:colors.muted},
  sectionBody:{gap:10,marginTop:10},
  row:{minHeight:58,paddingVertical:10,borderBottomWidth:1,borderBottomColor:colors.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
  rowTitle:{fontSize:14,fontWeight:'700',color:colors.text},
  formLabel:{marginTop:8,fontSize:9,fontWeight:'900',letterSpacing:1.2,color:colors.accent},
  input:{borderWidth:1,borderColor:colors.line,borderRadius:12,paddingHorizontal:13,paddingVertical:12,color:colors.text,backgroundColor:colors.bg},
  choiceWrap:{flexDirection:'row',flexWrap:'wrap',gap:8},
  choice:{paddingHorizontal:11,paddingVertical:9,borderRadius:999,borderWidth:1,borderColor:colors.line,backgroundColor:colors.bg},
  choiceActive:{backgroundColor:colors.text,borderColor:colors.text},
  choiceText:{fontSize:10,fontWeight:'700',color:colors.text},
  choiceTextActive:{color:colors.bg},
  actionError:{fontSize:12,lineHeight:18,color:colors.accent},
  primaryButton:{padding:14,borderRadius:12,backgroundColor:colors.accent},
  secondaryButton:{padding:14,borderRadius:12,borderWidth:1,borderColor:colors.accent,backgroundColor:colors.bg},
  secondaryButtonText:{textAlign:'center',fontSize:10,fontWeight:'900',letterSpacing:1,color:colors.accent},
  avatarActions:{gap:8},
  disabled:{opacity:0.45},
  primaryButtonText:{textAlign:'center',fontSize:10,fontWeight:'900',letterSpacing:1,color:colors.bg},
  link:{fontSize:10,fontWeight:'900',letterSpacing:1,color:colors.accent},
  footer:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:10},
  logout:{fontSize:10,fontWeight:'900',letterSpacing:1,color:colors.muted}
});
