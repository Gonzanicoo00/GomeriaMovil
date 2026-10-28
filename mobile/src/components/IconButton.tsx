import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { shadow, typography } from '../theme';
import { PressableScale } from './Animated';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  /**
   * flotante: circulo sobre mapas o fotos, con sombra.
   * suave: fondo primaryLight, para encabezados.
   * vidrio: blanco translucido, para fondos de color.
   * solido: fondo de color (por defecto primary).
   */
  variante?: 'flotante' | 'suave' | 'vidrio' | 'solido';
  color?: string;
  size?: number;
  /** Numero chico arriba a la derecha (por ejemplo, mensajes sin leer). */
  badge?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Boton redondo de solo icono, con escala al tocar y area minima de 44px. */
export function IconButton({ icon, onPress, accessibilityLabel, variante = 'flotante', color, size = 44, badge, disabled, style }: Props) {
  const { colors } = useTheme();

  const fondo = {
    flotante: colors.surfaceElevated,
    suave: colors.primaryLight,
    vidrio: 'rgba(255,255,255,0.18)',
    solido: color ?? colors.primary,
  }[variante];
  const colorIcono = {
    flotante: color ?? colors.text,
    suave: color ?? colors.primary,
    vidrio: colors.onPrimary,
    solido: colors.onPrimary,
  }[variante];

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      escala={0.9}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: fondo },
        variante === 'flotante' && shadow.raised,
        style,
      ]}
    >
      <Ionicons name={icon} size={Math.round(size * 0.45)} color={colorIcono} />
      {badge ? (
        <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.surface }]}>
          <Text style={[styles.badgeTexto, { color: colors.onPrimary }]} maxFontSizeMultiplier={1.2}>
            {badge > 9 ? '9+' : badge}
          </Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTexto: { ...typography.micro, fontSize: 10, lineHeight: 12 },
});
