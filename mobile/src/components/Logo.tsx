import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, shadow, spacing, typography } from '../theme';
import { LogoMark } from './LogoMark';

interface Props {
  size?: number;
  showText?: boolean;
  /** Version para fondos de color: insignia blanca y textos claros. */
  light?: boolean;
}

export function Logo({ size = 64, showText = false, light = false }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const forma = { width: size, height: size, borderRadius: size * 0.3 };

  return (
    <View style={styles.wrapper}>
      {light ? (
        <View style={[styles.badge, styles.badgeLight, forma]}>
          <LogoMark size={size * 0.72} color={colors.heroEnd} />
        </View>
      ) : (
        <LinearGradient colors={[colors.heroStart, colors.heroEnd]} style={[styles.badge, forma]}>
          <LogoMark size={size * 0.72} color={colors.onPrimary} />
        </LinearGradient>
      )}
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
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.raised,
    },
    badgeLight: { backgroundColor: colors.onPrimary },
    textLight: { color: colors.onPrimary },
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
