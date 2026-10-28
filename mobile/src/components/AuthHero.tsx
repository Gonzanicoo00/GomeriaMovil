import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing } from '../theme';

/**
 * Encabezado naranja (degradado) con circulos decorativos para login y registro.
 * Mientras la pantalla esta enfocada, la barra de estado pasa a iconos blancos.
 */
export function AuthHero({ children, compacto = false }: { children: React.ReactNode; compacto?: boolean }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const enfocada = useIsFocused();

  return (
    <View
      style={[
        styles.hero,
        { backgroundColor: colors.heroEnd, paddingTop: insets.top + (compacto ? spacing.xl : spacing.huge) },
        compacto && styles.compacto,
      ]}
    >
      {enfocada && <StatusBar style="light" />}
      <LinearGradient colors={[colors.heroStart, colors.heroEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[styles.circulo, styles.circuloGrande]} />
      <View style={[styles.circulo, styles.circuloChico]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.huge + spacing.xxxl,
    overflow: 'hidden',
  },
  compacto: { paddingBottom: spacing.huge + spacing.xl },
  circulo: { position: 'absolute', borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.08)' },
  circuloGrande: { width: 300, height: 300, top: -120, right: -110 },
  circuloChico: { width: 180, height: 180, bottom: -70, left: -60 },
});
