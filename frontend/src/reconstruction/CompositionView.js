import React,{Suspense,useEffect,useMemo,useState} from 'react';
import {View,Text,Pressable,PanResponder} from 'react-native';
import {Canvas} from './CompositionCanvas';
import {useThree,useLoader} from '@react-three/fiber';
import {useAssets} from 'expo-asset';
import {GLTFLoader,SkeletonUtils} from 'three-stdlib';
import * as THREE from 'three';
import {API_URL} from '../api/client';
import {compositionItem} from './composition.mjs';
import RendererBoundary from './RendererBoundary';
const avatarModule=require('../../assets/models/michelle.glb');
const anchors={TOP:[0,.72,0],PANTS:[0,.40,0],DRESS:[0,.55,0],FOOTWEAR:[.10,.06,.03],BAG:[.28,.43,.05],ACCESSORY:[0,.80,.08]};
function dispose(scene){scene?.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of (Array.isArray(o.material)?o.material:[o.material]))m?.dispose();}});}
function ReferenceAvatar({uri,height}){
 const source=useLoader(GLTFLoader,uri);
 const obj=useMemo(()=>{
  const x=SkeletonUtils.clone(source.scene);x.updateMatrixWorld(true);
  const b=new THREE.Box3().setFromObject(x),size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3());
  const scale=height/size.y;
  x.scale.setScalar(scale);x.position.set(-center.x*scale,-b.min.y*scale,-center.z*scale);
  return x;
 },[source,height]);
 return <primitive object={obj}/>;
}
function Camera({yaw,zoom,inspect}){
 const {camera,invalidate}=useThree();
 useEffect(()=>{
  const distance=(inspect?1.6:3.5)/zoom,target=inspect?0:.8;
  camera.position.set(Math.sin(yaw)*distance,target+.1,Math.cos(yaw)*distance);
  camera.lookAt(0,target,0);camera.updateProjectionMatrix();invalidate();
 },[camera,yaw,zoom,inspect,invalidate]);
 return null;
}
export default function CompositionView({job,token,inspectionOnly=false,compareJobs=[],onSwap}){
 const [assets]=useAssets([avatarModule]),[mesh,setMesh]=useState(null),[error,setError]=useState('');
 const [yaw,setYaw]=useState(0),[zoom,setZoom]=useState(1),[visible,setVisible]=useState(true),[inspect,setInspect]=useState(inspectionOnly);
 const [rotation,setRotation]=useState([0,0,0]),[offset,setOffset]=useState([0,0,0]);
 const [anchorCategory]=useState(job.category);const height=1.68;
 const controls=useMemo(()=>PanResponder.create({onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dx)>8,onPanResponderMove:(_,g)=>setYaw(g.dx*.008)}),[]);
 let allowed=inspectionOnly;
 try{if(!inspectionOnly)allowed=Boolean(compositionItem(job));}catch{}
 useEffect(()=>{
  let cancelled=false,loaded;
  setMesh(null);setError('');
  if(!allowed||!job.output)return;
  fetch(API_URL+'/reconstruction/jobs/'+job.id+'/output',{headers:{Authorization:'Bearer '+token},cache:'no-store'})
   .then(async r=>{if(!r.ok)throw new Error('Asset privado indisponível');const b=await r.arrayBuffer();if(b.byteLength>67108864)throw new Error('Asset excede limite');return b;})
   .then(b=>new Promise((resolve,reject)=>new GLTFLoader().parse(b,'',resolve,reject)))
   .then(g=>{loaded=g.scene;if(cancelled)dispose(loaded);else setMesh(loaded);})
   .catch(()=>{if(!cancelled)setError('Não foi possível renderizar a malha validada.');});
  return ()=>{cancelled=true;dispose(loaded);};
 },[job.id,job.output?.id,token,allowed]);
 if(!allowed)return <Text>Composição bloqueada pelo quality gate.</Text>;
 const b=job.output?.metadata?.bounds;
 const size=b?Math.max(...b.max.map((v,i)=>v-b.min[i])):1;
 const scale=inspectionOnly?1/size:job.placement.uniformScale;
 const position=inspect?[0,0,0]:(anchors[anchorCategory]||anchors.TOP).map((v,i)=>v*height+offset[i]);
 const action=(label,fn)=><Pressable key={label} accessibilityRole="button" onPress={fn} style={{padding:9,borderWidth:1,borderColor:'#bbb'}}><Text>{label}</Text></Pressable>;
 return <View style={{gap:10}}>
  <Text>{inspectionOnly?'INSPEÇÃO EXPERIMENTAL • escala ainda não calibrada':'COMPOSIÇÃO EXPERIMENTAL • avatar genérico de referência (1,68 m)'}</Text>
  <Text>Adaptação proporcional visual. Sem simulação de tecido, caimento ou avaliação metodológica.</Text>
  {error?<Text accessibilityRole="alert">{error}</Text>:null}
  <View style={{height:430,backgroundColor:'#e9e4dd'}} {...controls.panHandlers}>
   <RendererBoundary><Canvas camera={{position:[0,.9,3.5],fov:40}} gl={{antialias:true}} dpr={1}>
    <color attach="background" args={['#e9e4dd']}/><ambientLight intensity={2}/><directionalLight position={[3,4,3]} intensity={2}/>
    <Camera yaw={yaw} zoom={zoom} inspect={inspect}/>
    {!inspect&&assets?.[0]&&<Suspense fallback={null}><ReferenceAvatar uri={assets[0].localUri||assets[0].uri} height={height}/></Suspense>}
    {mesh&&visible&&<group position={position} rotation={rotation} scale={[scale,scale,scale]}><primitive object={mesh}/></group>}
   </Canvas></RendererBoundary>
  </View>
  {!mesh&&!error?<Text>Carregando geometria privada…</Text>:null}
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>
   {action('Girar ↶',()=>setYaw(v=>v-.3))}{action('Girar ↷',()=>setYaw(v=>v+.3))}
   {action('Zoom +',()=>setZoom(v=>Math.min(3,v+.2)))}{action('Zoom −',()=>setZoom(v=>Math.max(.5,v-.2)))}
   {action(visible?'Remover peça':'Adicionar peça',()=>setVisible(v=>!v))}
   {!inspectionOnly&&action(inspect?'Ver no avatar':'Inspecionar peça',()=>setInspect(v=>!v))}
   {['X','Y','Z'].map((axis,i)=>action('Orientar '+axis,()=>setRotation(r=>r.map((v,k)=>k===i?v+Math.PI/12:v))))}
   {!inspectionOnly&&['X','Y','Z'].flatMap((axis,i)=>[-1,1].map(sign=>action(axis+(sign>0?' +':' −'),()=>setOffset(o=>o.map((v,k)=>k===i?v+sign*.02:v)))))}
  </View>
  {!inspectionOnly&&compareJobs.map(j=>action('Comparar '+j.category+' • '+j.id.slice(0,6),()=>onSwap?.(j)))}
  <Text>A troca mantém câmera, avatar, posição e orientação. Dimensões da peça mudam apenas por escala uniforme declarada.</Text>
 </View>;
}
