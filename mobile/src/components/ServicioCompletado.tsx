import React, { useEffect } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, radius, spacing, tabular, typography } from '../theme';
import { Button } from './Button';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const TAM = 112;
const R = 50;
const LARGO_CIRCULO = 2 * Math.PI * R;
const LARGO_CHECK = 60;

/** Circulo que se dibuja y luego un check, como confirmacion de exito. */
function CheckAnimado() {
  const { colors } = useTheme();
  const circulo = useSharedValue(0);
  const check = useSharedValue(0);
  const escala = useSharedValue(0.6);

  useEffect(() => {
    escala.value = withSpring(1, { damping: 10, stiffness: 160 });
    circulo.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    check.value = withDelay(450, withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }));
  }, [circulo, check, escala]);

  const propsCirculo = useAnimatedProps(() => ({ strokeDashoffset: LARGO_CIRCULO * (1 - circulo.value) }));
  const propsCheck = useAnimatedProps(() => ({ strokeDashoffset: LARGO_CHECK * (1 - check.value) }));
  const estiloEscala = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));

  return (
    <Animated.View style={[styles.check, { backgroundColor: colors.successLight }, estiloEscala]}>
      <Svg width={TAM} height={TAM} viewBox="0 0 112 112">
        <AnimatedCircle
          cx="56"
          cy="56"
          r={R}
          stroke={colors.success}
          strokeWidth="5"
          fill="none"
          strokeDasharray={LARGO_CIRCULO}
          strokeLinecap="round"
          transform="rotate(-90 56 56)"
          animatedProps={propsCirculo}
        />
        <AnimatedPath
          d="M34 57 L49 72 L78 42"
          stroke={colors.success}
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={LARGO_CHECK}
          animatedProps={propsCheck}
        />
      </Svg>
    </Animated.View>
  );
}

export interface FilaResumen {
  label: string;
  valor: string;
  destacado?: boolean;
}

interface Props {
  visible: boolean;
  titulo: string;
  subtitulo: string;
  resumen: FilaResumen[];
  /** Contenido extra debajo del resumen (por ejemplo, la calificacion). */
  children?: React.ReactNode;
  textoCerrar: string;
  onCerrar: () => void;
}

/** Pantalla de exito a pantalla completa al terminar un servicio. */
export function ServicioCompletado({ visible, titulo, subtitulo, resumen, children, textoCerrar, onCerrar }: Props) {
  const { colors } = useTheme();
  const estilos = createStyles(colors);
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar} statusBarTranslucent>
      <ScrollView
        style={estilos.fondo}
        contentContainerStyle={[estilos.contenido, { paddingTop: insets.top + spacing.huge, paddingBottom: insets.bottom + spacing.xxl }]}
      >
        {visible && <CheckAnimado />}
        <Animated.Text entering={FadeInDown.delay(500).duration(400)} style={estilos.titulo}>
          {titulo}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(600).duration(400)} style={estilos.subtitulo}>
          {subtitulo}
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(700).duration(400)} style={estilos.resumen}>
          {resumen.map((fila, i) => (
            <View key={fila.label} style={[estilos.fila, i > 0 && estilos.filaBorde]}>
              <Text style={estilos.filaLabel}>{fila.label}</Text>
              <Text style={[estilos.filaValor, fila.destacado && estilos.filaDestacada]}>{fila.valor}</Text>
            </View>
          ))}
        </Animated.View>

        {children ? (
          <Animated.View entering={FadeInDown.delay(800).duration(400)} style={estilos.extra}>
            {children}
          </Animated.View>
        ) : null}

        <Button title={textoCerrar} variant="outline" onPress={onCerrar} style={estilos.cerrar} />
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  check: {
    width: TAM + 24,
    height: TAM + 24,
    borderRadius: (TAM + 24) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    fondo: { flex: 1, backgroundColor: colors.background },
    contenido: { paddingHorizontal: spacing.xxl, flexGrow: 1 },
    titulo: { ...typography.display, color: colors.text, textAlign: 'center', marginTop: spacing.xxl },
    subtitulo: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
    resumen: {
      marginTop: spacing.xxl,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.lg,
    },
    fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
    filaBorde: { borderTopWidth: 1, borderTopColor: colors.border },
    filaLabel: { ...typography.small, color: colors.textMuted },
    filaValor: { ...typography.bodyStrong, ...tabular, color: colors.text, flexShrink: 1, textAlign: 'right' },
    filaDestacada: { ...typography.heading, ...tabular, color: colors.primary },
    extra: {
      marginTop: spacing.xl,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xl,
    },
    cerrar: { marginTop: spacing.xl },
  });
