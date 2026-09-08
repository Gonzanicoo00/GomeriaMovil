import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import * as SolicitudesApi from '../../api/solicitudes';
import { getErrorMessage } from '../../api/client';
import { colors } from '../../theme';
import { ClienteStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ClienteStackParamList, 'NuevaSolicitud'>;

export default function NuevaSolicitudScreen({ route, navigation }: Props) {
  const { servicioId } = route.params;
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);
  const [direccion, setDireccion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorUbicacion('Necesitamos permiso de ubicacion para pedir el servicio');
        return;
      }
      try {
        const pos = await Location.getCurrentPositionAsync({});
        setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        setErrorUbicacion('No se pudo obtener tu ubicacion. Revisa el GPS.');
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
      navigation.replace('SolicitudDetalle', { solicitudId: solicitud.id });
    } catch (err) {
      Alert.alert('No se pudo crear la solicitud', getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Confirmar solicitud</Text>

      {!ubicacion && !errorUbicacion && (
        <View style={styles.estadoUbicacion}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.estadoTexto}>Obteniendo tu ubicacion...</Text>
        </View>
      )}

      {errorUbicacion && <Text style={styles.error}>{errorUbicacion}</Text>}

      {ubicacion && (
        <Text style={styles.ubicacionOk}>
          📍 Ubicacion detectada ({ubicacion.lat.toFixed(4)}, {ubicacion.lng.toFixed(4)})
        </Text>
      )}

      <Text style={styles.label}>Direccion / referencia (opcional)</Text>
      <TextInput
        style={styles.input}
        value={direccion}
        onChangeText={setDireccion}
        placeholder="Ej: Av. Colon 500, frente a la plaza"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={styles.label}>Descripcion del problema (opcional)</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Ej: rueda delantera derecha pinchada"
        placeholderTextColor={colors.textMuted}
        multiline
      />

      <Button
        title="Pedir gomero"
        onPress={confirmar}
        loading={enviando}
        disabled={!ubicacion}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20, paddingTop: 60 },
  titulo: { fontSize: 22, fontWeight: '800', color: colors.secondary, marginBottom: 16 },
  estadoUbicacion: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  estadoTexto: { color: colors.textMuted },
  error: { color: colors.danger, marginBottom: 16 },
  ubicacionOk: { color: colors.success, marginBottom: 16, fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600', color: colors.secondary, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: 16,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  button: { marginTop: 8 },
});
