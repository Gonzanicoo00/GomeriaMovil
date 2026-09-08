import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { Chat } from '../../components/Chat';
import * as SolicitudesApi from '../../api/solicitudes';
import * as TrackingApi from '../../api/tracking';
import { getErrorMessage } from '../../api/client';
import { usePolling } from '../../hooks/usePolling';
import { useLocationWatcher, Coords } from '../../hooks/useLocationWatcher';
import { useAuth } from '../../context/AuthContext';
import { colors, estadoColor, estadoLabel } from '../../theme';
import { EstadoSolicitud, Solicitud } from '../../types';
import { GomeroStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<GomeroStackParamList, 'SolicitudActiva'>;

const SIGUIENTE_ESTADO: Partial<Record<EstadoSolicitud, { estado: EstadoSolicitud; label: string }>> = {
  asignada: { estado: 'en_camino', label: 'Marcar que estoy en camino' },
  en_camino: { estado: 'en_proceso', label: 'Marcar que empece el trabajo' },
  en_proceso: { estado: 'completada', label: 'Marcar como completado' },
};

export default function SolicitudActivaScreen({ route, navigation }: Props) {
  const { solicitudId } = route.params;
  const { usuario } = useAuth();
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [precioFinal, setPrecioFinal] = useState('');
  const [actualizando, setActualizando] = useState(false);
  const [miPosicion, setMiPosicion] = useState<Coords | null>(null);
  const mapRef = useRef<MapView | null>(null);

  const cargar = useCallback(async () => {
    try {
      setSolicitud(await SolicitudesApi.verSolicitud(solicitudId));
    } catch {
      // reintenta en el proximo ciclo
    }
  }, [solicitudId]);

  usePolling(cargar, 4000);

  const enviandoTracking = !!solicitud && ['asignada', 'en_camino'].includes(solicitud.estado);

  // GPS continuo: cada actualizacion de posicion se manda al backend y se muestra en el mapa propio.
  useLocationWatcher(enviandoTracking, useCallback((coords) => {
    setMiPosicion(coords);
    TrackingApi.enviarTracking(solicitudId, coords.latitude, coords.longitude).catch(() => {});
  }, [solicitudId]));

  // Reencuadra el mapa para que ambos puntos (cliente y gomero) queden siempre visibles.
  useEffect(() => {
    if (!solicitud || !miPosicion) return;
    mapRef.current?.fitToCoordinates(
      [{ latitude: parseFloat(solicitud.latitud), longitude: parseFloat(solicitud.longitud) }, miPosicion],
      { edgePadding: { top: 40, right: 40, bottom: 40, left: 40 }, animated: true }
    );
  }, [solicitud?.latitud, solicitud?.longitud, miPosicion]);

  const avanzarEstado = async () => {
    if (!solicitud) return;
    const siguiente = SIGUIENTE_ESTADO[solicitud.estado];
    if (!siguiente) return;

    if (siguiente.estado === 'completada' && !precioFinal) {
      Alert.alert('Falta el precio', 'Ingresa el precio final del servicio');
      return;
    }

    setActualizando(true);
    try {
      const actualizada = await SolicitudesApi.cambiarEstadoSolicitud(solicitudId, siguiente.estado, {
        precio_final: siguiente.estado === 'completada' ? parseFloat(precioFinal) : undefined,
      });
      setSolicitud(actualizada);
      if (siguiente.estado === 'completada') {
        Alert.alert('¡Listo!', 'Servicio marcado como completado');
      }
    } catch (err) {
      Alert.alert('No se pudo actualizar', getErrorMessage(err));
    } finally {
      setActualizando(false);
    }
  };

  const cancelar = () => {
    Alert.alert('Cancelar solicitud', '¿Estas seguro?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Si, cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            const actualizada = await SolicitudesApi.cambiarEstadoSolicitud(solicitudId, 'cancelada', {
              motivo_cancelacion: 'Cancelado por el gomero',
            });
            setSolicitud(actualizada);
          } catch (err) {
            Alert.alert('No se pudo cancelar', getErrorMessage(err));
          }
        },
      },
    ]);
  };

  if (!solicitud) {
    return (
      <View style={styles.centro}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  const lat = parseFloat(solicitud.latitud);
  const lng = parseFloat(solicitud.longitud);
  const siguiente = SIGUIENTE_ESTADO[solicitud.estado];
  const activa = !['completada', 'cancelada'].includes(solicitud.estado);

  return (
    <View style={styles.container}>
    <ScrollView style={styles.header} contentContainerStyle={styles.content}>
      <View style={[styles.badge, { backgroundColor: estadoColor[solicitud.estado] }]}>
        <Text style={styles.badgeText}>{estadoLabel[solicitud.estado]}</Text>
      </View>

      <Text style={styles.servicio}>{solicitud.servicio_nombre}</Text>
      {solicitud.direccion && <Text style={styles.linea}>📍 {solicitud.direccion}</Text>}
      {solicitud.descripcion && <Text style={styles.linea}>{solicitud.descripcion}</Text>}

      <View style={styles.clienteBox}>
        <Text style={styles.clienteNombre}>Cliente: {solicitud.cliente_nombre} {solicitud.cliente_apellido}</Text>
        {solicitud.cliente_telefono && <Text style={styles.linea}>Tel: {solicitud.cliente_telefono}</Text>}
      </View>

      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
        >
          <Marker coordinate={{ latitude: lat, longitude: lng }} title="Cliente" pinColor={colors.primary} />
          {miPosicion && <Marker coordinate={miPosicion} title="Vos" pinColor="blue" />}
        </MapView>
      </View>

      {solicitud.estado === 'en_proceso' && (
        <View style={styles.precioBox}>
          <Text style={styles.label}>Precio final ($)</Text>
          <TextInput
            style={styles.input}
            value={precioFinal}
            onChangeText={setPrecioFinal}
            keyboardType="numeric"
            placeholder="Ej: 3200"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      )}

      {siguiente && (
        <Button title={siguiente.label} onPress={avanzarEstado} loading={actualizando} style={styles.button} />
      )}

      {activa && (
        <Button title="Cancelar solicitud" variant="danger" onPress={cancelar} style={styles.button} />
      )}

    </ScrollView>

      <View style={styles.chatBox}>
        <Text style={styles.seccion}>Chat</Text>
        <Chat solicitudId={solicitudId} usuarioId={usuario!.id} activo={activa} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexShrink: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 20 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  servicio: { fontSize: 22, fontWeight: '800', color: colors.secondary },
  linea: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  clienteBox: { marginTop: 16, padding: 14, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  clienteNombre: { fontWeight: '700', color: colors.text },
  mapWrapper: { height: 220, borderRadius: 12, overflow: 'hidden', marginTop: 16 },
  map: { flex: 1 },
  precioBox: { marginTop: 16 },
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
  },
  button: { marginTop: 16 },
  chatBox: { flex: 1, margin: 20, marginTop: 12, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  seccion: { fontSize: 15, fontWeight: '700', color: colors.secondary, padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
});
