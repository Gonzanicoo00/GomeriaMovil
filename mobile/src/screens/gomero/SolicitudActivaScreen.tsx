import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Chat } from '../../components/Chat';
import { Avatar } from '../../components/Avatar';
import { DetalleSkeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/ErrorState';
import { ClientePin, GomeroPin, mapStyleClaro, mapStyleOscuro } from '../../components/MapPins';
import * as SolicitudesApi from '../../api/solicitudes';
import * as TrackingApi from '../../api/tracking';
import { getErrorMessage } from '../../api/client';
import { usePolling } from '../../hooks/usePolling';
import { useLocationWatcher, Coords } from '../../hooks/useLocationWatcher';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, estadoColorFor, estadoFondoFor, estadoIcon, estadoLabel, radius, shadow, spacing, typography } from '../../theme';
import { EstadoSolicitud, Solicitud } from '../../types';
import { distanciaKm, estimarEtaMinutos } from '../../utils/format';
import { GomeroStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<GomeroStackParamList, 'SolicitudActiva'>;

const SIGUIENTE_ESTADO: Partial<Record<EstadoSolicitud, { estado: EstadoSolicitud; label: string; icon: keyof typeof Ionicons.glyphMap }>> = {
  asignada: { estado: 'en_camino', label: 'Marcar que estoy en camino', icon: 'navigate-outline' },
  en_camino: { estado: 'en_proceso', label: 'Marcar que empecé el trabajo', icon: 'construct-outline' },
  en_proceso: { estado: 'completada', label: 'Marcar como completado', icon: 'checkmark-done-outline' },
};

export default function SolicitudActivaScreen({ route, navigation }: Props) {
  const { solicitudId } = route.params;
  const { usuario } = useAuth();
  const { toast, confirmar } = useFeedback();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [precioFinal, setPrecioFinal] = useState('');
  const [precioError, setPrecioError] = useState<string | null>(null);
  const [actualizando, setActualizando] = useState(false);
  const [miPosicion, setMiPosicion] = useState<Coords | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const mapRef = useRef<MapView | null>(null);

  const cargar = useCallback(async () => {
    try {
      setSolicitud(await SolicitudesApi.verSolicitud(solicitudId));
      setErrorCarga(null);
    } catch (err) {
      // si ya tenemos datos, la mantenemos y confiamos en el próximo ciclo de polling
      if (!solicitud) setErrorCarga(getErrorMessage(err));
    }
  }, [solicitudId, solicitud]);

  usePolling(cargar, 4000);

  const enviandoTracking = !!solicitud && ['asignada', 'en_camino'].includes(solicitud.estado);

  // GPS continuo: cada actualización de posición se manda al backend y se muestra en el mapa propio.
  useLocationWatcher(enviandoTracking, useCallback((coords) => {
    setMiPosicion(coords);
    TrackingApi.enviarTracking(solicitudId, coords.latitude, coords.longitude).catch(() => {});
  }, [solicitudId]));

  // Reencuadra el mapa para que ambos puntos (cliente y gomero) queden siempre visibles.
  useEffect(() => {
    if (!solicitud || !miPosicion) return;
    mapRef.current?.fitToCoordinates(
      [{ latitude: parseFloat(solicitud.latitud), longitude: parseFloat(solicitud.longitud) }, miPosicion],
      { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true }
    );
  }, [solicitud?.latitud, solicitud?.longitud, miPosicion]);

  const avanzarEstado = async () => {
    if (!solicitud) return;
    const siguiente = SIGUIENTE_ESTADO[solicitud.estado];
    if (!siguiente) return;

    if (siguiente.estado === 'completada' && (!precioFinal || Number(precioFinal) <= 0)) {
      setPrecioError('Ingresá el precio final del servicio');
      return;
    }

    setActualizando(true);
    try {
      const actualizada = await SolicitudesApi.cambiarEstadoSolicitud(solicitudId, siguiente.estado, {
        precio_final: siguiente.estado === 'completada' ? parseFloat(precioFinal) : undefined,
      });
      setSolicitud(actualizada);
      toast(
        siguiente.estado === 'completada'
          ? { tipo: 'exito', titulo: '¡Servicio completado!', mensaje: 'Buen trabajo. El cliente ya puede calificarte.' }
          : { tipo: 'exito', titulo: estadoLabel[siguiente.estado], mensaje: 'Le avisamos al cliente.' }
      );
    } catch (err) {
      toast({ tipo: 'error', titulo: 'No se pudo actualizar', mensaje: getErrorMessage(err) });
    } finally {
      setActualizando(false);
    }
  };

  const cancelar = async () => {
    const ok = await confirmar({
      titulo: '¿Cancelar el servicio?',
      mensaje: 'El cliente va a ser avisado y va a tener que pedir otro gomero.',
      confirmar: 'Sí, cancelar',
      cancelar: 'No, seguir',
      destructivo: true,
    });
    if (!ok) return;
    try {
      const actualizada = await SolicitudesApi.cambiarEstadoSolicitud(solicitudId, 'cancelada', {
        motivo_cancelacion: 'Cancelado por el gomero',
      });
      setSolicitud(actualizada);
      toast({ tipo: 'info', titulo: 'Servicio cancelado' });
    } catch (err) {
      toast({ tipo: 'error', titulo: 'No se pudo cancelar', mensaje: getErrorMessage(err) });
    }
  };

  if (!solicitud && errorCarga) {
    return <ErrorState fullscreen title="No se pudo cargar la solicitud" subtitle={errorCarga} onRetry={cargar} />;
  }

  if (!solicitud) {
    return <DetalleSkeleton />;
  }

  const lat = parseFloat(solicitud.latitud);
  const lng = parseFloat(solicitud.longitud);
  const siguiente = SIGUIENTE_ESTADO[solicitud.estado];
  const activa = !['completada', 'cancelada'].includes(solicitud.estado);

  let distancia: number | null = null;
  let etaMin: number | null = null;
  if (miPosicion) {
    distancia = distanciaKm(lat, lng, miPosicion.latitude, miPosicion.longitude);
    etaMin = estimarEtaMinutos(distancia);
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.header} contentContainerStyle={styles.content}>
        <View style={[styles.badge, { backgroundColor: estadoFondoFor(colors, solicitud.estado) }]}>
          <Ionicons name={estadoIcon[solicitud.estado] as any} size={14} color={estadoColorFor(colors, solicitud.estado)} />
          <Text style={[styles.badgeText, { color: estadoColorFor(colors, solicitud.estado) }]}>
            {estadoLabel[solicitud.estado]}
          </Text>
        </View>

        <Text style={styles.servicio}>{solicitud.servicio_nombre}</Text>
        {solicitud.direccion && (
          <View style={styles.lineaConIcono}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={styles.linea}>{solicitud.direccion}</Text>
          </View>
        )}
        {solicitud.descripcion && <Text style={styles.linea}>{solicitud.descripcion}</Text>}

        {(distancia !== null || etaMin !== null) && (
          <View style={styles.etaBox}>
            <View style={styles.etaItem}>
              <Ionicons name="navigate-outline" size={18} color={colors.primary} />
              <Text style={styles.etaValor}>{distancia?.toFixed(1)} km</Text>
              <Text style={styles.etaLabel}>de distancia</Text>
            </View>
            <View style={styles.etaDivider} />
            <View style={styles.etaItem}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={styles.etaValor}>~{etaMin} min</Text>
              <Text style={styles.etaLabel}>tiempo estimado</Text>
            </View>
          </View>
        )}

        <View style={styles.clienteBox}>
          <Avatar nombre={solicitud.cliente_nombre} apellido={solicitud.cliente_apellido} />
          <View style={styles.clienteInfo}>
            <Text style={styles.clienteNombre}>{solicitud.cliente_nombre} {solicitud.cliente_apellido}</Text>
            <Text style={styles.linea}>Cliente</Text>
          </View>
          {solicitud.cliente_telefono && (
            <Pressable
              style={styles.telBtn}
              onPress={() => Linking.openURL(`tel:${solicitud.cliente_telefono}`)}
              android_ripple={{ color: colors.primary, borderless: true, radius: 19 }}
            >
              <Ionicons name="call-outline" size={18} color={colors.primary} />
            </Pressable>
          )}
        </View>

        <View style={styles.mapWrapper}>
          <MapView
            ref={mapRef}
            style={styles.map}
            customMapStyle={isDark ? mapStyleOscuro : mapStyleClaro}
            showsPointsOfInterests={false}
            toolbarEnabled={false}
            initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
          >
            <ClientePin coordinate={{ latitude: lat, longitude: lng }} title={solicitud.cliente_nombre ?? 'Cliente'} />
            {miPosicion && <GomeroPin coordinate={miPosicion} title="Vos" />}
          </MapView>
        </View>

        {solicitud.estado === 'en_proceso' && (
          <View style={styles.precioBox}>
            <Input
              label="Precio final ($)"
              icon="cash-outline"
              value={precioFinal}
              onChangeText={(v) => { setPrecioFinal(v); setPrecioError(null); }}
              keyboardType="numeric"
              placeholder="Ej: 3200"
              error={precioError ?? undefined}
            />
          </View>
        )}

        {siguiente && (
          <Button title={siguiente.label} icon={siguiente.icon} onPress={avanzarEstado} loading={actualizando} style={styles.button} />
        )}

        {activa && (
          <Button title="Cancelar solicitud" variant="danger" icon="close-circle-outline" onPress={cancelar} style={styles.button} />
        )}
      </ScrollView>

      <View style={[styles.chatBox, { marginBottom: insets.bottom + spacing.md }]}>
        <View style={styles.chatHeader}>
          <Ionicons name="chatbubbles-outline" size={16} color={colors.primary} />
          <Text style={styles.seccion}>Chat con el cliente</Text>
        </View>
        <Chat solicitudId={solicitudId} usuarioId={usuario!.id} activo={activa} />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexShrink: 1 },
  content: { padding: spacing.xl, paddingTop: spacing.lg },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm - spacing.xxs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - spacing.xxs,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  badgeText: { ...typography.captionStrong, fontSize: 12 },
  servicio: { ...typography.title, color: colors.secondary },
  lineaConIcono: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  linea: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs, flexShrink: 1 },
  etaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  etaItem: { flex: 1, alignItems: 'center' },
  etaDivider: { width: 1, height: 40, backgroundColor: colors.border },
  etaValor: { ...typography.heading, color: colors.text, marginTop: spacing.xs },
  etaLabel: { ...typography.caption, color: colors.textMuted },
  clienteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  clienteInfo: { flex: 1 },
  clienteNombre: { ...typography.subheading, color: colors.text },
  telBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapWrapper: { height: 280, borderRadius: radius.lg, overflow: 'hidden', marginTop: spacing.lg, borderWidth: 1, borderColor: colors.border },
  map: { flex: 1 },
  precioBox: { marginTop: spacing.lg },
  button: { marginTop: spacing.md },
  chatBox: {
    flex: 1,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  seccion: { ...typography.subheading, color: colors.secondary },
});
