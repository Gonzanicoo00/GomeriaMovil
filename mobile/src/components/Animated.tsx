import React, { useEffect } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface FadeInProps {
  children: React.ReactNode;
  /** Posicion en la lista: cada item aparece un poco despues que el anterior. */
  index?: number;
  style?: StyleProp<ViewStyle>;
}

/** Aparece con un fundido y un leve desplazamiento hacia arriba. */
export function FadeIn({ children, index = 0, style }: FadeInProps) {
  return (
    <Animated.View
      style={style}
      entering={FadeInDown.duration(320).delay(Math.min(index, 8) * 55).easing(Easing.out(Easing.cubic))}
    >
      {children}
    </Animated.View>
  );
}

interface PulseDotProps {
  color: string;
  size?: number;
}

/** Punto que "late" para indicar que algo esta en vivo. */
export function PulseDot({ color, size = 8 }: PulseDotProps) {
  const pulso = useSharedValue(0);

  useEffect(() => {
    pulso.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.ease) }), -1, false);
  }, [pulso]);

  const halo = size * 2.6;
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - pulso.value),
    transform: [{ scale: 0.4 + 0.6 * pulso.value }],
  }));

  return (
    <Animated.View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          { position: 'absolute', width: halo, height: halo, borderRadius: halo / 2, backgroundColor: color },
          haloStyle,
        ]}
      />
      <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </Animated.View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Escala al mantener apretado. */
  escala?: number;
}

/**
 * Pressable que se achica un poco al tocarlo. A diferencia del ripple (solo Android),
 * da respuesta visual en las dos plataformas.
 */
export function PressableScale({ style, escala = 0.97, onPressIn, onPressOut, disabled, ...rest }: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animado = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        scale.value = withSpring(escala, { damping: 20, stiffness: 400 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 14, stiffness: 300 });
        onPressOut?.(e);
      }}
      style={[style, animado]}
    />
  );
}
