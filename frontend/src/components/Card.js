import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export default function Card({
  title,
  subtitle,
  description,
  image,
  children,
  onImagePress,
  imageOverlay,
}) {
  return <View style={styles.card}>
    {image ? (
      <Pressable disabled={!onImagePress} onPress={onImagePress} style={styles.imageWrap}>
        <Image source={image} style={styles.image} resizeMode="cover" />
        {imageOverlay}
      </Pressable>
    ) : null}
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
  imageWrap: { width: '100%', height: 250, backgroundColor: colors.surface, marginTop: 14 },
  image: { width: '100%', height: '100%', backgroundColor: colors.surface },
  body: { paddingVertical: 16 },
  subtitle: { color: colors.accent, fontSize: 10, fontWeight: '600', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 7 },
  title: { fontSize: 26, fontFamily: 'serif', color: colors.text },
  description: { color: colors.muted, lineHeight: 21, marginTop: 8 },
});
