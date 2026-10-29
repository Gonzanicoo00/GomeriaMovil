import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, radius, spacing, typography } from '../theme';
import { Usuario } from '../types';
import { Avatar } from './Avatar';

interface Props {
  visible: boolean;
  usuario: Usuario | null;
  onClose: () => void;
  onHistorial: () => void;
  onLogout: () => void;
  /** Si viene, se muestra la opción para editar el perfil. */
  onMiPerfil?: () => void;
}

/** Menu de perfil que sube desde abajo al tocar el avatar. */
export function ProfileSheet({ visible, usuario, onClose, onHistorial, onLogout, onMiPerfil }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();

  const elegir = (accion: () => void) => {
    onClose();
    // Se espera a que termine de cerrarse este menu antes de abrir otra pantalla o modal.
    setTimeout(accion, 250);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.handle} />

        <View style={styles.perfil}>
          <Avatar nombre={usuario?.nombre} apellido={usuario?.apellido} size={56} />
          <View style={styles.perfilTexto}>
            <Text style={styles.nombre} numberOfLines={1}>
              {usuario?.nombre} {usuario?.apellido}
            </Text>
            <Text style={styles.email} numberOfLines={1}>{usuario?.email}</Text>
          </View>
        </View>

        {onMiPerfil && (
          <Opcion icon="person-circle-outline" label="Mi perfil y vehículo" onPress={() => elegir(onMiPerfil)} colors={colors} />
        )}
        <Opcion icon="time-outline" label="Historial de servicios" onPress={() => elegir(onHistorial)} colors={colors} />
        <Opcion icon="log-out-outline" label="Cerrar sesión" onPress={() => elegir(onLogout)} colors={colors} danger />
      </View>
    </Modal>
  );
}

function Opcion({
  icon,
  label,
  onPress,
  colors,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  colors: ThemeColors;
  danger?: boolean;
}) {
  const styles = createStyles(colors);
  const color = danger ? colors.danger : colors.text;

  return (
    <Pressable
      style={({ pressed }) => [styles.opcion, pressed && styles.opcionApretada]}
      onPress={onPress}
      android_ripple={{ color: colors.border }}
    >
      <View style={[styles.opcionIcono, { backgroundColor: danger ? colors.dangerLight : colors.primaryLight }]}>
        <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.primary} />
      </View>
      <Text style={[styles.opcionTexto, { color }]}>{label}</Text>
      {!danger && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.surfaceElevated,
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.border,
      marginBottom: spacing.xl,
    },
    perfil: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingBottom: spacing.xl,
      marginBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    perfilTexto: { flex: 1 },
    nombre: { ...typography.heading, color: colors.text },
    email: { ...typography.small, color: colors.textMuted, marginTop: spacing.xxs },
    opcion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
    },
    opcionIcono: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    opcionApretada: { opacity: Platform.OS === 'ios' ? 0.6 : 1 },
    opcionTexto: { ...typography.bodyStrong, flex: 1 },
  });
