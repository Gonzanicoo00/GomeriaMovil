import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { LoadingView } from '../../components/LoadingView';
import * as SolicitudesApi from '../../api/solicitudes';
import { getErrorMessage } from '../../api/client';
import { useFeedback } from '../../context/FeedbackContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, radius, spacing, typography } from '../../theme';
import { ClienteStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ClienteStackParamList, 'NuevaSolicitud'>;

export default function NuevaSolicitudScreen({ route, navigation }: Props) {
  const { servicioId } = route.params;
  const { toast } = useFeedback();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);
  const [direccion, setDireccion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorUbicacion('Necesitamos permiso de ubicación para pedir el servicio');
        return;
      }
      try {
        const pos = await Location.getCurrentPositionAsync({});
        setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        setErrorUbicacion('No se pudo obtener tu ubicación. Revisá el GPS.');
      }
    })();
  }, []);

  const confirmar = async () => {
    if (!ubicacion) return;
    setEnviando(true);
    try {
      const solicitud = await SolicitudesApi.crearSolicitud({
        servicio_id: servicioId,
        latitud: ubicacion.lat,
        longitud: ubicacion.lng,
        direccion: direccion.trim() || undefined,
        descripcion: descripcion.trim() || undefined,
      });
      toast({ tipo: 'exito', titulo: '¡Pedido enviado!', mensaje: 'Estamos buscando un gomero cerca tuyo.' });
      navigation.replace('SolicitudDetalle', { solicitudId: solicitud.id });
    } catch (err) {
      toast({ tipo: 'error', titulo: 'No se pudo crear la solicitud', mensaje: getErrorMessage(err) });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.xl, paddingTop: insets.top + spacing.xxl, paddingBottom: spacing.huge }}
    >
      <Text style={styles.titulo}>Confirmar solicitud</Text>

      {!ubicacion && !errorUbicacion && <LoadingView texto="Obteniendo tu ubicación..." fullscreen={false} />}

      {errorUbicacion && (
        <View style={styles.avisoError}>
          <Ionicons name="warning-outline" size={18} color={colors.danger} />
          <Text style={styles.avisoErrorTexto}>{errorUbicacion}</Text>
        </View>
      )}

      {ubicacion && (
        <View style={styles.avisoOk}>
          <Ionicons name="location" size={18} color={colors.success} />
          <Text style={styles.avisoOkTexto}>
            Ubicación detectada ({ubicacion.lat.toFixed(4)}, {ubicacion.lng.toFixed(4)})
          </Text>
        </View>
      )}

      <Input
        label="Dirección / referencia (opcional)"
        icon="location-outline"
        value={direccion}
        onChangeText={setDireccion}
        placeholder="Ej: Av. Colón 500, frente a la plaza"
      />

      <Input
        label="Descripción del problema (opcional)"
        icon="chatbox-ellipses-outline"
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Ej: rueda delantera derecha pinchada"
        multiline
        style={styles.textarea}
      />

      <Button
        title="Pedir gomero"
        icon="send-outline"
        onPress={confirmar}
        loading={enviando}
        disabled={!ubicacion}
        style={styles.button}
      />
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  titulo: { ...typography.title, color: colors.secondary, marginBottom: spacing.lg },
  avisoError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  avisoErrorTexto: { ...typography.smallStrong, color: colors.danger, flexShrink: 1 },
  avisoOk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  avisoOkTexto: { ...typography.smallStrong, color: colors.success, flexShrink: 1 },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  button: { marginTop: spacing.sm },
});
