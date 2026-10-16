import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, radius, shadow, spacing } from '../theme';

// Un solo valor animado compartido para que todos los bloques "respiren" sincronizados.
const PulsoContext = createContext<Animated.Value | null>(null);

export function SkeletonGroup({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
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
  const opacity = pulso ? pulso.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) : 1;

  return (
    <Animated.View
      style={[{ width, height, borderRadius: rounded, backgroundColor: colors.border, opacity }, style]}
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

/** Esqueleto de la pantalla de detalle de una solicitud. */
export function DetalleSkeleton() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SkeletonGroup style={styles.detalle}>
      <Bone width="65%" height={24} />
      <Bone width="45%" height={12} style={styles.mt} />
      <View style={[styles.card, styles.mtXl]}>
        <Bone width="50%" height={16} />
        <Bone width="85%" height={10} style={styles.mt} />
        <View style={[styles.row, styles.mtXl, styles.entre]}>
          {Array.from({ length: 5 }, (_, i) => (
            <Bone key={i} width={30} height={30} rounded={15} />
          ))}
        </View>
      </View>
      <View style={[styles.card, styles.row]}>
        <Bone width={44} height={44} rounded={22} />
        <View style={styles.flex}>
          <Bone width="55%" height={14} />
          <Bone width="35%" height={10} style={styles.mt} />
        </View>
      </View>
      <Bone height={280} rounded={radius.lg} />
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
      borderTopColor: colors.background,
    },
    servicio: { marginBottom: 0 },
    detalle: { padding: spacing.xl, paddingTop: spacing.lg },
    mt: { marginTop: spacing.sm },
    mtLg: { marginTop: spacing.md },
    mtXl: { marginTop: spacing.lg },
  });
