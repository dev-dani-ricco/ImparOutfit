import React from 'react';
import {ScrollView,Text} from 'react-native';
import {useDemo} from '../contexts/DemoContext';
import {colors} from '../theme/colors';
export default function WardrobePlansScreen(){
 const {wardrobeCapacity}=useDemo();
 return <ScrollView contentContainerStyle={{padding:24,gap:16}} style={{backgroundColor:colors.bg}}>
  <Text style={{fontSize:28,color:colors.text}}>Capacidade do armário</Text>
  <Text>{wardrobeCapacity.used} peças catalogadas nesta demonstração.</Text>
  <Text>Nenhum limite de quantidade configurado nesta POC.</Text>
  <Text>Planos e acessos serão disponibilizados quando houver uma oferta ativa. Nenhuma cobrança ou contratação ocorre nesta tela.</Text>
 </ScrollView>;
}
