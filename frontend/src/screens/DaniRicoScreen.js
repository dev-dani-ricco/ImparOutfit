import React from 'react';
import {ScrollView,Text,View,StyleSheet} from 'react-native';
import {colors} from '../theme/colors';
// Public interface reference only. A future authenticated resolver supplies approved content.
export const DANI_CONTENT_REFERENCE=Object.freeze({id:'dani-client-content',status:'NOT_CONNECTED'});
export default function DaniRicoScreen(){
 return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
  <View style={styles.hero}><Text style={styles.tag}>UNIVERSO ÍMPAR • DEMONSTRAÇÃO</Text>
   <Text style={styles.title}>Dani Digital</Text>
   <Text style={styles.intro}>Espaço reservado para acompanhamento autorizado.</Text>
  </View>
  {['Conteúdo e aulas','Revisão de Looks','Agendamento'].map(title=><View key={title} style={styles.card}>
   <Text style={styles.heading}>{title}</Text>
   <Text style={styles.copy}>Serviço ainda não conectado. Nenhuma análise, aula ou reserva é realizada nesta demonstração.</Text>
  </View>)}
  <Text style={styles.copy}>Você pode continuar organizando seu armário e explorando a captura experimental de peças.</Text>
 </ScrollView>;
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:colors.bg},content:{padding:20,gap:18},hero:{backgroundColor:colors.primary,padding:24},tag:{color:colors.gold,fontSize:10},title:{color:colors.bg,fontSize:36,fontFamily:'serif',marginVertical:14},intro:{color:colors.bg,lineHeight:22},card:{borderWidth:1,borderColor:colors.line,padding:18,gap:10},heading:{fontSize:23,color:colors.text,fontFamily:'serif'},copy:{color:colors.muted,lineHeight:22}});
