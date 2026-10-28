import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, radius, shadow, spacing } from '../theme';

interface Props {
  /** Alto visible cuando esta colapsado (lo que queda arriba del mapa). */
  alturaColapsada: number;
  /** Alto total cuando se expande. */
  alturaExpandida: number;
  /** Parte fija de arriba: se puede arrastrar para subir o bajar el panel. */
  encabezado: React.ReactNode;
  children: React.ReactNode;
}

const RESORTE = { damping: 22, stiffness: 220, mass: 0.9 };

/**
 * Panel que sube desde abajo sobre un mapa, con dos posiciones (colapsado y expandido).
 * Se arrastra desde la manija o el encabezado; tocar la manija alterna entre las dos posiciones.
 */
export function BottomSheet({ alturaColapsada, alturaExpandida, encabezado, children }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const recorrido = Math.max(0, alturaExpandida - alturaColapsada);

  // 0 = expandido, recorrido = colapsado
  const y = useSharedValue(recorrido);
  const inicio = useSharedValue(0);

  // Cada GestureDetector necesita su propia instancia del gesto, por eso se crean con una funcion.
  const gestos = useMemo(() => {
    const crearArrastre = () =>
      Gesture.Pan()
        .activeOffsetY([-8, 8])
        .onBegin(() => {
          inicio.value = y.value;
        })
        .onUpdate((e) => {
          const destino = inicio.value + e.translationY;
          // un poco de resistencia si se pasa de los limites
          if (destino < 0) y.value = destino * 0.25;
          else if (destino > recorrido) y.value = recorrido + (destino - recorrido) * 0.25;
          else y.value = destino;
        })
        .onEnd((e) => {
          let destino: number;
          if (e.velocityY > 600) destino = recorrido;
          else if (e.velocityY < -600) destino = 0;
          else destino = y.value > recorrido / 2 ? recorrido : 0;
          y.value = withSpring(destino, RESORTE);
        });

    const toque = Gesture.Tap().onEnd(() => {
      y.value = withSpring(y.value > recorrido / 2 ? 0 : recorrido, RESORTE);
    });

    return { manija: Gesture.Exclusive(crearArrastre(), toque), encabezado: crearArrastre() };
  }, [recorrido, inicio, y]);

  const animado = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return (
    <Animated.View style={[styles.sheet, { height: alturaExpandida }, animado]}>
      <GestureDetector gesture={gestos.manija}>
        <View style={styles.manijaZona} accessibilityRole="adjustable" accessibilityLabel="Deslizá para ver más detalles">
          <View style={styles.manija} />
        </View>
      </GestureDetector>
      <GestureDetector gesture={gestos.encabezado}>
        <View>{encabezado}</View>
      </GestureDetector>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </Animated.View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.surfaceElevated,
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      ...shadow.raised,
      shadowOffset: { width: 0, height: -4 },
      elevation: 16,
    },
    manijaZona: { alignItems: 'center', paddingTop: spacing.md, paddingBottom: spacing.sm },
    manija: { width: 40, height: 5, borderRadius: radius.pill, backgroundColor: colors.border },
    scroll: { flex: 1 },
  });
