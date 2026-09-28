import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BodyAvatar3D from './BodyAvatar3D';
import { colors } from '../theme/colors';

export default function ParametricAvatar3D({ profile }) {
  return (
    <View>
      <BodyAvatar3D profile={profile} />
      <Text style={styles.note}>A edição paramétrica completa é otimizada para iOS/Android.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { color: colors.muted, fontSize: 9, textAlign: 'center', marginTop: 6 },
});
