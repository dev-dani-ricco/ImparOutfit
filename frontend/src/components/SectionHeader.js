import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export default function SectionHeader({ step, eyebrow, title, description, stats }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.step}>
        <Text style={styles.stepText}>{step}</Text>
      </View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.stats}>
        {stats.map((stat, index) => (
          <View
            key={stat.label}
            style={[styles.stat, index < stats.length - 1 && styles.statDivider]}
          >
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 18, marginBottom: 24 },
  step: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 14,
  },
  stepText: {
    color: colors.bg,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  eyebrow: {
    color: colors.accent,
    fontWeight: '700',
    letterSpacing: 2.4,
    fontSize: 10,
  },
  title: {
    marginTop: 6,
    fontSize: 36,
    lineHeight: 42,
    fontFamily: 'serif',
    color: colors.text,
  },
  description: {
    marginTop: 9,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  stat: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  statDivider: { borderRightWidth: 1, borderRightColor: colors.line },
  statValue: {
    color: colors.accent,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 3,
    textTransform: 'uppercase',
  },
});
