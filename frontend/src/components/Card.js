import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export default function Card({ title, subtitle, description, image, children }) {
  return <View style={styles.card}>
    {image ? <Image source={image} style={styles.image} resizeMode="cover" /> : null}
    <View style={styles.body}>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {children}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, marginHorizontal: 18, marginBottom: 28, overflow: 'hidden', borderTopWidth: 1, borderColor: colors.line },
  image: { width: '100%', height: 250, backgroundColor: colors.surface, marginTop: 14 },
  body: { paddingVertical: 16 },
  subtitle: { color: colors.accent, fontSize: 10, fontWeight: '600', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 7 },
  title: { fontSize: 26, fontFamily: 'serif', color: colors.text },
  description: { color: colors.muted, lineHeight: 21, marginTop: 8 },
});
