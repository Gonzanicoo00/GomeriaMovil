import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, typography } from '../theme';

interface Props {
  texto?: string;
  fullscreen?: boolean;
}

export function LoadingView({ texto = 'Cargando...', fullscreen = true }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.container, fullscreen && styles.fullscreen]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.texto}>{texto}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.huge },
    fullscreen: { flex: 1, backgroundColor: colors.background },
    texto: { ...typography.smallStrong, marginTop: spacing.md, color: colors.textMuted },
  });
