import React, { useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme } from '../context/ThemeContext';
import { LogoMark } from './LogoMark';

// Deben coincidir con el plugin expo-splash-screen de app.json (backgroundColor e imageWidth).
const FONDO_CLARO = '#EA580C';
const FONDO_OSCURO = '#C2410C';
const TAM_LOGO = 140;

/**
 * Copia exacta del splash nativo que se dibuja encima de la app. Apenas se monta se oculta el
 * splash nativo (el cambio no se nota) y esta copia se anima: el logo gira y crece mientras todo se desvanece.
 */
export function SplashAnimado() {
  const { isDark } = useTheme();
  const [terminado, setTerminado] = useState(false);
  const opacidad = useSharedValue(1);
  const escala = useSharedValue(1);
  const giro = useSharedValue(0);
  const empezado = useRef(false);

  const empezar = () => {
    if (empezado.current) return;
    empezado.current = true;
    SplashScreen.hide();
    giro.value = withTiming(1, { duration: 700, easing: Easing.inOut(Easing.cubic) });
    escala.value = withSequence(
      withTiming(0.88, { duration: 250, easing: Easing.out(Easing.quad) }),
      withTiming(6, { duration: 450, easing: Easing.in(Easing.cubic) })
    );
    opacidad.value = withDelay(
      400,
      withTiming(0, { duration: 300 }, (ok) => {
        if (ok) scheduleOnRN(setTerminado, true);
      })
    );
  };

  const fondo = useAnimatedStyle(() => ({ opacity: opacidad.value }));
  const logo = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }, { rotate: `${giro.value * 120}deg` }],
  }));

  if (terminado) return null;

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={empezar}
      style={[StyleSheet.absoluteFill, styles.centro, { backgroundColor: isDark ? FONDO_OSCURO : FONDO_CLARO }, fondo]}
    >
      <Animated.View style={logo}>
        <LogoMark size={TAM_LOGO} color="#FFFFFF" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center', zIndex: 100 },
});
