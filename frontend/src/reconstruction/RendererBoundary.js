import React from 'react';
import {Text,View} from 'react-native';
export default class RendererBoundary extends React.Component{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<View style={{padding:20}}><Text accessibilityRole="alert">Renderização 3D indisponível neste dispositivo ou navegador. A malha não foi exibida; o resultado permanece experimental.</Text></View>:this.props.children;}
}
