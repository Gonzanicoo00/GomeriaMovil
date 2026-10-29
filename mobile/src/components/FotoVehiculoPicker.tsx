import React, { useState } from 'react';
import { ActivityIndicator, Image, Linking, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { PressableScale } from './Animated';
import { useTheme } from '../context/ThemeContext';
import { useFeedback } from '../context/FeedbackContext';
import { ThemeColors, radius, spacing, typography } from '../theme';
import { haptics } from '../utils/haptics';

export interface FotoElegida {
  uri: string;
  base64: string;
}

interface Props {
  /** Foto que se está mostrando (la nueva o la que ya estaba guardada). */
  uri: string | null;
  onChange: (foto: FotoElegida) => void;
  error?: string;
  cargando?: boolean;
}

// Ancho maximo con el que se sube la foto: alcanza para verla bien y pesa ~100 KB.
const ANCHO_MAXIMO = 1024;

export function FotoVehiculoPicker({ uri, onChange, error, cargando }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { toast } = useFeedback();
  const [procesando, setProcesando] = useState(false);

  const elegir = async (origen: 'camara' | 'galeria') => {
    haptics.tap();
    const permiso =
      origen === 'camara'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permiso.granted) {
      toast({
        tipo: 'error',
        titulo: origen === 'camara' ? 'Sin acceso a la cámara' : 'Sin acceso a tus fotos',
        mensaje: 'Habilitá el permiso en los ajustes del teléfono para cargar la foto.',
      });
      // Si ya no se puede volver a preguntar, el único camino es desde los ajustes.
      if (!permiso.canAskAgain) Linking.openSettings();
      return;
    }

    const opciones: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    };
    const resultado =
      origen === 'camara'
        ? await ImagePicker.launchCameraAsync(opciones)
        : await ImagePicker.launchImageLibraryAsync(opciones);

    if (resultado.canceled) return;

    setProcesando(true);
    try {
      const imagen = await ImageManipulator.manipulate(resultado.assets[0].uri, { maxWidth: ANCHO_MAXIMO * 2 })
        .resize({ width: Math.min(ANCHO_MAXIMO, resultado.assets[0].width) })
        .renderAsync();
      const guardada = await imagen.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
      if (!guardada.base64) throw new Error('sin base64');
      onChange({ uri: guardada.uri, base64: guardada.base64 });
    } catch {
      toast({ tipo: 'error', titulo: 'No se pudo cargar la foto', mensaje: 'Probá con otra imagen.' });
    } finally {
      setProcesando(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Foto del vehículo</Text>
      <View style={[styles.preview, error && !uri ? styles.previewError : null]}>
        {procesando || cargando ? (
          <ActivityIndicator color={colors.primary} />
        ) : uri ? (
          <Image source={{ uri }} style={styles.imagen} resizeMode="cover" />
        ) : (
          <>
            <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
            <Text style={styles.ayuda}>Que se vea el vehículo completo y la patente.</Text>
          </>
        )}
      </View>
      <View style={styles.acciones}>
        <Accion icon="camera" label={uri ? 'Sacar otra' : 'Sacar foto'} onPress={() => elegir('camara')} disabled={procesando} />
        <Accion icon="images" label="Elegir de la galería" onPress={() => elegir('galeria')} disabled={procesando} />
      </View>
      {error && !uri ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function Accion({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <PressableScale onPress={onPress} disabled={disabled} style={styles.accion} accessibilityRole="button">
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={styles.accionTexto}>{label}</Text>
    </PressableScale>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: { marginBottom: spacing.lg },
    label: { ...typography.smallStrong, color: colors.secondary, marginBottom: spacing.sm },
    preview: {
      aspectRatio: 4 / 3,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      overflow: 'hidden',
      paddingHorizontal: spacing.xxl,
    },
    previewError: { borderColor: colors.danger },
    imagen: StyleSheet.absoluteFill,
    ayuda: { ...typography.small, color: colors.textMuted, textAlign: 'center' },
    acciones: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    accion: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm + spacing.xxs,
      borderRadius: radius.md,
      backgroundColor: colors.primaryLight,
    },
    accionTexto: { ...typography.smallStrong, color: colors.primary },
    error: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },
  });
