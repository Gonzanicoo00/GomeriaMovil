import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, typography } from '../theme';

interface Props {
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
  fullscreen?: boolean;
}

export function ErrorState({ title = 'No se pudo conectar', subtitle, onRetry, fullscreen = false }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.container, fullscreen && styles.fullscreen]}>
      <View style={styles.iconWrap}>
        <Ionicons name="cloud-offline-outline" size={30} color={colors.danger} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {onRetry && (
        <Button title="Reintentar" icon="refresh-outline" variant="outline" onPress={onRetry} style={styles.button} />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.huge + spacing.sm, paddingHorizontal: spacing.xxl },
    fullscreen: { flex: 1, backgroundColor: colors.background },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.dangerLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: { ...typography.subheading, color: colors.text, textAlign: 'center' },
    subtitle: { ...typography.small, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs, maxWidth: 260 },
    button: { marginTop: spacing.lg, minWidth: 160 },
  });
