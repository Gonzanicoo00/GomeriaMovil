import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, radius, spacing, typography } from '../theme';
import { haptics } from '../utils/haptics';
import { Button } from './Button';

const ETIQUETAS = ['Puntual', 'Amable', 'Buen precio', 'Trabajo prolijo', 'Rápido'];

const TEXTO_PUNTAJE = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', '¡Excelente!'];

interface Props {
  enviando: boolean;
  onEnviar: (puntuacion: number, comentario?: string) => void;
}

function Estrella({ llena, onPress, n }: { llena: boolean; onPress: () => void; n: number }) {
  const { colors } = useTheme();
  const escala = useSharedValue(1);
  const animado = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));

  return (
    <Pressable
      onPress={() => {
        escala.value = withSequence(withSpring(1.35, { damping: 6, stiffness: 500 }), withSpring(1, { damping: 10, stiffness: 300 }));
        onPress();
      }}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={`${n} estrella${n > 1 ? 's' : ''}`}
    >
      <Animated.View style={animado}>
        <Ionicons name={llena ? 'star' : 'star-outline'} size={38} color={llena ? colors.warning : colors.border} />
      </Animated.View>
    </Pressable>
  );
}

/** Estrellas + etiquetas rapidas. Las etiquetas elegidas se mandan como comentario. */
export function Calificacion({ enviando, onEnviar }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [puntuacion, setPuntuacion] = useState(0);
  const [etiquetas, setEtiquetas] = useState<string[]>([]);

  const alternar = (etiqueta: string) => {
    haptics.seleccion();
    setEtiquetas((prev) => (prev.includes(etiqueta) ? prev.filter((e) => e !== etiqueta) : [...prev, etiqueta]));
  };

  return (
    <View>
      <View style={styles.estrellas}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Estrella
            key={n}
            n={n}
            llena={n <= puntuacion}
            onPress={() => {
              haptics.seleccion();
              setPuntuacion(n);
            }}
          />
        ))}
      </View>
      <Text style={styles.puntajeTexto}>{TEXTO_PUNTAJE[puntuacion] || 'Tocá las estrellas para calificar'}</Text>

      {puntuacion > 0 && (
        <View style={styles.chips}>
          {ETIQUETAS.map((etiqueta) => {
            const activa = etiquetas.includes(etiqueta);
            return (
              <Pressable
                key={etiqueta}
                onPress={() => alternar(etiqueta)}
                style={[styles.chip, activa && styles.chipActiva]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: activa }}
              >
                {activa && <Ionicons name="checkmark" size={14} color={colors.primary} />}
                <Text style={[styles.chipTexto, activa && styles.chipTextoActiva]}>{etiqueta}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Button
        title="Enviar calificación"
        icon="star-outline"
        onPress={() => onEnviar(puntuacion, etiquetas.length ? etiquetas.join(', ') : undefined)}
        loading={enviando}
        disabled={!puntuacion}
        style={styles.boton}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    estrellas: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
    puntajeTexto: { ...typography.smallStrong, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
    chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.lg },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    chipActiva: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    chipTexto: { ...typography.smallStrong, color: colors.textMuted },
    chipTextoActiva: { color: colors.primary },
    boton: { marginTop: spacing.xl },
  });
