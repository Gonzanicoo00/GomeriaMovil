import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useTheme } from '../../context/ThemeContext';
import { pedirDesbloqueo } from '../../security/biometria';
import { ThemeColors, radius, spacing, typography } from '../../theme';
import { haptics } from '../../utils/haptics';

/**
 * Se muestra cuando hay una sesion guardada: en lugar de pedir email y contraseña,
 * pide la huella o el bloqueo de pantalla del telefono.
 */
export default function BloqueoScreen() {
  const { usuario, desbloquear, logout } = useAuth();
  const { toast, confirmar } = useFeedback();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const [verificando, setVerificando] = useState(false);

  const intentar = useCallback(async () => {
    setVerificando(true);
    const resultado = await pedirDesbloqueo();
    setVerificando(false);

    if (resultado === 'ok' || resultado === 'sin_seguridad') {
      haptics.exito();
      desbloquear();
    } else if (resultado === 'bloqueado') {
      toast({
        tipo: 'error',
        titulo: 'Demasiados intentos',
        mensaje: 'Esperá unos segundos y volvé a probar.',
      });
    } else if (resultado === 'error') {
      toast({ tipo: 'error', titulo: 'No se pudo verificar', mensaje: 'Probá de nuevo.' });
    }
  }, [desbloquear, toast]);

  // Apenas se abre la pantalla se muestra el pedido de huella.
  useEffect(() => {
    const timer = setTimeout(intentar, 350);
    return () => clearTimeout(timer);
  }, [intentar]);

  const otraCuenta = async () => {
    const ok = await confirmar({
      titulo: '¿Ingresar con otra cuenta?',
      mensaje: 'Se va a cerrar la sesión guardada en este teléfono.',
      confirmar: 'Cerrar sesión',
      destructivo: true,
      icono: 'log-out-outline',
    });
    if (ok) await logout();
  };

  const inicial = (usuario?.nombre ?? '?').charAt(0).toUpperCase();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xxl }]}>
      <StatusBar style="light" />
      <View style={[styles.circulo, styles.circuloGrande]} />
      <View style={[styles.circulo, styles.circuloChico]} />

      <View style={styles.centro}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{inicial}</Text>
        </View>
        <Text style={styles.hola}>Hola, {usuario?.nombre}</Text>
        <Text style={styles.subtitulo}>Tu sesión está guardada. Desbloqueá para continuar.</Text>

        <Pressable onPress={intentar} disabled={verificando} style={styles.huella} hitSlop={12}>
          <Ionicons name="finger-print" size={56} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.pie}>
        <Button
          title="Desbloquear"
          icon="lock-open-outline"
          onPress={intentar}
          loading={verificando}
          variant="outline"
          style={styles.boton}
        />
        <Pressable onPress={otraCuenta} hitSlop={10} style={styles.otraCuenta}>
          <Text style={styles.otraCuentaTexto}>Ingresar con otra cuenta</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xxl,
      overflow: 'hidden',
    },
    circulo: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
    circuloGrande: { width: 340, height: 340, top: -120, right: -140 },
    circuloChico: { width: 220, height: 220, bottom: -60, left: -90 },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xl,
    },
    avatarTexto: { ...typography.display, color: colors.primary },
    hola: { ...typography.title, color: '#fff', textAlign: 'center' },
    subtitulo: {
      ...typography.body,
      color: 'rgba(255,255,255,0.85)',
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    huella: {
      marginTop: spacing.huge,
      width: 104,
      height: 104,
      borderRadius: radius.pill,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.5)',
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pie: { alignItems: 'center' },
    boton: { alignSelf: 'stretch', backgroundColor: '#fff', borderColor: '#fff' },
    otraCuenta: { paddingVertical: spacing.lg, marginTop: spacing.xs },
    otraCuentaTexto: { ...typography.bodyStrong, color: '#fff' },
  });
