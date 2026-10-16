import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';

interface FadeInProps {
  children: React.ReactNode;
  /** Posicion en la lista: cada item aparece un poco despues que el anterior. */
  index?: number;
  style?: StyleProp<ViewStyle>;
}

/** Aparece con un fundido y un leve desplazamiento hacia arriba. */
export function FadeIn({ children, index = 0, style }: FadeInProps) {
  const progreso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progreso, {
      toValue: 1,
      duration: 320,
      delay: Math.min(index, 8) * 55,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progreso, index]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progreso,
          transform: [{ translateY: progreso.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}
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
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulso, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [pulso]);

  const halo = size * 2.6;

  return (
    <Animated.View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: halo,
          height: halo,
          borderRadius: halo / 2,
          backgroundColor: color,
          opacity: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
          transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
        }}
      />
      <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </Animated.View>
  );
}
