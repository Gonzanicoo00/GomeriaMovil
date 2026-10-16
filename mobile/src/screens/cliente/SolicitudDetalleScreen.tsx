import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { Chat } from '../../components/Chat';
import { Avatar } from '../../components/Avatar';
import { DetalleSkeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/ErrorState';
import { EstadoTimeline } from '../../components/EstadoTimeline';
import { ClientePin, GomeroPin, mapStyleClaro, mapStyleOscuro } from '../../components/MapPins';
import * as SolicitudesApi from '../../api/solicitudes';
import * as TrackingApi from '../../api/tracking';
import { getErrorMessage } from '../../api/client';
import { usePolling } from '../../hooks/usePolling';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { haptics } from '../../utils/haptics';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, estadoLabel, radius, shadow, spacing, typography } from '../../theme';
import { Solicitud, UbicacionTracking } from '../../types';
import { distanciaKm, estimarEtaMinutos, formatRelativeTime } from '../../utils/format';
import { ClienteStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ClienteStackParamList, 'SolicitudDetalle'>;

const CANCELABLES: Solicitud['estado'][] = ['pendiente', 'asignada', 'en_camino'];

export default function SolicitudDetalleScreen({ route, navigation }: Props) {
  const { solicitudId } = route.params;
  const { usuario } = useAuth();
  const { toast, confirmar } = useFeedback();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [posicionGomero, setPosicionGomero] = useState<UbicacionTracking | null>(null);
  const [puntuacion, setPuntuacion] = useState(0);
  const [enviandoCalificacion, setEnviandoCalificacion] = useState(false);
  const [yaCalifico, setYaCalifico] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const mapRef = useRef<MapView | null>(null);

  const cargar = useCallback(async () => {
    try {
      const data = await SolicitudesApi.verSolicitud(solicitudId);
      setSolicitud(data);
      setErrorCarga(null);
    } catch (err) {
      // si ya tenemos datos, la mantenemos y confiamos en el próximo ciclo de polling
      if (!solicitud) setErrorCarga(getErrorMessage(err));
    }
  }, [solicitudId, solicitud]);

  usePolling(cargar, 4000);

  // Avisa con un toast y una vibracion cada vez que el gomero cambia el estado del pedido.
  const estadoAnterior = useRef<Solicitud['estado'] | null>(null);
  useEffect(() => {
    const estado = solicitud?.estado;
    if (!estado) return;
    if (estadoAnterior.current && estadoAnterior.current !== estado) {
      toast({ tipo: estado === 'completada' ? 'exito' : 'info', titulo: estadoLabel[estado] });
      if (estado !== 'completada') haptics.exito();
    }
    estadoAnterior.current = estado;
  }, [solicitud?.estado, toast]);

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
      { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true }
    );
  }, [solicitud?.latitud, solicitud?.longitud, posicionGomero]);

  const cancelar = async () => {
    const ok = await confirmar({
      titulo: '¿Cancelar la solicitud?',
      mensaje: solicitud?.gomero_id
        ? 'Tu gomero ya está asignado. Si cancelás, va a dejar de venir.'
        : 'Vamos a dejar de buscar un gomero para vos.',
      confirmar: 'Sí, cancelar',
      cancelar: 'No, seguir esperando',
      destructivo: true,
    });
    if (!ok) return;
    try {
      const actualizada = await SolicitudesApi.cambiarEstadoSolicitud(solicitudId, 'cancelada', {
        motivo_cancelacion: 'Cancelado por el cliente',
      });
      estadoAnterior.current = actualizada.estado;
      setSolicitud(actualizada);
      toast({ tipo: 'info', titulo: 'Solicitud cancelada' });
    } catch (err) {
      toast({ tipo: 'error', titulo: 'No se pudo cancelar', mensaje: getErrorMessage(err) });
    }
  };

  const enviarCalificacion = async () => {
    if (!puntuacion) {
      toast({ tipo: 'info', titulo: 'Elegí una puntuación', mensaje: 'Tocá las estrellas para calificar.' });
      return;
    }
    setEnviandoCalificacion(true);
    try {
      await SolicitudesApi.calificarSolicitud(solicitudId, puntuacion);
      setYaCalifico(true);
      haptics.exito();
    } catch (err) {
      toast({ tipo: 'error', titulo: 'No se pudo calificar', mensaje: getErrorMessage(err) });
    } finally {
      setEnviandoCalificacion(false);
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

  const mostrarChat = !!solicitud.gomero_id && solicitud.estado !== 'cancelada';

  let distancia: number | null = null;
  let etaMin: number | null = null;
  if (posicionGomero) {
    distancia = distanciaKm(lat, lng, parseFloat(posicionGomero.latitud), parseFloat(posicionGomero.longitud));
    etaMin = estimarEtaMinutos(distancia);
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.header} contentContainerStyle={styles.content}>
        <Text style={styles.servicio}>{solicitud.servicio_nombre}</Text>
        {solicitud.direccion && (
          <View style={styles.lineaConIcono}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={styles.linea}>{solicitud.direccion}</Text>
          </View>
        )}
        {solicitud.descripcion && <Text style={styles.descripcion}>“{solicitud.descripcion}”</Text>}

        <View style={styles.bloque}>
          <EstadoTimeline estado={solicitud.estado} />
        </View>

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

        {solicitud.gomero_nombre && (
          <View style={styles.gomeroBox}>
            <Avatar nombre={solicitud.gomero_nombre} apellido={solicitud.gomero_apellido} />
            <View style={styles.gomeroInfo}>
              <Text style={styles.gomeroNombre}>{solicitud.gomero_nombre} {solicitud.gomero_apellido}</Text>
              <Text style={styles.gomeroRol}>Tu gomero asignado</Text>
              {posicionGomero && (
                <Text style={styles.gomeroActualizado}>
                  Ubicación {formatRelativeTime(posicionGomero.registrado_en)}
                </Text>
              )}
            </View>
            {solicitud.gomero_telefono && (
              <Pressable
                style={styles.telBtn}
                onPress={() => Linking.openURL(`tel:${solicitud.gomero_telefono}`)}
                android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true, radius: 22 }}
                accessibilityLabel="Llamar al gomero"
              >
                <Ionicons name="call" size={18} color="#fff" />
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.mapWrapper}>
          <MapView
            ref={mapRef}
            style={styles.map}
            customMapStyle={isDark ? mapStyleOscuro : mapStyleClaro}
            showsPointsOfInterests={false}
            toolbarEnabled={false}
            initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
          >
            <ClientePin coordinate={{ latitude: lat, longitude: lng }} title="Tu ubicación" />
            {posicionGomero && (
              <GomeroPin
                coordinate={{ latitude: parseFloat(posicionGomero.latitud), longitude: parseFloat(posicionGomero.longitud) }}
                title={solicitud.gomero_nombre ?? 'Gomero'}
              />
            )}
          </MapView>
        </View>

        {CANCELABLES.includes(solicitud.estado) && (
          <Button title="Cancelar solicitud" variant="danger" icon="close-circle-outline" onPress={cancelar} style={styles.cancelBtn} />
        )}

        {solicitud.estado === 'completada' && !yaCalifico && (
          <View style={styles.calificarBox}>
            <Text style={styles.calificarTitulo}>¿Cómo fue el servicio?</Text>
            <Text style={styles.calificarSub}>Tu opinión ayuda a otros conductores.</Text>
            <View style={styles.estrellas}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Ionicons
                  key={n}
                  name={n <= puntuacion ? 'star' : 'star-outline'}
                  onPress={() => {
                    haptics.seleccion();
                    setPuntuacion(n);
                  }}
                  size={36}
                  color={n <= puntuacion ? colors.warning : colors.border}
                  suppressHighlighting
                />
              ))}
            </View>
            <Button title="Enviar calificación" onPress={enviarCalificacion} loading={enviandoCalificacion} />
          </View>
        )}
        {yaCalifico && (
          <View style={styles.graciasBox}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.gracias}>¡Gracias por tu calificación!</Text>
          </View>
        )}
      </ScrollView>

      {mostrarChat && (
        <View style={[styles.chatBox, { marginBottom: insets.bottom + spacing.md }]}>
          <View style={styles.chatHeader}>
            <Ionicons name="chatbubbles-outline" size={16} color={colors.primary} />
            <Text style={styles.seccion}>Chat con tu gomero</Text>
          </View>
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexShrink: 1 },
    content: { padding: spacing.xl, paddingTop: spacing.lg },
    servicio: { ...typography.title, color: colors.secondary },
    lineaConIcono: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
    linea: { ...typography.small, color: colors.textMuted, flexShrink: 1 },
    descripcion: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs },
    bloque: { marginTop: spacing.lg },
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
    gomeroBox: {
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
    gomeroInfo: { flex: 1 },
    gomeroNombre: { ...typography.subheading, color: colors.text },
    gomeroRol: { ...typography.small, color: colors.textMuted, marginTop: spacing.xxs },
    gomeroActualizado: { ...typography.captionStrong, color: colors.primary, marginTop: spacing.xs },
    telBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.success,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mapWrapper: {
      height: 280,
      borderRadius: radius.lg,
      overflow: 'hidden',
      marginTop: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    map: { flex: 1 },
    cancelBtn: { marginTop: spacing.lg },
    calificarBox: {
      marginTop: spacing.xl,
      padding: spacing.xl,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadow.card,
    },
    calificarTitulo: { ...typography.heading, color: colors.text, textAlign: 'center' },
    calificarSub: { ...typography.small, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
    estrellas: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.sm,
      marginVertical: spacing.lg,
    },
    graciasBox: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xl,
    },
    gracias: { ...typography.bodyStrong, color: colors.success },
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
