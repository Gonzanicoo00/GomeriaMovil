import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Linking, Modal, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import MapView, { Polyline } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Avatar } from '../../components/Avatar';
import { BottomSheet } from '../../components/BottomSheet';
import { IconButton } from '../../components/IconButton';
import { PulseDot } from '../../components/Animated';
import { DetalleSkeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/ErrorState';
import { EstadoTimeline } from '../../components/EstadoTimeline';
import { ServicioCompletado } from '../../components/ServicioCompletado';
import { ClientePin, GomeroPinAnimado, mapStyleClaro, mapStyleOscuro } from '../../components/MapPins';
import * as SolicitudesApi from '../../api/solicitudes';
import * as TrackingApi from '../../api/tracking';
import { getErrorMessage } from '../../api/client';
import { usePolling } from '../../hooks/usePolling';
import { useLocationWatcher, Coords } from '../../hooks/useLocationWatcher';
import { useRuta } from '../../hooks/useRuta';
import { useMensajesNoLeidos } from '../../hooks/useMensajesNoLeidos';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, estadoLabel, radius, shadow, spacing, tabular, typography } from '../../theme';
import { EstadoSolicitud, Solicitud } from '../../types';
import { haptics } from '../../utils/haptics';
import { distanciaKm, estimarEtaMinutos, formatDuracion, formatPrecio, formatRelativeTime } from '../../utils/format';
import { GomeroStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<GomeroStackParamList, 'SolicitudActiva'>;

const SIGUIENTE_ESTADO: Partial<Record<EstadoSolicitud, { estado: EstadoSolicitud; label: string; icon: keyof typeof Ionicons.glyphMap }>> = {
  asignada: { estado: 'en_camino', label: 'Estoy en camino', icon: 'navigate-outline' },
  en_camino: { estado: 'en_proceso', label: 'Llegué, empiezo el trabajo', icon: 'construct-outline' },
  en_proceso: { estado: 'completada', label: 'Terminé el servicio', icon: 'checkmark-done-outline' },
};

const DESCRIPCION_GOMERO: Record<EstadoSolicitud, string> = {
  pendiente: 'Esperando confirmación.',
  asignada: 'Avisale al cliente cuando salgas para allá.',
  en_camino: 'El cliente ve tu ubicación en tiempo real.',
  en_proceso: 'Cuando termines, cargá el precio final.',
  completada: 'Servicio terminado. ¡Buen trabajo!',
  cancelada: 'Esta solicitud fue cancelada.',
};

export default function SolicitudActivaScreen({ route, navigation }: Props) {
  const { solicitudId } = route.params;
  const { usuario } = useAuth();
  const { toast, confirmar } = useFeedback();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const enfocada = useIsFocused();
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [precioFinal, setPrecioFinal] = useState('');
  const [precioError, setPrecioError] = useState<string | null>(null);
  const [pidiendoPrecio, setPidiendoPrecio] = useState(false);
  const [actualizando, setActualizando] = useState(false);
  const [exitoVisible, setExitoVisible] = useState(false);
  const [miPosicion, setMiPosicion] = useState<Coords | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const seguir = useRef(true);

  const alturaColapsada = Math.min(340, height * 0.44) + insets.bottom;
  const alturaExpandida = height * 0.86;

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

  const activa = !!solicitud && !['completada', 'cancelada'].includes(solicitud.estado);

  const coordsCliente = useMemo<Coords | null>(
    () => (solicitud ? { latitude: parseFloat(solicitud.latitud), longitude: parseFloat(solicitud.longitud) } : null),
    [solicitud?.latitud, solicitud?.longitud]
  );
  // Ruta por calles hasta el cliente desde que acepta: se recalcula sola si toma otro camino.
  const { ruta, recalculando } = useRuta(miPosicion, coordsCliente, enviandoTracking);
  const noLeidos = useMensajesNoLeidos(solicitudId, usuario?.id, activa && enfocada);

  const encuadrar = useCallback(
    (animado = true) => {
      if (!coordsCliente) return;
      if (miPosicion) {
        mapRef.current?.fitToCoordinates(ruta ? [coordsCliente, ...ruta.puntos] : [coordsCliente, miPosicion], {
          edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
          animated: animado,
        });
      } else {
        mapRef.current?.animateToRegion({ ...coordsCliente, latitudeDelta: 0.01, longitudeDelta: 0.01 }, animado ? 400 : 0);
      }
    },
    [coordsCliente, miPosicion, ruta ? ruta.puntos.length : 0]
  );

  // Reencuadra el mapa para que ambos puntos (cliente y gomero) queden siempre visibles.
  useEffect(() => {
    if (seguir.current) encuadrar();
  }, [encuadrar]);

  const avanzarEstado = async () => {
    if (!solicitud) return;
    const siguiente = SIGUIENTE_ESTADO[solicitud.estado];
    if (!siguiente) return;

    if (siguiente.estado === 'completada') {
      if (!pidiendoPrecio) {
        setPidiendoPrecio(true);
        return;
      }
      if (!precioFinal || Number(precioFinal) <= 0) {
        setPrecioError('Ingresá el precio final del servicio');
        return;
      }
    }

    setActualizando(true);
    try {
      const actualizada = await SolicitudesApi.cambiarEstadoSolicitud(solicitudId, siguiente.estado, {
        precio_final: siguiente.estado === 'completada' ? parseFloat(precioFinal) : undefined,
      });
      setSolicitud(actualizada);
      setPidiendoPrecio(false);
      if (siguiente.estado === 'completada') {
        haptics.exito();
        setExitoVisible(true);
      } else {
        toast({ tipo: 'exito', titulo: estadoLabel[siguiente.estado], mensaje: 'Le avisamos al cliente.' });
      }
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

  let distancia: number | null = null;
  let etaMin: number | null = null;
  if (ruta) {
    // Distancia y tiempo reales por calle.
    distancia = ruta.distancia / 1000;
    etaMin = Math.max(1, Math.round(ruta.duracion / 60));
  } else if (miPosicion) {
    distancia = distanciaKm(lat, lng, miPosicion.latitude, miPosicion.longitude);
    etaMin = estimarEtaMinutos(distancia);
  }

  const comoLlegar = () => {
    const url = Platform.select({
      ios: `maps://?daddr=${lat},${lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });
    Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`));
  };

  const abrirChat = () =>
    navigation.navigate('Chat', {
      solicitudId,
      nombre: solicitud.cliente_nombre,
      apellido: solicitud.cliente_apellido,
      rol: 'Cliente',
      telefono: solicitud.cliente_telefono,
      activo: activa,
    });

  const duracion = formatDuracion(solicitud.fecha_inicio ?? solicitud.fecha_asignacion, solicitud.fecha_completado);
  const resumen = [
    { label: 'Servicio', valor: solicitud.servicio_nombre ?? '' },
    { label: 'Cliente', valor: `${solicitud.cliente_nombre ?? ''} ${solicitud.cliente_apellido ?? ''}`.trim() },
    ...(duracion ? [{ label: 'Duración', valor: duracion }] : []),
    ...(solicitud.precio_final ? [{ label: 'Cobraste', valor: formatPrecio(solicitud.precio_final), destacado: true }] : []),
  ];

  const encabezado = (
    <View style={styles.encabezado}>
      <View style={styles.encabezadoFila}>
        <View style={styles.encabezadoTexto}>
          <View style={styles.estadoFila}>
            {enviandoTracking && <PulseDot color={colors.success} />}
            <Text style={styles.estadoTitulo} numberOfLines={1}>{estadoLabel[solicitud.estado]}</Text>
          </View>
          <Text style={styles.estadoDescripcion} numberOfLines={2}>{DESCRIPCION_GOMERO[solicitud.estado]}</Text>
        </View>
        {etaMin !== null && enviandoTracking && (
          <View style={styles.eta} accessibilityLabel={`Llegás en unos ${etaMin} minutos`}>
            <Text style={styles.etaValor}>{etaMin}</Text>
            <Text style={styles.etaUnidad}>min</Text>
          </View>
        )}
      </View>
      {siguiente && (
        <Button title={siguiente.label} icon={siguiente.icon} onPress={avanzarEstado} loading={actualizando && !pidiendoPrecio} style={styles.accion} />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        customMapStyle={isDark ? mapStyleOscuro : mapStyleClaro}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        mapPadding={{ top: insets.top + spacing.huge, right: 0, bottom: alturaColapsada - radius.xxl, left: 0 }}
        initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
        onPanDrag={() => {
          seguir.current = false;
        }}
      >
        {ruta && enviandoTracking && (
          <>
            <Polyline coordinates={ruta.puntos} strokeColor={colors.surface} strokeWidth={10} lineCap="round" lineJoin="round" zIndex={2} />
            <Polyline coordinates={ruta.puntos} strokeColor={colors.info} strokeWidth={6} lineCap="round" lineJoin="round" zIndex={3} />
          </>
        )}
        <ClientePin coordinate={{ latitude: lat, longitude: lng }} title={solicitud.cliente_nombre ?? 'Cliente'} />
        {miPosicion && <GomeroPinAnimado coordinate={miPosicion} title="Vos" />}
      </MapView>

      <View style={[styles.barraSuperior, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        <IconButton icon="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Volver" />
        <View style={styles.barraDerecha}>
          {activa && <IconButton icon="navigate" onPress={comoLlegar} accessibilityLabel="Cómo llegar con el GPS" />}
          <IconButton
            icon="locate"
            onPress={() => {
              seguir.current = true;
              encuadrar();
            }}
            accessibilityLabel="Centrar el mapa"
          />
        </View>
      </View>

      {recalculando && enviandoTracking && (
        <View style={[styles.aviso, { top: insets.top + spacing.sm + 56 }]} pointerEvents="none" accessibilityLiveRegion="polite">
          <Ionicons name="git-branch-outline" size={16} color={colors.info} />
          <Text style={styles.avisoTexto}>Recalculando ruta…</Text>
        </View>
      )}

      <BottomSheet alturaColapsada={alturaColapsada} alturaExpandida={alturaExpandida} encabezado={encabezado}>
        <View style={styles.cuerpo}>
          <View style={styles.persona}>
            <Avatar nombre={solicitud.cliente_nombre} apellido={solicitud.cliente_apellido} size={48} />
            <View style={styles.personaInfo}>
              <Text style={styles.personaNombre} numberOfLines={1}>
                {solicitud.cliente_nombre} {solicitud.cliente_apellido}
              </Text>
              <Text style={styles.personaRol}>
                Cliente{distancia !== null ? ` · a ${distancia.toFixed(1)} km` : ''}
              </Text>
            </View>
            <IconButton icon="chatbubble-ellipses" variante="suave" onPress={abrirChat} badge={noLeidos} accessibilityLabel="Abrir chat con el cliente" />
            {solicitud.cliente_telefono && activa ? (
              <IconButton
                icon="call"
                variante="solido"
                color={colors.success}
                onPress={() => Linking.openURL(`tel:${solicitud.cliente_telefono}`)}
                accessibilityLabel="Llamar al cliente"
              />
            ) : null}
          </View>

          <View style={styles.timeline}>
            <EstadoTimeline estado={solicitud.estado} soloPasos />
          </View>

          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Detalle del pedido</Text>
            <View style={styles.dato}>
              <View style={styles.datoIcono}>
                <Ionicons name="construct-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.datoTexto}>
                <Text style={styles.datoValor}>{solicitud.servicio_nombre}</Text>
                <Text style={styles.datoLabel}>Pedido {formatRelativeTime(solicitud.fecha_solicitud)}</Text>
              </View>
              {solicitud.precio_final || solicitud.precio_estimado ? (
                <Text style={styles.precio}>{formatPrecio(solicitud.precio_final ?? solicitud.precio_estimado)}</Text>
              ) : null}
            </View>
            {solicitud.direccion ? (
              <View style={styles.dato}>
                <View style={styles.datoIcono}>
                  <Ionicons name="location-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.datoTexto}>
                  <Text style={styles.datoValor}>{solicitud.direccion}</Text>
                  <Text style={styles.datoLabel}>Dirección de referencia</Text>
                </View>
              </View>
            ) : null}
            {solicitud.descripcion ? (
              <View style={styles.dato}>
                <View style={styles.datoIcono}>
                  <Ionicons name="chatbox-ellipses-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.datoTexto}>
                  <Text style={styles.datoValor}>{solicitud.descripcion}</Text>
                  <Text style={styles.datoLabel}>Lo que contó el cliente</Text>
                </View>
              </View>
            ) : null}
          </View>

          {activa && (
            <Button title="Cancelar servicio" variant="outlineDanger" icon="close-circle-outline" onPress={cancelar} style={styles.cancelBtn} />
          )}
        </View>
      </BottomSheet>

      <Modal visible={pidiendoPrecio} transparent animationType="fade" onRequestClose={() => setPidiendoPrecio(false)} statusBarTranslucent>
        <KeyboardAvoidingView style={styles.modalFondo} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPidiendoPrecio(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>¿Cuánto cobraste?</Text>
            <Text style={styles.modalSub}>Cargá el precio final para cerrar el servicio.</Text>
            <Input
              label="Precio final ($)"
              icon="cash-outline"
              value={precioFinal}
              onChangeText={(v) => {
                setPrecioFinal(v.replace(/[^0-9.,]/g, '').replace(',', '.'));
                setPrecioError(null);
              }}
              keyboardType="numeric"
              placeholder={solicitud.precio_estimado ? `Ej: ${Math.round(parseFloat(solicitud.precio_estimado))}` : 'Ej: 3200'}
              error={precioError ?? undefined}
              autoFocus
            />
            <Button title="Confirmar y terminar" icon="checkmark-done-outline" onPress={avanzarEstado} loading={actualizando} />
            <Button title="Volver" variant="outline" onPress={() => setPidiendoPrecio(false)} style={styles.modalVolver} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ServicioCompletado
        visible={exitoVisible}
        titulo="¡Buen trabajo!"
        subtitulo="El servicio quedó registrado y el cliente ya puede calificarte."
        resumen={resumen}
        textoCerrar="Volver al inicio"
        onCerrar={() => {
          setExitoVisible(false);
          navigation.goBack();
        }}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    barraSuperior: {
      position: 'absolute',
      left: spacing.lg,
      right: spacing.lg,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    barraDerecha: { flexDirection: 'row', gap: spacing.sm },
    aviso: {
      position: 'absolute',
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceElevated,
      ...shadow.card,
    },
    avisoTexto: { ...typography.captionStrong, color: colors.text },
    encabezado: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
    encabezadoFila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    encabezadoTexto: { flex: 1 },
    estadoFila: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    estadoTitulo: { ...typography.title, color: colors.text, flexShrink: 1 },
    estadoDescripcion: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs },
    eta: {
      minWidth: 64,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
    },
    etaValor: { ...typography.title, ...tabular, color: colors.primary },
    etaUnidad: { ...typography.captionStrong, color: colors.primary, marginTop: -spacing.xxs },
    accion: { marginTop: spacing.lg },
    cuerpo: { paddingHorizontal: spacing.xl },
    persona: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    personaInfo: { flex: 1 },
    personaNombre: { ...typography.subheading, color: colors.text },
    personaRol: { ...typography.caption, ...tabular, color: colors.textMuted, marginTop: spacing.xxs },
    timeline: { marginTop: spacing.xl },
    seccion: { marginTop: spacing.xxl },
    seccionTitulo: { ...typography.captionStrong, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
    dato: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
    datoIcono: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    datoTexto: { flex: 1 },
    datoValor: { ...typography.bodyStrong, color: colors.text },
    datoLabel: { ...typography.caption, color: colors.textMuted },
    precio: { ...typography.subheading, ...tabular, color: colors.primary },
    cancelBtn: { marginTop: spacing.xxl },
    modalFondo: { flex: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.overlay },
    modalCard: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.xl,
      padding: spacing.xl,
      ...shadow.raised,
    },
    modalTitulo: { ...typography.heading, color: colors.text },
    modalSub: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
    modalVolver: { marginTop: spacing.sm },
  });
