import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, radius, spacing, typography } from '../theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function Input({ label, error, icon, secureTextEntry, style, onFocus, onBlur, ...rest }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [focused, setFocused] = useState(false);
  const [oculto, setOculto] = useState(true);
  const esPassword = !!secureTextEntry;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          error ? styles.inputRowError : null,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? colors.primary : colors.textMuted}
            style={styles.icon}
          />
        )}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
          secureTextEntry={esPassword && oculto}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {esPassword && (
          <Pressable
            onPress={() => setOculto((v) => !v)}
            hitSlop={8}
            android_ripple={{ color: colors.border, borderless: true, radius: 18 }}
          >
            <Ionicons name={oculto ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      marginBottom: spacing.lg,
    },
    label: {
      ...typography.smallStrong,
      color: colors.secondary,
      marginBottom: spacing.sm,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md + spacing.xxs,
      minHeight: 52,
    },
    inputRowFocused: {
      borderColor: colors.primary,
    },
    inputRowError: {
      borderColor: colors.danger,
    },
    icon: { marginRight: spacing.sm },
    input: {
      flex: 1,
      ...typography.body,
      paddingVertical: spacing.md,
      color: colors.text,
    },
    error: {
      ...typography.caption,
      color: colors.danger,
      marginTop: spacing.xs,
    },
  });
