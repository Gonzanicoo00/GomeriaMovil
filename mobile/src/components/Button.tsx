import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, radius, shadow, spacing, typography } from '../theme';
import { haptics } from '../utils/haptics';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export function Button({ title, onPress, loading, disabled, variant = 'primary', icon, style }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';
  const iconColor = isOutline ? colors.primary : '#fff';
  const rippleColor = isOutline ? colors.primaryLight : 'rgba(255,255,255,0.25)';

  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      disabled={disabled || loading}
      android_ripple={{ color: rippleColor }}
      style={({ pressed }) => [
        styles.base,
        isOutline && styles.outline,
        isDanger && styles.danger,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={iconColor} style={styles.icon} />}
          <Text style={[styles.text, isOutline && styles.textOutline]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      minHeight: 52,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.card,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primary,
      shadowOpacity: 0,
      elevation: 0,
    },
    danger: {
      backgroundColor: colors.danger,
    },
    disabled: {
      opacity: 0.5,
      shadowOpacity: 0,
      elevation: 0,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    icon: { marginRight: spacing.sm },
    text: {
      ...typography.subheading,
      fontSize: 16,
      color: '#fff',
    },
    textOutline: {
      color: colors.primary,
    },
  });
