import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';
import { Button } from '../components/Button';
import { ThemeColors, radius, shadow, spacing, typography } from '../theme';
import { haptics } from '../utils/haptics';

type ToastTipo = 'exito' | 'error' | 'info';

interface ToastOpciones {
  tipo?: ToastTipo;
  titulo: string;
  mensaje?: string;
}

interface ConfirmOpciones {
  titulo: string;
  mensaje?: string;
  confirmar?: string;
  cancelar?: string;
  destructivo?: boolean;
  icono?: keyof typeof Ionicons.glyphMap;
}

interface FeedbackContextValue {
  /** Muestra un aviso arriba de la pantalla que se oculta solo. */
  toast: (opciones: ToastOpciones) => void;
  /** Abre una hoja de confirmacion desde abajo. Resuelve true si el usuario confirma. */
  confirmar: (opciones: ConfirmOpciones) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const DURACION_TOAST = 3500;

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toastActual, setToastActual] = useState<(ToastOpciones & { id: number }) | null>(null);
  const [confirmActual, setConfirmActual] = useState<ConfirmOpciones | null>(null);
  const resolverRef = useRef<((valor: boolean) => void) | null>(null);

  const toast = useCallback((opciones: ToastOpciones) => {
    const tipo = opciones.tipo ?? 'info';
    if (tipo === 'exito') haptics.exito();
    if (tipo === 'error') haptics.error();
    setToastActual({ ...opciones, tipo, id: Date.now() });
  }, []);

  const confirmar = useCallback((opciones: ConfirmOpciones) => {
    haptics.tap();
    setConfirmActual(opciones);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const responder = (valor: boolean) => {
    resolverRef.current?.(valor);
    resolverRef.current = null;
    setConfirmActual(null);
  };

  const value = useMemo(() => ({ toast, confirmar }), [toast, confirmar]);

  return (
    <FeedbackContext.Provider value={value}>
      <View style={styles.flex}>
        {children}
        {toastActual && <Toast key={toastActual.id} {...toastActual} onHide={() => setToastActual(null)} />}
      </View>
      <ConfirmSheet opciones={confirmActual} onResponder={responder} />
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback debe usarse dentro de FeedbackProvider');
  return ctx;
}

function Toast({ tipo = 'info', titulo, mensaje, onHide }: ToastOpciones & { onHide: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const progreso = useRef(new Animated.Value(0)).current;

  const ocultar = useCallback(() => {
    Animated.timing(progreso, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => onHide());
  }, [progreso, onHide]);

  useEffect(() => {
    Animated.spring(progreso, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 6 }).start();
    const timer = setTimeout(ocultar, DURACION_TOAST);
    return () => clearTimeout(timer);
  }, [progreso, ocultar]);

  const estilo = {
    exito: { icono: 'checkmark-circle' as const, color: colors.success, fondo: colors.successLight },
    error: { icono: 'alert-circle' as const, color: colors.danger, fondo: colors.dangerLight },
    info: { icono: 'information-circle' as const, color: colors.info, fondo: colors.infoLight },
  }[tipo];

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.toastWrap,
        {
          top: insets.top + spacing.sm,
          opacity: progreso,
          transform: [{ translateY: progreso.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
        },
      ]}
    >
      <Pressable
        onPress={ocultar}
        style={[styles.toast, { backgroundColor: colors.surface, borderColor: colors.border }]}
        accessibilityRole="alert"
      >
        <View style={[styles.toastIcono, { backgroundColor: estilo.fondo }]}>
          <Ionicons name={estilo.icono} size={22} color={estilo.color} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.toastTitulo, { color: colors.text }]}>{titulo}</Text>
          {mensaje ? <Text style={[styles.toastMensaje, { color: colors.textMuted }]}>{mensaje}</Text> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function ConfirmSheet({
  opciones,
  onResponder,
}: {
  opciones: ConfirmOpciones | null;
  onResponder: (valor: boolean) => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const sheetStyles = createSheetStyles(colors);
  // Se conserva la ultima configuracion para que el contenido no desaparezca durante la animacion de cierre.
  const ultimas = useRef<ConfirmOpciones | null>(null);
  if (opciones) ultimas.current = opciones;
  const o = opciones ?? ultimas.current;

  const destructivo = !!o?.destructivo;
  const icono = o?.icono ?? (destructivo ? 'warning-outline' : 'help-circle-outline');

  return (
    <Modal
      visible={!!opciones}
      transparent
      animationType="slide"
      onRequestClose={() => onResponder(false)}
      statusBarTranslucent
    >
      <Pressable style={sheetStyles.backdrop} onPress={() => onResponder(false)} />
      <View style={[sheetStyles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={sheetStyles.handle} />
        <View style={[sheetStyles.icono, { backgroundColor: destructivo ? colors.dangerLight : colors.primaryLight }]}>
          <Ionicons name={icono} size={28} color={destructivo ? colors.danger : colors.primary} />
        </View>
        <Text style={sheetStyles.titulo}>{o?.titulo}</Text>
        {o?.mensaje ? <Text style={sheetStyles.mensaje}>{o.mensaje}</Text> : null}
        <Button
          title={o?.confirmar ?? 'Confirmar'}
          variant={destructivo ? 'danger' : 'primary'}
          onPress={() => onResponder(true)}
          style={sheetStyles.boton}
        />
        <Pressable style={sheetStyles.cancelar} onPress={() => onResponder(false)} hitSlop={8}>
          <Text style={sheetStyles.cancelarTexto}>{o?.cancelar ?? 'Volver'}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  toastWrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, zIndex: 100, elevation: 100 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadow.raised,
  },
  toastIcono: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastTitulo: { ...typography.subheading },
  toastMensaje: { ...typography.small, marginTop: spacing.xxs },
});

const createSheetStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15,23,42,0.45)' },
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      paddingHorizontal: spacing.xxl,
      paddingTop: spacing.md,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.border,
      marginBottom: spacing.xxl,
    },
    icono: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    titulo: { ...typography.title, color: colors.text, textAlign: 'center' },
    mensaje: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
    boton: { alignSelf: 'stretch', marginTop: spacing.xxl },
    cancelar: { paddingVertical: spacing.lg },
    cancelarTexto: { ...typography.bodyStrong, color: colors.textMuted },
  });
