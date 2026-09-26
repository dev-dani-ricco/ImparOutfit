import React,{useEffect,useMemo,useState} from 'react';
import {View,Text,Pressable,PanResponder} from 'react-native';
import {Canvas} from './CompositionCanvas';
import {useThree} from '@react-three/fiber';
import {useAssets} from 'expo-asset';
import {File} from 'expo-file-system';
import {GLTFLoader,SkeletonUtils} from 'three-stdlib';
import * as THREE from 'three';
import {API_URL} from '../api/client';
import {compositionItem} from './composition.mjs';
import {avatarMorphWeights,garmentFitScale,normalizeAvatarSpec} from '../avatar/avatarSpec.mjs';
import {useDemo} from '../contexts/DemoContext';
import RendererBoundary from './RendererBoundary';
const avatarModule=require('../../assets/models/parametric/makehuman-parametric-base.glb');
const anchors={TOP:[0,.72,0],PANTS:[0,.40,0],DRESS:[0,.55,0],FOOTWEAR:[.10,.06,.03],BAG:[.28,.43,.05],ACCESSORY:[0,.80,.08]};
function dispose(scene){scene?.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of (Array.isArray(o.material)?o.material:[o.material]))m?.dispose();}});}
function ReferenceAvatar({uri,height,spec}){
 const [scene,setScene]=useState(null);
 useEffect(()=>{
  let cancelled=false;
  if(!uri)return;
  (async()=>{
   try{
    const buffer=await new File(uri).arrayBuffer();
    new GLTFLoader().parse(buffer,'',(gltf)=>{
     if(cancelled)return;
     const x=SkeletonUtils.clone(gltf.scene);
     const morphs=avatarMorphWeights(spec);
     x.traverse(o=>{
      if(!o.isMesh)return;
      if(o.morphTargetDictionary&&o.morphTargetInfluences){
       Object.entries(o.morphTargetDictionary).forEach(([name,index])=>{o.morphTargetInfluences[index]=morphs[name]??0;});
      }
      const mats=(Array.isArray(o.material)?o.material:[o.material]).filter(Boolean).map(m=>{
       const n=m.clone();
       const name=String(m.name||o.name||'').toLowerCase();
       if(name.includes('body'))n.color.set(spec.appearance.skinTone);
       if(name.includes('eyes'))n.color.set(spec.appearance.eyeColor);
       n.roughness=name.includes('eyes') ? 0.34 : 0.74;
       n.metalness=0;n.needsUpdate=true;return n;
      });
      o.material=Array.isArray(o.material)?mats:mats[0];
     });
     x.updateMatrixWorld(true);
     const b=new THREE.Box3().setFromObject(x),size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3());
     const scale=height/Math.max(size.y,.001);
     x.scale.setScalar(scale);x.position.set(-center.x*scale,-b.min.y*scale,-center.z*scale);
     setScene(x);
    },()=>{});
   }catch{}
  })();
  return()=>{cancelled=true;};
 },[uri,height,spec]);
 return scene?<primitive object={scene}/>:null;
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
 const {profile}=useDemo();
 const avatarSpec=useMemo(()=>normalizeAvatarSpec(profile),[profile]);
 const [assets]=useAssets([avatarModule]),[mesh,setMesh]=useState(null),[error,setError]=useState('');
 const [yaw,setYaw]=useState(0),[zoom,setZoom]=useState(1),[visible,setVisible]=useState(true),[inspect,setInspect]=useState(inspectionOnly),[fitEnabled,setFitEnabled]=useState(true);
 const [rotation,setRotation]=useState([0,0,0]),[offset,setOffset]=useState([0,0,0]);
 const [anchorCategory]=useState(job.category);const height=avatarSpec.heightCm/100;
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
 const fit=inspectionOnly||!fitEnabled?[1,1,1]:garmentFitScale(anchorCategory,avatarSpec);
 const fittedScale=[scale*fit[0],scale*fit[1],scale*fit[2]];
 const position=inspect?[0,0,0]:(anchors[anchorCategory]||anchors.TOP).map((v,i)=>v*height+offset[i]);
 const action=(label,fn)=><Pressable key={label} accessibilityRole="button" onPress={fn} style={{padding:9,borderWidth:1,borderColor:'#bbb'}}><Text>{label}</Text></Pressable>;
 return <View style={{gap:10}}>
  <Text>{inspectionOnly?'INSPEÇÃO EXPERIMENTAL • escala ainda não calibrada':'COMPOSIÇÃO 3D • avatar paramétrico + ajuste proporcional do vestuário'}</Text>
  <Text>Adaptação proporcional visual. Sem simulação de tecido, caimento ou avaliação metodológica.</Text>
  {error?<Text accessibilityRole="alert">{error}</Text>:null}
  <View style={{height:430,backgroundColor:'#e9e4dd'}} {...controls.panHandlers}>
   <RendererBoundary><Canvas camera={{position:[0,.9,3.5],fov:40}} gl={{antialias:true}} dpr={1}>
    <color attach="background" args={['#e9e4dd']}/><ambientLight intensity={2}/><directionalLight position={[3,4,3]} intensity={2}/>
    <Camera yaw={yaw} zoom={zoom} inspect={inspect}/>
    {!inspect&&assets?.[0]&&<ReferenceAvatar uri={assets[0].localUri||assets[0].uri} height={height} spec={avatarSpec}/>} 
    {mesh&&visible&&<group position={position} rotation={rotation} scale={fittedScale}><primitive object={mesh}/></group>}
   </Canvas></RendererBoundary>
  </View>
  {!mesh&&!error?<Text>Carregando geometria privada…</Text>:null}
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>
   {action('Girar ↶',()=>setYaw(v=>v-.3))}{action('Girar ↷',()=>setYaw(v=>v+.3))}
   {action('Zoom +',()=>setZoom(v=>Math.min(3,v+.2)))}{action('Zoom −',()=>setZoom(v=>Math.max(.5,v-.2)))}
   {action(visible?'Remover peça':'Adicionar peça',()=>setVisible(v=>!v))}
   {!inspectionOnly&&action(fitEnabled?'Ver escala original':'Aplicar ajuste corporal',()=>setFitEnabled(v=>!v))}
   {!inspectionOnly&&action(inspect?'Ver no avatar':'Inspecionar peça',()=>setInspect(v=>!v))}
   {['X','Y','Z'].map((axis,i)=>action('Orientar '+axis,()=>setRotation(r=>r.map((v,k)=>k===i?v+Math.PI/12:v))))}
   {!inspectionOnly&&['X','Y','Z'].flatMap((axis,i)=>[-1,1].map(sign=>action(axis+(sign>0?' +':' −'),()=>setOffset(o=>o.map((v,k)=>k===i?v+sign*.02:v)))))}
  </View>
  {!inspectionOnly&&compareJobs.map(j=>action('Comparar '+j.category+' • '+j.id.slice(0,6),()=>onSwap?.(j)))}
  {!inspectionOnly?<Text>Ajuste visual do vestuário: X {fit[0].toFixed(2)} · Y {fit[1].toFixed(2)} · Z {fit[2].toFixed(2)} com base em busto, cintura, quadril e altura. É prévia proporcional, não simulação física de tecido.</Text>:null}
  <Text>A troca mantém câmera, avatar, posição e orientação. O quality gate continua usando a escala dimensional declarada; o fit corporal é uma camada visual reversível.</Text>
 </View>;
}
