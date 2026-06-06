// Powered by OnSpace.AI
import React, { useState } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  icon?: keyof typeof Ionicons.glyphMap;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  error,
  multiline,
  numberOfLines,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  icon,
}: InputProps) {
  const { colors } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      ) : null}
      <View style={[
        styles.inputContainer,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: focused ? colors.primary : error ? colors.error : colors.border,
          borderWidth: focused ? 1.5 : 1,
        },
        multiline && { height: (numberOfLines || 3) * 24 + 24, alignItems: 'flex-start' },
      ]}>
        {icon ? (
          <Ionicons name={icon} size={18} color={focused ? colors.primary : colors.textMuted} style={styles.icon} />
        ) : null}
        <TextInput
          style={[
            styles.input,
            { color: colors.text },
            multiline && { textAlignVertical: 'top', paddingTop: Spacing.sm },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          textAlign="right"
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: FontSize.sm, fontWeight: '600', textAlign: 'right' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 52,
    gap: Spacing.sm,
  },
  icon: {},
  input: {
    flex: 1,
    fontSize: FontSize.body,
    includeFontPadding: false,
  },
  error: { fontSize: FontSize.xs, textAlign: 'right' },
});
