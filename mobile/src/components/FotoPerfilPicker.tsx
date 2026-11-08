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

// Ancho maximo con el que se sube la foto: alcanza para reconocer la cara y pesa ~50 KB.
const ANCHO_MAXIMO = 600;

/** Foto de la cara del gomero, para que el cliente sepa a quién esperar. */
export function FotoPerfilPicker({ uri, onChange, error, cargando }: Props) {
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
      aspect: [1, 1],
      quality: 1,
      cameraType: ImagePicker.CameraType.front,
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
      <Text style={styles.label}>Tu foto</Text>
      <View style={styles.fila}>
        <View style={[styles.preview, error && !uri ? styles.previewError : null]}>
          {procesando || cargando ? (
            <ActivityIndicator color={colors.primary} />
          ) : uri ? (
            <Image source={{ uri }} style={styles.imagen} resizeMode="cover" accessibilityLabel="Tu foto" />
          ) : (
            <Ionicons name="person-outline" size={36} color={colors.textMuted} />
          )}
        </View>
        <Text style={styles.ayuda}>
          Una foto de tu cara, de frente y con buena luz. El cliente la ve para reconocerte cuando llegás.
        </Text>
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

const TAMANO_PREVIEW = 96;

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: { marginBottom: spacing.lg },
    label: { ...typography.smallStrong, color: colors.secondary, marginBottom: spacing.sm },
    fila: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    preview: {
      width: TAMANO_PREVIEW,
      height: TAMANO_PREVIEW,
      borderRadius: TAMANO_PREVIEW / 2,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    previewError: { borderColor: colors.danger },
    imagen: StyleSheet.absoluteFill,
    ayuda: { ...typography.small, color: colors.textMuted, flex: 1 },
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
