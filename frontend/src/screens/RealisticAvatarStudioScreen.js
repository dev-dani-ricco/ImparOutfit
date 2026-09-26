import React,{useMemo,useState} from 'react';
import {Alert,Pressable,SafeAreaView,StyleSheet,Text,View} from 'react-native';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import {WebView} from 'react-native-webview';
import {realisticAvatarFromExport} from '../avatar/avatarProvider.mjs';
import {useDemo} from '../contexts/DemoContext';
import {colors} from '../theme/colors';

function html(projectUrl){
 const safe=JSON.stringify(projectUrl);
 return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>html,body,#avaturn{margin:0;width:100%;height:100%;overflow:hidden;background:#e6ded6}.status{position:fixed;left:12px;bottom:12px;z-index:20;background:rgba(15,15,16,.82);color:white;padding:8px 10px;font:11px system-ui}</style></head><body><div id="avaturn"></div><div class="status" id="status">Carregando Avatar Studio…</div><script type="module">
 import {AvaturnSDK} from "https://cdn.jsdelivr.net/npm/@avaturn/sdk/dist/index.js";
 const post=(type,payload={})=>window.ReactNativeWebView?.postMessage(JSON.stringify({type,payload}));
 try{
  const sdk=new AvaturnSDK();
  await sdk.init(document.getElementById('avaturn'),{url:${safe}});
  document.getElementById('status').style.display='none';
  post('READY');
  sdk.on('export',(data)=>post('EXPORT',data));
 }catch(error){
  document.getElementById('status').textContent='Não foi possível abrir o estúdio.';
  post('ERROR',{message:error?.message||String(error)});
 }
 </script></body></html>`;
}

export default function RealisticAvatarStudioScreen({navigation}){
 const {profile,setProfile}=useDemo();
 const projectUrl=Constants.expoConfig?.extra?.avaturnProjectUrl||'https://demo.avaturn.dev';
 const [ready,setReady]=useState(false);
 const [error,setError]=useState('');
 const source=useMemo(()=>({html:html(projectUrl),baseUrl:'https://app.imparoutfit.local'}),[projectUrl]);

 async function onMessage(event){
  let message;
  try{message=JSON.parse(event.nativeEvent.data);}catch{return;}
  if(message.type==='READY'){setReady(true);setError('');return;}
  if(message.type==='ERROR'){setError(message.payload?.message||'Falha no provedor de avatar.');return;}
  if(message.type==='EXPORT'){
   try{
    const realisticAvatar=realisticAvatarFromExport(message.payload);
    const next={...profile,realisticAvatar,avatarConfiguredAt:profile.avatarConfiguredAt||new Date().toISOString(),avatarEngine:'avaturn-realistic-v1'};
    setProfile(next);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>{});
    Alert.alert('Avatar realista salvo','Seu modelo foi vinculado ao IMPAR Outfit e passa a ser a representação principal.',[{text:'VER NO PERFIL',onPress:()=>navigation.goBack()}]);
   }catch(caught){setError(caught.message);}
  }
 }

 return <SafeAreaView style={styles.safe}>
  <View style={styles.header}>
   <Pressable onPress={()=>navigation.goBack()} style={styles.back}><Text style={styles.backText}>← VOLTAR</Text></Pressable>
   <View style={styles.headCopy}><Text style={styles.kicker}>IMPAR DIGITAL ATELIER</Text><Text style={styles.title}>Avatar Realista</Text></View>
   <View style={styles.status}><View style={[styles.dot,error&&styles.dotError]}/><Text style={styles.statusText}>{error?'ERRO':ready?'ATIVO':'CONECTANDO'}</Text></View>
  </View>
  <View style={styles.notice}>
   <Text style={styles.noticeTitle}>FOTO → ROSTO → CORPO → CABELO → AVATAR 3D</Text>
   <Text style={styles.noticeCopy}>Use fotos nítidas e iluminação uniforme. O resultado é uma representação digital, não medição biométrica nem garantia de caimento físico.</Text>
  </View>
  {error?<View style={styles.error}><Text style={styles.errorText}>{error}</Text></View>:null}
  <WebView
   source={source}
   style={styles.web}
   originWhitelist={['https://*']}
   javaScriptEnabled
   domStorageEnabled
   allowsInlineMediaPlayback
   mediaPlaybackRequiresUserAction={false}
   onMessage={onMessage}
   onError={(e)=>setError(e.nativeEvent.description||'Falha ao abrir o Avatar Studio.')}
  />
 </SafeAreaView>;
}
const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#F7F3EE'},
 header:{paddingHorizontal:16,paddingVertical:12,backgroundColor:'#0B0B0C',flexDirection:'row',alignItems:'center',gap:12},
 back:{paddingVertical:8},backText:{color:'#C9C1B8',fontSize:8,fontWeight:'900',letterSpacing:1},
 headCopy:{flex:1},kicker:{color:colors.gold,fontSize:6,fontWeight:'900',letterSpacing:1.4},title:{color:'#FFF',fontFamily:'serif',fontSize:23,marginTop:2},
 status:{flexDirection:'row',alignItems:'center',gap:5,borderWidth:1,borderColor:'#514943',paddingHorizontal:7,paddingVertical:5},dot:{width:5,height:5,borderRadius:3,backgroundColor:'#67A978'},dotError:{backgroundColor:'#CC5A5A'},statusText:{color:'#FFF',fontSize:6,fontWeight:'900'},
 notice:{paddingHorizontal:16,paddingVertical:10,backgroundColor:'#EDE5DC'},noticeTitle:{color:colors.accent,fontSize:7,fontWeight:'900',letterSpacing:1},noticeCopy:{color:'#665E57',fontSize:9,lineHeight:14,marginTop:3},
 error:{padding:10,backgroundColor:'#F5DFDF'},errorText:{color:'#922',fontSize:10},
 web:{flex:1,backgroundColor:'#E6DED6'}
});
