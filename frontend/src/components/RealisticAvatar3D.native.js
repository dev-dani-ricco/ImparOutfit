import React,{useEffect,useMemo,useState} from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {Canvas} from '@react-three/fiber/native';
import {GLTFLoader,SkeletonUtils} from 'three-stdlib';
import * as THREE from 'three';
import {colors} from '../theme/colors';

function useRemoteGltf(url){
 const [state,setState]=useState({gltf:null,error:null});
 useEffect(()=>{
  let cancelled=false;
  if(!url){setState({gltf:null,error:null});return()=>{cancelled=true;};}
  (async()=>{
   try{
    const response=await fetch(url);
    if(!response.ok)throw new Error('Falha ao carregar avatar remoto: '+response.status);
    const buffer=await response.arrayBuffer();
    if(cancelled)return;
    new GLTFLoader().parse(buffer,'',(gltf)=>!cancelled&&setState({gltf,error:null}),(error)=>!cancelled&&setState({gltf:null,error}));
   }catch(error){if(!cancelled)setState({gltf:null,error});}
  })();
  return()=>{cancelled=true;};
 },[url]);
 return state;
}

function Human({gltf}){
 const prepared=useMemo(()=>{
  const scene=SkeletonUtils.clone(gltf.scene);
  scene.traverse((o)=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  scene.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(scene),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const scale=4.3/Math.max(size.y,.001);
  return {scene,scale,center,box};
 },[gltf.scene]);
 return <primitive object={prepared.scene} scale={prepared.scale} position={[-prepared.center.x*prepared.scale,-prepared.box.min.y*prepared.scale,-prepared.center.z*prepared.scale]}/>;
}

export default function RealisticAvatar3D({avatar,compact=false}){
 const {gltf,error}=useRemoteGltf(avatar?.url);
 return <View style={styles.wrapper}>
  <View style={[styles.stage,{height:compact?330:470}]}>
   <Canvas camera={{position:[0,.1,7.4],fov:37}} shadows="basic" dpr={1.25}>
    <color attach="background" args={['#E6DED6']}/>
    <ambientLight intensity={1.65}/>
    <hemisphereLight intensity={1.1} color="#FFF5EA" groundColor="#7D746C"/>
    <directionalLight position={[-3,5,5]} intensity={3.1} castShadow/>
    <directionalLight position={[4,2,-2]} intensity={1.5}/>
    {gltf?<Human gltf={gltf}/>:null}
   </Canvas>
   <View style={styles.heading}><Text style={styles.overline}>IMPAR DIGITAL ATELIER</Text><Text style={styles.title}>AVATAR REALISTA</Text></View>
   <View style={styles.badge}><View style={[styles.dot,error&&styles.dotError]}/><Text style={styles.badgeText}>{error?'ERRO NO MODELO':gltf?'AVATAR REALISTA ATIVO':'CARREGANDO'}</Text></View>
  </View>
  <View style={styles.footer}>
   <Text style={styles.footerTitle}>PROVEDOR · AVATURN</Text>
   <Text style={styles.footerCopy}>Modelo derivado da personalização/fotos do usuário. A semelhança depende da qualidade de captura e do provedor.</Text>
  </View>
 </View>;
}
const styles=StyleSheet.create({
 wrapper:{borderWidth:1,borderColor:'#B8AA9E',backgroundColor:colors.surface},
 stage:{overflow:'hidden',backgroundColor:'#E6DED6'},
 heading:{position:'absolute',left:14,top:14},
 overline:{color:'rgba(46,35,31,.55)',fontSize:6,fontWeight:'900',letterSpacing:1.4},
 title:{color:'#2C211E',fontFamily:'serif',fontSize:23,marginTop:2},
 badge:{position:'absolute',right:12,top:14,flexDirection:'row',alignItems:'center',gap:5,borderWidth:1,borderColor:'rgba(116,25,52,.3)',backgroundColor:'rgba(248,243,237,.84)',paddingHorizontal:8,paddingVertical:5},
 dot:{width:5,height:5,borderRadius:3,backgroundColor:'#4F8D64'},dotError:{backgroundColor:'#B3261E'},
 badgeText:{color:colors.accent,fontSize:6,fontWeight:'900',letterSpacing:.75},
 footer:{padding:13,borderTopWidth:1,borderColor:'#C9BDB2',backgroundColor:'#FBF8F4'},
 footerTitle:{color:colors.accent,fontSize:7,fontWeight:'900',letterSpacing:.9},
 footerCopy:{color:colors.muted,fontSize:8,lineHeight:13,marginTop:4}
});
