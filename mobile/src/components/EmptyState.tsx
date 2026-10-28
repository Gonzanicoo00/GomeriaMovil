import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, radius, spacing, typography } from '../theme';
import { Button } from './Button';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  /** Boton opcional para que el estado vacio lleve a la accion que lo resuelve. */
  actionLabel?: string;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onAction?: () => void;
}

const ANCHO = 168;
const ALTO = 128;

export function EmptyState({ icon = 'file-tray-outline', title, subtitle, actionLabel, actionIcon, onAction }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.ilustracion}>
        {/* Escena de fondo: mancha suave, tarjetas apiladas y detalles decorativos */}
        <Svg width={ANCHO} height={ALTO} viewBox={`0 0 ${ANCHO} ${ALTO}`} style={StyleSheet.absoluteFill}>
          <Path
            d="M84 8c30 0 62 14 70 44s-14 64-48 70-74 2-90-24S8 44 30 26 56 8 84 8z"
            fill={colors.primaryLight}
          />
          <Rect x="40" y="34" width="88" height="68" rx="14" fill={colors.surface} stroke={colors.border} strokeWidth="1.5" />
          <Rect x="52" y="24" width="64" height="10" rx="5" fill={colors.border} opacity={0.7} />
          <Circle cx="24" cy="30" r="4" fill={colors.primary} opacity={0.35} />
          <Circle cx="148" cy="96" r="5" fill={colors.primary} opacity={0.25} />
          <Circle cx="140" cy="22" r="2.5" fill={colors.primary} opacity={0.5} />
          <Path d="M20 96l4 4m0-4l-4 4" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" opacity={0.5} />
        </Svg>
        <Ionicons name={icon} size={34} color={colors.primary} style={styles.icono} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} icon={actionIcon} variant="outline" onPress={onAction} style={styles.boton} />
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.huge, paddingHorizontal: spacing.xxl },
    ilustracion: {
      width: ANCHO,
      height: ALTO,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    // centrado sobre la tarjeta del dibujo (que esta un poco mas abajo que el centro)
    icono: { marginTop: spacing.sm, marginLeft: spacing.lg },
    title: { ...typography.heading, color: colors.text, textAlign: 'center' },
    subtitle: { ...typography.small, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs, maxWidth: 280 },
    boton: { marginTop: spacing.xl, minWidth: 200, borderRadius: radius.pill },
  });
