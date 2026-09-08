import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { Chat } from '../../components/Chat';
import * as SolicitudesApi from '../../api/solicitudes';
import * as TrackingApi from '../../api/tracking';
import { getErrorMessage } from '../../api/client';
import { usePolling } from '../../hooks/usePolling';
import { useAuth } from '../../context/AuthContext';
import { colors, estadoColor, estadoLabel } from '../../theme';
import { Solicitud, UbicacionTracking } from '../../types';
import { ClienteStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ClienteStackParamList, 'SolicitudDetalle'>;

const CANCELABLES: Solicitud['estado'][] = ['pendiente', 'asignada', 'en_camino'];

export default function SolicitudDetalleScreen({ route, navigation }: Props) {
  const { solicitudId } = route.params;
  const { usuario } = useAuth();
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [posicionGomero, setPosicionGomero] = useState<UbicacionTracking | null>(null);
  const [puntuacion, setPuntuacion] = useState(0);
  const [enviandoCalificacion, setEnviandoCalificacion] = useState(false);
  const [yaCalifico, setYaCalifico] = useState(false);
  const mapRef = useRef<MapView | null>(null);

  const cargar = useCallback(async () => {
    try {
      const data = await SolicitudesApi.verSolicitud(solicitudId);
      setSolicitud(data);
    } catch {
      // reintenta en el proximo ciclo de polling
    }
  }, [solicitudId]);

  usePolling(cargar, 4000);

  const cargarPosicion = useCallback(async () => {
    if (!solicitud || !['asignada', 'en_camino', 'en_proceso'].includes(solicitud.estado)) return;
    try {
      const pos = await TrackingApi.ultimaPosicion(solicitudId);
      setPosicionGomero(pos);
    } catch {
      // todavia no hay tracking
    }
  }, [solicitud, solicitudId]);

  usePolling(cargarPosicion, 3000, !!solicitud);

  // Reencuadra el mapa para que cliente y gomero queden siempre visibles a medida que se mueve.
  useEffect(() => {
    if (!solicitud || !posicionGomero) return;
    mapRef.current?.fitToCoordinates(
      [
        { latitude: parseFloat(solicitud.latitud), longitude: parseFloat(solicitud.longitud) },
        { latitude: parseFloat(posicionGomero.latitud), longitude: parseFloat(posicionGomero.longitud) },
      ],
      { edgePadding: { top: 40, right: 40, bottom: 40, left: 40 }, animated: true }
    );
  }, [solicitud?.latitud, solicitud?.longitud, posicionGomero]);

  const cancelar = () => {
    Alert.alert('Cancelar solicitud', '¿Estas seguro que queres cancelar?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Si, cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            const actualizada = await SolicitudesApi.cambiarEstadoSolicitud(solicitudId, 'cancelada', {
              motivo_cancelacion: 'Cancelado por el cliente',
            });
            setSolicitud(actualizada);
          } catch (err) {
            Alert.alert('No se pudo cancelar', getErrorMessage(err));
          }
        },
      },
    ]);
  };

  const enviarCalificacion = async () => {
    if (!puntuacion) {
      Alert.alert('Elegi una puntuacion', 'Toca las estrellas para calificar');
      return;
    }
    setEnviandoCalificacion(true);
    try {
      await SolicitudesApi.calificarSolicitud(solicitudId, puntuacion);
      setYaCalifico(true);
    } catch (err) {
      Alert.alert('No se pudo calificar', getErrorMessage(err));
    } finally {
      setEnviandoCalificacion(false);
    }
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

  const mostrarChat = !!solicitud.gomero_id && solicitud.estado !== 'cancelada';

  return (
    <View style={styles.container}>
    <ScrollView style={styles.header} contentContainerStyle={styles.content}>
      <View style={[styles.badge, { backgroundColor: estadoColor[solicitud.estado] }]}>
        <Text style={styles.badgeText}>{estadoLabel[solicitud.estado]}</Text>
      </View>

      <Text style={styles.servicio}>{solicitud.servicio_nombre}</Text>
      {solicitud.direccion && <Text style={styles.linea}>📍 {solicitud.direccion}</Text>}
      {solicitud.descripcion && <Text style={styles.linea}>{solicitud.descripcion}</Text>}

      {solicitud.gomero_nombre && (
        <View style={styles.gomeroBox}>
          <Text style={styles.gomeroNombre}>Tu gomero: {solicitud.gomero_nombre} {solicitud.gomero_apellido}</Text>
          {solicitud.gomero_telefono && <Text style={styles.linea}>Tel: {solicitud.gomero_telefono}</Text>}
        </View>
      )}

      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
        >
          <Marker coordinate={{ latitude: lat, longitude: lng }} title="Tu ubicacion" pinColor={colors.primary} />
          {posicionGomero && (
            <Marker
              coordinate={{ latitude: parseFloat(posicionGomero.latitud), longitude: parseFloat(posicionGomero.longitud) }}
              title="Gomero"
              pinColor="blue"
            />
          )}
        </MapView>
      </View>

      {CANCELABLES.includes(solicitud.estado) && (
        <Button title="Cancelar solicitud" variant="danger" onPress={cancelar} style={styles.cancelBtn} />
      )}

      {solicitud.estado === 'completada' && !yaCalifico && (
        <View style={styles.calificarBox}>
          <Text style={styles.calificarTitulo}>¿Como fue el servicio?</Text>
          <View style={styles.estrellas}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Text
                key={n}
                onPress={() => setPuntuacion(n)}
                style={[styles.estrella, n <= puntuacion && styles.estrellaActiva]}
              >
                ★
              </Text>
            ))}
          </View>
          <Button title="Enviar calificacion" onPress={enviarCalificacion} loading={enviandoCalificacion} />
        </View>
      )}
      {yaCalifico && <Text style={styles.gracias}>¡Gracias por tu calificacion!</Text>}
    </ScrollView>

      {mostrarChat && (
        <View style={styles.chatBox}>
          <Text style={styles.seccion}>Chat</Text>
          <Chat
            solicitudId={solicitudId}
            usuarioId={usuario!.id}
            activo={!['completada', 'cancelada'].includes(solicitud.estado)}
          />
        </View>
      )}
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
  gomeroBox: { marginTop: 16, padding: 14, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  gomeroNombre: { fontWeight: '700', color: colors.text },
  mapWrapper: { height: 220, borderRadius: 12, overflow: 'hidden', marginTop: 16 },
  map: { flex: 1 },
  cancelBtn: { marginTop: 16 },
  calificarBox: { marginTop: 20, padding: 16, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  calificarTitulo: { fontWeight: '700', fontSize: 15, marginBottom: 10, color: colors.text },
  estrellas: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  estrella: { fontSize: 32, color: colors.border },
  estrellaActiva: { color: colors.warning },
  gracias: { marginTop: 20, textAlign: 'center', color: colors.success, fontWeight: '600' },
  chatBox: { flex: 1, margin: 20, marginTop: 12, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  seccion: { fontSize: 15, fontWeight: '700', color: colors.secondary, padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
});
