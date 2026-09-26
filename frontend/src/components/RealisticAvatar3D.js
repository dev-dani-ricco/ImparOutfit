import React from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {colors} from '../theme/colors';
export default function RealisticAvatar3D(){
 return <View style={styles.box}><Text style={styles.title}>Avatar realista</Text><Text style={styles.copy}>A visualização 3D realista está disponível no app iOS/Android.</Text></View>;
}
const styles=StyleSheet.create({box:{padding:28,backgroundColor:'#E6DED6',borderWidth:1,borderColor:'#B8AA9E'},title:{fontFamily:'serif',fontSize:24,color:'#2C211E'},copy:{marginTop:8,color:colors.muted,lineHeight:18}});
