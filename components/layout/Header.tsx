// Powered by OnSpace.AI
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { FontSize, Spacing } from '@/constants/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  gradient?: boolean;
}

export function Header({ title, subtitle, onBack, rightElement, gradient = false }: HeaderProps) {
  const { colors } = useTheme();

  const content = (
    <View style={styles.container}>
      <View style={styles.left}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={gradient ? '#fff' : colors.text} />
          </Pressable>
        ) : <View style={styles.placeholder} />}
      </View>
      <View style={styles.center}>
        <Text style={[styles.title, { color: gradient ? '#fff' : colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: gradient ? '#ffffffaa' : colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>
        {rightElement || <View style={styles.placeholder} />}
      </View>
    </View>
  );

  if (gradient) {
    return (
      <LinearGradient
        colors={[colors.primaryDark, colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientWrap}
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.gradientWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  gradientWrap: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { width: 44, alignItems: 'flex-start' },
  right: { width: 44, alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center' },
  backBtn: { padding: Spacing.xs },
  placeholder: { width: 44 },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: FontSize.xs,
  },
});
