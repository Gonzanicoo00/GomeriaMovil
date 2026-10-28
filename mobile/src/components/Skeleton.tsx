import React, { createContext, useContext, useEffect } from 'react';
import { DimensionValue, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, radius, shadow, spacing } from '../theme';

// Un solo valor animado compartido para que todos los bloques "respiren" sincronizados.
const PulsoContext = createContext<SharedValue<number> | null>(null);

export function SkeletonGroup({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const pulso = useSharedValue(0);

  useEffect(() => {
    pulso.value = withRepeat(withTiming(1, { duration: 750 }), -1, true);
  }, [pulso]);

  return (
    <PulsoContext.Provider value={pulso}>
      <View style={style} accessibilityLabel="Cargando">
        {children}
      </View>
    </PulsoContext.Provider>
  );
}

interface BoneProps {
  width?: DimensionValue;
  height?: number;
  rounded?: number;
  style?: StyleProp<ViewStyle>;
}

/** Bloque gris que ocupa el lugar de un contenido mientras carga. */
export function Bone({ width = '100%', height = 12, rounded = radius.sm, style }: BoneProps) {
  const { colors } = useTheme();
  const pulso = useContext(PulsoContext);
  const animado = useAnimatedStyle(() => ({ opacity: pulso ? 0.55 + 0.45 * pulso.value : 1 }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: rounded, backgroundColor: colors.border }, animado, style]}
    />
  );
}

/** Esqueleto con la forma de SolicitudCard. */
export function SolicitudCardSkeleton() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Bone width={40} height={40} rounded={20} />
        <View style={styles.flex}>
          <Bone width="60%" height={14} />
          <Bone width="45%" height={10} style={styles.mt} />
          <Bone width="75%" height={10} style={styles.mt} />
        </View>
      </View>
      <View style={styles.footer}>
        <Bone width={110} height={22} rounded={radius.pill} />
        <Bone width={60} height={10} />
      </View>
    </View>
  );
}

export function ListaSkeleton({ cantidad = 4 }: { cantidad?: number }) {
  return (
    <SkeletonGroup>
      {Array.from({ length: cantidad }, (_, i) => (
        <SolicitudCardSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

/** Esqueleto de una tarjeta de servicio de la grilla del inicio. */
export function ServicioSkeleton() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.card, styles.flex, styles.servicio]}>
      <Bone width={52} height={52} rounded={radius.md} />
      <Bone width="80%" height={14} style={styles.mtLg} />
      <Bone width="95%" height={10} style={styles.mt} />
      <Bone width="50%" height={14} style={styles.mtLg} />
    </View>
  );
}

/** Esqueleto de las pantallas de seguimiento: mapa de fondo y panel inferior. */
export function DetalleSkeleton() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SkeletonGroup style={styles.detalle}>
      <View style={[StyleSheet.absoluteFill, styles.mapaFondo]} />
      <View style={styles.panel}>
        <View style={styles.manija} />
        <Bone width="55%" height={22} />
        <Bone width="80%" height={12} style={styles.mt} />
        <View style={[styles.row, styles.mtXl, styles.entre]}>
          {Array.from({ length: 5 }, (_, i) => (
            <Bone key={i} width={30} height={30} rounded={15} />
          ))}
        </View>
        <View style={[styles.card, styles.row, styles.mtXl]}>
          <Bone width={48} height={48} rounded={24} />
          <View style={styles.flex}>
            <Bone width="55%" height={14} />
            <Bone width="35%" height={10} style={styles.mt} />
          </View>
        </View>
      </View>
    </SkeletonGroup>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...shadow.card,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    entre: { justifyContent: 'space-between' },
    flex: { flex: 1 },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    servicio: { marginBottom: 0 },
    detalle: { flex: 1, backgroundColor: colors.background, justifyContent: 'flex-end' },
    mapaFondo: { backgroundColor: colors.border, opacity: 0.5 },
    panel: {
      backgroundColor: colors.surfaceElevated,
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.huge,
    },
    manija: {
      alignSelf: 'center',
      width: 40,
      height: 5,
      borderRadius: radius.pill,
      backgroundColor: colors.border,
      marginTop: spacing.md,
      marginBottom: spacing.xl,
    },
    mt: { marginTop: spacing.sm },
    mtLg: { marginTop: spacing.md },
    mtXl: { marginTop: spacing.lg },
  });
