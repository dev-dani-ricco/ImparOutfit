import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import { colors } from '../theme/colors';
import ReconstructionScreen from './ReconstructionScreen';

// Real API mode has an explicit small surface; showcase interactions stay in demo mode.
export default function ApiFoundationScreen() {
  const [reconstruction,setReconstruction]=useState(false);
  const {token,user,activeContext,switchContext,logout}=useAuth();
  const [data,setData]=useState(null),[error,setError]=useState('');
  useEffect(()=>{
    let cancelled=false;
    setData(null);setError('');
    const requests=activeContext==='personal'
      ? ['/profile','/wardrobe/items','/commercial-saves','/looks'].map(path=>api(path,{token}))
      : [api('/stores/me',{token,headers:{'X-Organization-Id':activeContext}})];
    Promise.all(requests).then(result=>{if(!cancelled)setData(result);}).catch(()=>{if(!cancelled)setError('Não foi possível carregar este contexto.');});
    return ()=>{cancelled=true;};
  },[token,activeContext]);
  if(reconstruction)return <ReconstructionScreen onClose={()=>setReconstruction(false)}/>;
  return <ScrollView contentContainerStyle={{padding:24,gap:18,backgroundColor:colors.bg,flexGrow:1}}>
    <Pressable onPress={()=>setReconstruction(true)}><Text style={{color:colors.accent}}>CAPTURAR PEÇA REAL • POC 3D</Text></Pressable>
    <Text style={{fontSize:28,color:colors.text}}>UNIVERSO ÍMPAR</Text>
    <Text style={{color:colors.text}}>{user?.name}</Text>
    <Pressable onPress={()=>switchContext('personal')}><Text style={{color:colors.accent}}>Meu contexto pessoal</Text></Pressable>
    {user?.contexts?.map(c=><Pressable key={c.organization_id} onPress={()=>switchContext(c.organization_id)}><Text style={{color:colors.accent}}>{c.store_name}</Text></Pressable>)}
    {error ? <Text style={{color:colors.text}}>{error}</Text> : !data ? <ActivityIndicator /> : activeContext==='personal' ? <>
      <Text style={{color:colors.text}}>Meu armário • {data[1].length} peças possuídas</Text>
      {data[1].map(item=><Text key={item.id} style={{color:colors.text}}>{item.name}</Text>)}
      <Text style={{color:colors.text}}>Referências comerciais • {data[2].length}</Text>
      {data[2].map(item=><Text key={item.id} style={{color:colors.text}}>{item.name} • {item.kind}</Text>)}
      <Text style={{color:colors.text}}>Looks privados • {data[3].length}</Text>
      <Text style={{color:colors.muted}}>Os demais fluxos visuais estão em integração. A demonstração usa identidades fictícias separadas.</Text>
    </> : <View><Text style={{color:colors.text}}>{data[0].store_name} • {data[0].pieces} produtos</Text></View>}
    <Pressable onPress={logout}><Text style={{color:colors.accent}}>Sair</Text></Pressable>
  </ScrollView>;
}
