import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import { initialWardrobe } from '../demo/data';
import { colors } from '../theme/colors';
export default function WardrobeScreen({navigation,route}) {
  const added=route.params?.newItem; const rows=added?[{id:'new-item',...added},...initialWardrobe]:initialWardrobe;
  return <ScrollView style={s.screen} contentContainerStyle={s.content}><View style={s.header}><View><Text style={s.eyebrow}>MINHA COLEÇÃO</Text><Text style={s.heading}>Meu armário</Text></View><Pressable style={s.add} onPress={()=>navigation.navigate('Nova peça')}><Text style={s.addText}>＋ ADICIONAR</Text></Pressable></View><Text style={s.count}>{rows.length} peças prontas para combinar</Text>{rows.map(i=><Card key={i.id} image={i.image} subtitle={`${i.category} · ${i.color||'Nova peça'}`} title={i.name} description={`${i.source||'Meu armário'} · Tamanho ${i.size||'—'}`}/>)}</ScrollView>;
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:colors.bg},content:{paddingTop:24,paddingBottom:30},header:{paddingHorizontal:18,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},eyebrow:{color:colors.accent,fontWeight:'600',letterSpacing:2.4,fontSize:10},heading:{marginTop:5,fontSize:32,fontFamily:'serif',color:colors.text},count:{marginHorizontal:18,marginTop:7,marginBottom:22,color:colors.muted},add:{backgroundColor:colors.primary,paddingHorizontal:13,paddingVertical:12},addText:{color:colors.bg,fontWeight:'700',fontSize:10,letterSpacing:1.2}});
