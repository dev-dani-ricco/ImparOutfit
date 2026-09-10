import React,{useEffect,useState} from 'react';
import {View,Text,TextInput,Pressable,ScrollView,Platform,ActivityIndicator} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {useAuth} from '../contexts/AuthContext';
import {api} from '../api/client';
import {captureSteps} from '../reconstruction/composition.mjs';
import CompositionView from '../reconstruction/CompositionView';
const names={TOP:'Camiseta/top',PANTS:'Calça',DRESS:'Vestido',FOOTWEAR:'Calçado',BAG:'Bolsa',ACCESSORY:'Acessório pequeno'};
const stateInfo={
 CAPTURED:['Captura iniciada.','Adicione a próxima vista guiada.'],VALIDATING:['Validando cobertura e integridade.','Aguarde a validação.'],
 QUEUED:['Na fila de processamento local.','Você pode fechar o app e retornar depois.'],PROCESSING:['Reconstruindo no worker local.','Você pode fechar o app e acompanhar o estado depois.'],
 QUALITY_CHECK:['Asset derivado aguardando inspeção.','Confira completude, cor, categoria e dimensão real.'],READY:['Asset validado para composição experimental.','Visualize, gire, aplique zoom ou compare.'],
 NEEDS_MORE_INPUT:['A captura ainda não é suficiente.','Adicione somente as posições e medidas indicadas abaixo.'],FAILED:['O processamento falhou sem produzir READY.','Leia o motivo e envie apenas a recaptura necessária.']
};
export default function ReconstructionScreen({onClose}){
 const {token}=useAuth();
 const [protocol,setProtocol]=useState(null),[jobs,setJobs]=useState([]),[job,setJob]=useState(null),[items,setItems]=useState([]);
 const [name,setName]=useState(''),[category,setCategory]=useState('TOP'),[attested,setAttested]=useState(false);
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[step,setStep]=useState(0);
 const [dimension,setDimension]=useState(''),[axis,setAxis]=useState('y'),[inspection,setInspection]=useState({});
 const [compare,setCompare]=useState([]);
 const options={token};
 async function refresh(){
  const [p,j,i]=await Promise.all([api('/reconstruction/protocol',options),api('/reconstruction/jobs',options),api('/wardrobe/items',options)]);
  setProtocol(p);setJobs(j);setItems(i);
 }
 useEffect(()=>{refresh().catch(e=>setError(e.message));},[token]);
 useEffect(()=>{
  if(!job||!['QUEUED','PROCESSING','VALIDATING'].includes(job.state))return;
  const interval=setInterval(()=>api('/reconstruction/jobs/'+job.id,options).then(setJob).catch(e=>setError(e.message)),4000);
  return ()=>clearInterval(interval);
 },[job?.id,job?.state,token]);
 async function run(work){if(busy)return;setBusy(true);setError('');try{await work();}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function selectJob(j){
  const result=await api('/reconstruction/jobs/'+j.id,options);
  setJob(result);setStep(result.inputs.length%captureSteps.length);setInspection({});setDimension('');setCompare([]);
 }
 async function pick(camera=false){
  if(camera&&Platform.OS!=='web'){
   const grant=await ImagePicker.requestCameraPermissionsAsync();if(!grant.granted)throw new Error('Autorize a câmera para capturar.');
  }
  const result=await (camera&&Platform.OS!=='web'?ImagePicker.launchCameraAsync:ImagePicker.launchImageLibraryAsync)({mediaTypes:['images'],quality:1,allowsEditing:false});
  return result.canceled?null:result.assets[0];
 }
 async function photoForm(asset,fields){
  const form=new FormData();for(const [k,v]of Object.entries(fields))form.append(k,String(v));
  if(Platform.OS==='web'){
   const blob=await (await fetch(asset.uri)).blob();
   const ext=blob.type==='image/png'?'png':blob.type==='image/webp'?'webp':'jpg';
   form.append('photos',blob,'capture.'+ext);
  }else{
   const ext=(asset.fileName||asset.uri).split('.').pop().toLowerCase();
   form.append('photos',{uri:asset.uri,name:'capture.'+ext,type:asset.mimeType||'image/jpeg'});
  }return form;
 }
 async function attach(j,asset,index){
  await api('/reconstruction/jobs/'+j.id+'/inputs',{token,method:'POST',body:await photoForm(asset,captureSteps[index])});
  await selectJob(j);
 }
 async function firstCapture(camera){
  if(!attested||name.trim().length<2)throw new Error('Informe o nome e confirme que a peça física é sua.');
  const asset=await pick(camera);if(!asset)return;
  const item=await api('/wardrobe/items',{token,method:'POST',body:await photoForm(asset,{name,category,ownershipSource:'REAL_CAPTURE',ownershipAttested:true})});
  const j=await api('/reconstruction/jobs',{token,method:'POST',body:{itemId:item.id,category}});
  setJob(j);await attach(j,asset,0);await refresh();
 }
 const button=(label,fn,disabled=busy)=><Pressable key={label} accessibilityRole="button" disabled={disabled} onPress={()=>run(fn)} style={{padding:12,borderWidth:1,borderColor:'#aaa',opacity:disabled?.5:1}}><Text>{label}</Text></Pressable>;
 const canCapture=job&&['CAPTURED','NEEDS_MORE_INPUT','FAILED'].includes(job.state);
 return <ScrollView contentContainerStyle={{padding:20,gap:16,backgroundColor:'#f7f3ed'}}>
  {button('Voltar',async()=>onClose())}
  <Text style={{fontSize:28}}>Captura e composição • POC experimental</Text>
  <Text>Fotos e malhas ficam privadas. Capturar não garante reconstrução. Processamento assíncrono local; confira o estado antes de compor.</Text>
  {error?<Text accessibilityRole="alert" style={{color:'#9b2626'}}>{error}</Text>:null}{busy?<ActivityIndicator/>:null}
  {protocol?.guidance.map(s=><Text key={s}>• {s}</Text>)}
  {!job&&<>
   <TextInput accessibilityLabel="Nome da peça física" placeholder="Nome da peça física" value={name} onChangeText={setName} style={{padding:12,borderWidth:1}}/>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{Object.entries(names).map(([k,v])=>button((category===k?'✓ ':'')+v,async()=>setCategory(k)))}</View>
   {button((attested?'✓ ':'')+'Declaro que esta peça física me pertence',async()=>setAttested(v=>!v))}
   {button('Fotografar primeira vista',()=>firstCapture(true))}
   {button('Selecionar primeira foto real',()=>firstCapture(false))}
   <Text>Ou reconstruir peça já catalogada:</Text>
   {items.map(i=>button(i.name,async()=>{const j=await api('/reconstruction/jobs',{token,method:'POST',body:{itemId:i.id,category}});await selectJob(j);await refresh();}))}
  </>}
  {jobs.map(j=>button(names[j.category]+' • '+j.state+' • '+j.id.slice(0,6),()=>selectJob(j)))}
  {job&&<>
   <Text style={{fontSize:20}}>{names[job.category]} • {job.state}</Text>
   <Text>{stateInfo[job.state]?.[0]}</Text><Text>{stateInfo[job.state]?.[1]}</Text>
   {job.capture_metadata?.source==='SYNTHETIC_CONTROL'&&<Text>CONTROLE SINTÉTICO DO RENDERER — não comprova captura ou reconstrução física.</Text>}
   <Text>Job {job.id} • fotos {job.inputs?.length||0}</Text>
   {(job.guidance||[]).map((g,i)=><Text key={i}>{typeof g==='string'?g:g.message}</Text>)}
   {(job.captureSession?.validation?.missingPositions||[]).map((v,i)=><Text key={'missing-'+i}>Recapturar: {v.azimuth}° • {v.elevation}</Text>)}
   {job.error_code&&<Text>Motivo: {job.error_code}</Text>}
   {canCapture&&<>
    <Text>Próxima vista: {captureSteps[step].azimuth}° • altura {captureSteps[step].elevation}. Preferência: 36 fotos em três voltas.</Text>
    {button('Próximo ângulo',async()=>setStep(v=>(v+1)%36))}
    {button('Fotografar vista',async()=>{const a=await pick(true);if(a)await attach(job,a,step);})}
    {button('Selecionar foto desta vista',async()=>{const a=await pick(false);if(a)await attach(job,a,step);})}
    {job.inputs?.map((i,n)=>button('Excluir vista '+(n+1)+' • '+i.azimuth+'° '+i.elevation,async()=>{await api('/reconstruction/jobs/'+job.id+'/inputs/'+i.media_id,{token,method:'DELETE'});await selectJob(job);}))}
    {button('Validar e enviar para processamento',async()=>{await api('/reconstruction/jobs/'+job.id+'/submit',{token,method:'POST'});await selectJob(job);await refresh();})}
   </>}
   {button('Atualizar estado',()=>selectJob(job))}
   {job.state==='QUALITY_CHECK'&&job.output&&<>
    <CompositionView key={job.id} job={job} token={token} inspectionOnly/>
    <Text>Inspeção humana registrada. Rejeite fundo, furos relevantes, cor incorreta e partes ausentes.</Text>
    {Object.entries({complete:'Peça completa nas regiões necessárias',isolatedItem:'Somente a peça, sem fundo/suporte',colorFaithful:'Cor e aparência correspondem às fotos',categoryConfirmed:'Categoria conferida'}).map(([k,label])=>button((inspection[k]?'✓ ':'')+label,async()=>setInspection(v=>({...v,[k]:!v[k]}))))}
    <Text>Dimensão física total no eixo da malha inspecionada. Valor declarado não é medição inferida pelo sistema.</Text>
    <View style={{flexDirection:'row',gap:6}}>{['x','y','z'].map(a=>button((axis===a?'✓ ':'')+'Eixo '+a,async()=>setAxis(a)))}</View>
    <TextInput accessibilityLabel="Dimensão em metros" placeholder="Dimensão em metros, ex.: 0.32" keyboardType="decimal-pad" value={dimension} onChangeText={setDimension} style={{padding:12,borderWidth:1}}/>
    {button('Registrar inspeção e avaliar qualidade',async()=>{
     await api('/reconstruction/jobs/'+job.id+'/inspection',{token,method:'POST',body:{inspection:{complete:false,isolatedItem:false,colorFaithful:false,categoryConfirmed:false,...inspection},dimension:{axis,valueMeters:Number(dimension.replace(',','.')),source:job.product_id?'MERCHANT_DECLARED':'USER_DECLARED'}}});
     await selectJob(job);await refresh();
    })}
   </>}
   {job.state==='READY'&&<>
    <CompositionView job={job} token={token} compareJobs={compare} onSwap={setJob}/>
    {button('Carregar alternativas READY para comparação',async()=>setCompare(await Promise.all(jobs.filter(j=>j.state==='READY'&&j.id!==job.id).map(j=>api('/reconstruction/jobs/'+j.id,options)))))}
   </>}
   {button('Iniciar outra captura',async()=>{setJob(null);await refresh();})}
  </>}
 </ScrollView>;
}
