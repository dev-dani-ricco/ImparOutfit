import React,{useEffect,useMemo,useState} from 'react';
import {ActivityIndicator,Pressable,Text,TextInput,View} from 'react-native';
import {api} from '../api/client';
import {colors} from '../theme/colors';

const waitStates=new Set(['REQUESTED','ENQUEUED','PROCESSING','QUEUED']);

export default function ImparAnalysisFlow({token,looks=[],onComplete}){
  const [selectedLookId,setSelectedLookId]=useState('');
  const [occasion,setOccasion]=useState('');
  const [objective,setObjective]=useState('');
  const [analysis,setAnalysis]=useState(null);
  const [request,setRequest]=useState(null);
  const [job,setJob]=useState(null);
  const [results,setResults]=useState([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{
    if(!selectedLookId&&looks.length)setSelectedLookId(looks[0].id);
  },[looks,selectedLookId]);

  const status=useMemo(()=>{
    if(error)return 'Falha';
    if(results.length)return 'Resultado disponível';
    if(job?.state)return job.state;
    if(request?.state)return request.state;
    if(analysis)return 'Analysis criada';
    return 'Pronta para solicitar';
  },[analysis,error,job,request,results]);

  async function start(){
    if(!selectedLookId)return;
    setBusy(true);setError('');setResults([]);setJob(null);setRequest(null);setAnalysis(null);
    try{
      const look=await api('/looks/'+selectedLookId,{token});
      const version=look.versions?.[0];
      if(!version?.id)throw new Error('Este Look ainda não possui uma versão utilizável.');
      const context=await api('/contexts',{
        token,method:'POST',
        body:{
          occasion:occasion.trim()||null,
          objective:objective.trim()||null,
          provenance:'USER_DECLARED'
        }
      });
      const created=await api('/impar-analyses',{
        token,method:'POST',
        body:{lookId:look.id,lookVersionId:version.id,contextId:context.id}
      });
      setAnalysis(created);
      const requested=await api('/impar-analyses/'+created.id+'/requests',{
        token,method:'POST',body:{},
        headers:{'Idempotency-Key':'mobile-'+created.id}
      });
      setRequest(requested);
    }catch(e){
      setError(e.message||'Não foi possível solicitar sua análise.');
    }finally{setBusy(false);}
  }

  useEffect(()=>{
    if(!analysis?.id||error||results.length)return;
    let cancelled=false;
    let timer;
    const poll=async()=>{
      try{
        const nextRequest=await api('/impar-analyses/'+analysis.id+'/request',{token});
        if(cancelled)return;
        setRequest(nextRequest);
        if(nextRequest.state==='FAILED'){
          setError('A solicitação não pôde ser aceita pelo executor institucional.');
          return;
        }
        if(nextRequest.state==='CANCELLED')return;
        if(nextRequest.jobId){
          const nextJob=await api('/impar-analyses/'+analysis.id+'/jobs/'+nextRequest.jobId,{token});
          if(cancelled)return;
          setJob(nextJob);
          if(nextJob.state==='FAILED'){
            setError('A análise encontrou um bloqueio técnico. Você poderá tentar novamente após a correção.');
            return;
          }
          if(nextJob.state==='SUCCEEDED'){
            const nextResults=await api('/impar-analyses/'+analysis.id+'/results',{token});
            if(!cancelled){
              setResults(nextResults);
              if(nextResults.length)onComplete?.({analysisId:analysis.id,results:nextResults});
            }
            return;
          }
        }
        if(!cancelled)timer=setTimeout(poll,2000);
      }catch(e){
        if(!cancelled){
          setError(e.message||'Não foi possível acompanhar a análise.');
        }
      }
    };
    timer=setTimeout(poll,1000);
    return()=>{cancelled=true;if(timer)clearTimeout(timer);};
  },[analysis?.id,token,error,results.length,onComplete]);

  async function cancel(){
    if(!analysis?.id||request?.state!=='REQUESTED')return;
    setBusy(true);setError('');
    try{
      setRequest(await api('/impar-analyses/'+analysis.id+'/request/cancel',{token,method:'POST',body:{}}));
    }catch(e){setError(e.message||'Não foi possível cancelar.');}
    finally{setBusy(false);}
  }

  return <View style={{gap:12,padding:16,borderWidth:1,borderColor:colors.line,borderRadius:16}}>
    <Text style={{fontSize:18,fontWeight:'800',color:colors.text}}>Análise ÍMPAR</Text>
    <Text style={{color:colors.muted}}>Escolha um Look e conte o contexto. A análise considera somente as informações disponíveis e sinaliza quando não há evidência suficiente.</Text>
    {!looks.length?<Text style={{color:colors.text}}>Crie pelo menos um Look para solicitar uma análise.</Text>:<>
      <Text style={{color:colors.text,fontWeight:'700'}}>Look</Text>
      <View style={{gap:8}}>
        {looks.map(item=><Pressable key={item.id} onPress={()=>setSelectedLookId(item.id)} style={{padding:10,borderWidth:1,borderColor:selectedLookId===item.id?colors.accent:colors.line,borderRadius:10}}>
          <Text style={{color:colors.text}}>{selectedLookId===item.id?'● ':'○ '}{item.title||'Look'}</Text>
        </Pressable>)}
      </View>
      <TextInput value={occasion} onChangeText={setOccasion} placeholder="Ocasião (ex.: jantar, reunião, evento)" placeholderTextColor={colors.muted} style={{borderWidth:1,borderColor:colors.line,borderRadius:10,padding:12,color:colors.text}}/>
      <TextInput value={objective} onChangeText={setObjective} placeholder="O que você quer comunicar?" placeholderTextColor={colors.muted} multiline style={{borderWidth:1,borderColor:colors.line,borderRadius:10,padding:12,color:colors.text,minHeight:72}}/>
      <Pressable disabled={busy||Boolean(analysis&&waitStates.has(request?.state||job?.state))} onPress={start} style={{padding:13,borderRadius:10,backgroundColor:colors.accent,opacity:busy?0.6:1}}>
        <Text style={{color:colors.bg,fontWeight:'900',textAlign:'center'}}>{busy?'PROCESSANDO...':'SOLICITAR ANÁLISE ÍMPAR'}</Text>
      </Pressable>
    </>}
    <Text style={{color:colors.text}}>Status: {status}</Text>
    {request?.state==='REQUESTED'?<Pressable disabled={busy} onPress={cancel}><Text style={{color:colors.accent}}>Cancelar solicitação</Text></Pressable>:null}
    {error?<Text style={{color:colors.text}}>{error}</Text>:null}
    {analysis&&!results.length&&!error&&request?.state!=='CANCELLED'?<ActivityIndicator color={colors.accent}/>:null}
    {results.map(result=><AnalysisResultCard key={result.id} result={result}/>)}
  </View>;
}

function AnalysisResultCard({result}) {
  const payload=result.payload||{};
  return <View style={{gap:12,paddingTop:12,borderTopWidth:1,borderTopColor:colors.line}}>
    <View style={{gap:3}}>
      <Text style={{color:colors.accent,fontSize:10,fontWeight:'900',letterSpacing:1}}>{result.status==='FINAL'?'ANÁLISE FINAL':'ANÁLISE GERADA'}</Text>
      <Text style={{color:colors.text,fontSize:18,fontWeight:'800'}}>{payload.summary||'Resultado disponível'}</Text>
      <Text style={{color:colors.muted,fontSize:11}}>Status: {result.status==='FINAL'?'final':'em validação'} • Confiança: {payload.confidence||'não informada'}</Text>
    </View>
    <ResultList title="Pontos fortes" items={payload.strengths}/>
    <ResultList title="Atenção" items={payload.attentionPoints}/>
    <ResultList title="Contexto" items={payload.contextFit}/>
    <ResultList title="Próximos passos" items={payload.nextActions}/>
    <ResultList title="Limites da análise" items={payload.limitations}/>
  </View>;
}

function ResultList({title,items}) {
  if(!Array.isArray(items)||!items.length)return null;
  return <View style={{gap:6}}>
    <Text style={{color:colors.text,fontWeight:'800'}}>{title}</Text>
    {items.map((item,index)=><Text key={title+index} style={{color:colors.muted,lineHeight:19}}>• {String(item)}</Text>)}
  </View>;
}
