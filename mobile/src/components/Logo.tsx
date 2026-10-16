import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, shadow, spacing, typography } from '../theme';

interface Props {
  size?: number;
  showText?: boolean;
  /** Version para fondos de color: insignia blanca y textos claros. */
  light?: boolean;
}

export function Logo({ size = 64, showText = false, light = false }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.badge,
          { width: size, height: size, borderRadius: size / 2 },
          light && styles.badgeLight,
        ]}
      >
        <Ionicons name="car-sport" size={size * 0.52} color={light ? colors.primary : '#fff'} />
      </View>
      {showText && (
        <View style={styles.textWrap}>
          <Text style={[styles.title, light && styles.textLight]}>Gomería Móvil</Text>
          <Text style={[styles.subtitle, light && styles.subtitleLight]}>Auxilio con neumáticos, a un toque de distancia</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: { alignItems: 'center' },
    badge: {
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.raised,
    },
    badgeLight: { backgroundColor: '#fff' },
    textLight: { color: '#fff' },
    subtitleLight: { color: 'rgba(255,255,255,0.85)' },
    textWrap: { alignItems: 'center', marginTop: spacing.lg },
    title: { ...typography.display, color: colors.secondary },
    subtitle: {
      ...typography.small,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.sm,
      maxWidth: 260,
    },
  });
