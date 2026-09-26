import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {ActivityIndicator,Pressable,RefreshControl,ScrollView,Text,View,StyleSheet} from 'react-native';
import {colors} from '../theme/colors';
import {useAuth} from '../contexts/AuthContext';
import {api} from '../api/client';
import ImparAnalysisFlow from '../components/ImparAnalysisFlow';

export const DANI_CONTENT_REFERENCE=Object.freeze({id:'dani-client-content',status:'API_CONNECTED'});

const stateLabel={
  DRAFT:'Em preparação',
  COMPLETED:'Concluída',
  QUEUED:'Na fila',
  PROCESSING:'Em análise',
  SUCCEEDED:'Análise gerada',
  FAILED:'Falha na análise',
  CANCELLED:'Cancelada'
};

function visiblePayload(payload){
  if(!payload||typeof payload!=='object'||Array.isArray(payload))return [];
  return Object.entries(payload).flatMap(([key,value])=>{
    if(['chainOfThought','systemPrompt','prompt','rawPrompt','ragContext','knowledgeChunks','secrets','credentials'].includes(key))return [];
    if(['string','number','boolean'].includes(typeof value))return [[key,String(value)]];
    if(Array.isArray(value)&&value.every(item=>['string','number','boolean'].includes(typeof item)))return [[key,value.map(String).join(' • ')]];
    return [];
  }).slice(0,12);
}
function humanize(key){return key.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[_-]+/g,' ').replace(/^./,c=>c.toUpperCase());}
function formatDate(value){if(!value)return '';const d=new Date(value);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('pt-BR');}

export default function DaniRicoScreen(){
 const {token,demoMode}=useAuth();
 const [analyses,setAnalyses]=useState([]),[looks,setLooks]=useState([]),[loading,setLoading]=useState(!demoMode),[refreshing,setRefreshing]=useState(false),[error,setError]=useState('');
 const load=useCallback(async()=>{
   if(demoMode||!token){setAnalyses([]);setLooks([]);setLoading(false);return;}
   setError('');
   try{
     const [nextAnalyses,nextLooks]=await Promise.all([
       api('/impar-analyses',{token}),
       api('/looks',{token})
     ]);
     setAnalyses(nextAnalyses);
     setLooks(nextLooks);
   }
   catch(e){setError(e.message||'Não foi possível carregar suas análises.');}
   finally{setLoading(false);setRefreshing(false);}
 },[demoMode,token]);
 useEffect(()=>{load();},[load]);
 const completed=useMemo(()=>analyses.filter(item=>item.status==='COMPLETED'&&item.finalResult),[analyses]);
 return <ScrollView
   style={styles.screen}
   contentContainerStyle={styles.content}
   refreshControl={!demoMode?<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}}/>:undefined}
  >
   <View style={styles.hero}>
    <Text style={styles.tag}>UNIVERSO ÍMPAR</Text>
    <Text style={styles.title}>Análise ÍMPAR</Text>
    <Text style={styles.intro}>{demoMode?'A demonstração não executa análises reais. Entre no modo conectado para acessar seus resultados.':'Acompanhe análises vinculadas aos seus Looks e contextos.'}</Text>
   </View>
   {demoMode?<View style={styles.card}><Text style={styles.heading}>Modo demonstração</Text><Text style={styles.copy}>Nenhum conteúdo privado, recomendação ou análise institucional é carregado neste modo.</Text></View>:null}
   {!demoMode&&!loading&&!error?<ImparAnalysisFlow token={token} looks={looks} onComplete={load}/>:null}
   {!demoMode&&loading?<ActivityIndicator/>:null}
   {!demoMode&&error?<View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text><Pressable onPress={load} style={styles.button}><Text style={styles.buttonText}>Tentar novamente</Text></Pressable></View>:null}
   {!demoMode&&!loading&&!error&&analyses.length===0?<View style={styles.card}><Text style={styles.heading}>Nenhuma análise ainda</Text><Text style={styles.copy}>Quando uma Análise ÍMPAR for criada para um Look, o andamento aparecerá aqui.</Text></View>:null}
   {!demoMode&&analyses.map(item=>{
     const resultRows=visiblePayload(item.finalResult?.payload);
     const status=item.status==='COMPLETED'?item.status:(item.latestJob?.state||item.status);
     return <View key={item.id} style={styles.card}>
      <View style={styles.row}><Text style={styles.heading}>Análise {item.id.slice(0,8)}</Text><Text style={styles.status}>{stateLabel[status]||status}</Text></View>
      <Text style={styles.meta}>{formatDate(item.createdAt)}{item.methodologyVersionId?' • metodologia vinculada':''}</Text>
      {item.latestJob?.errorCode?<Text style={styles.warning}>Execução: {item.latestJob.errorCode}</Text>:null}
      {item.finalResult?<View style={styles.result}>
       <Text style={styles.resultTitle}>Resultado final</Text>
       {resultRows.length?resultRows.map(([key,value])=><View key={key} style={styles.resultRow}><Text style={styles.label}>{humanize(key)}</Text><Text style={styles.value}>{value}</Text></View>):<Text style={styles.copy}>Resultado concluído e registrado.</Text>}
      </View>:<Text style={styles.copy}>{item.latestJob?('Execução '+(stateLabel[item.latestJob.state]||item.latestJob.state)+'.'):'Aguardando execução.'}</Text>}
     </View>;
   })}
   {!demoMode&&completed.length>0?<Text style={styles.footer}>Resultados exibidos são versões finais vinculadas à sua conta.</Text>:null}
  </ScrollView>;
}
const styles=StyleSheet.create({
 screen:{flex:1,backgroundColor:colors.bg},content:{padding:20,gap:16},
 hero:{backgroundColor:colors.primary,padding:24,gap:10},
 tag:{color:colors.gold,fontSize:10,letterSpacing:1.4},
 title:{color:colors.bg,fontSize:34,fontFamily:'serif'},
 intro:{color:colors.bg,lineHeight:22},
 card:{borderWidth:1,borderColor:colors.line,padding:18,gap:10,backgroundColor:colors.bg},
 row:{flexDirection:'row',justifyContent:'space-between',gap:12,alignItems:'flex-start'},
 heading:{fontSize:21,color:colors.text,fontFamily:'serif',flex:1},
 status:{fontSize:11,color:colors.muted,textTransform:'uppercase'},
 meta:{fontSize:12,color:colors.muted},
 copy:{color:colors.muted,lineHeight:21},
 result:{borderTopWidth:1,borderTopColor:colors.line,paddingTop:12,gap:10},
 resultTitle:{fontSize:15,color:colors.text,fontWeight:'600'},
 resultRow:{gap:3},
 label:{fontSize:11,color:colors.muted,textTransform:'uppercase'},
 value:{fontSize:15,color:colors.text,lineHeight:21},
 warning:{color:'#8a5a19',fontSize:12},
 errorCard:{borderWidth:1,borderColor:'#a33',padding:18,gap:12},
 errorText:{color:'#8f2020'},
 button:{alignSelf:'flex-start',borderWidth:1,borderColor:colors.text,paddingHorizontal:14,paddingVertical:9},
 buttonText:{color:colors.text},
 footer:{fontSize:11,color:colors.muted,textAlign:'center',paddingVertical:10}
});
