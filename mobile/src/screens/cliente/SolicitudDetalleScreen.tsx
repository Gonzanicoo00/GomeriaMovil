import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import MapView from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { Avatar } from '../../components/Avatar';
import { BottomSheet } from '../../components/BottomSheet';
import { Calificacion } from '../../components/Calificacion';
import { IconButton } from '../../components/IconButton';
import { PulseDot } from '../../components/Animated';
import { DetalleSkeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/ErrorState';
import { DESCRIPCION_ESTADO, EstadoTimeline } from '../../components/EstadoTimeline';
import { ServicioCompletado } from '../../components/ServicioCompletado';
import { VehiculoGomero } from '../../components/VehiculoGomero';
import { ClientePin, GomeroPinAnimado, mapStyleClaro, mapStyleOscuro } from '../../components/MapPins';
import * as SolicitudesApi from '../../api/solicitudes';
import * as TrackingApi from '../../api/tracking';
import { getErrorMessage } from '../../api/client';
import { usePolling } from '../../hooks/usePolling';
import { useMensajesNoLeidos } from '../../hooks/useMensajesNoLeidos';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { haptics } from '../../utils/haptics';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, estadoLabel, radius, spacing, tabular, typography } from '../../theme';
import { Solicitud, UbicacionTracking } from '../../types';
import { distanciaKm, estimarEtaMinutos, formatDuracion, formatPrecio, formatRelativeTime } from '../../utils/format';
import { ClienteStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ClienteStackParamList, 'SolicitudDetalle'>;

const CANCELABLES: Solicitud['estado'][] = ['pendiente', 'asignada', 'en_camino'];
const CON_TRACKING: Solicitud['estado'][] = ['asignada', 'en_camino', 'en_proceso'];

export default function SolicitudDetalleScreen({ route, navigation }: Props) {
  const { solicitudId } = route.params;
  const { usuario } = useAuth();
  const { toast, confirmar } = useFeedback();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const enfocada = useIsFocused();
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [posicionGomero, setPosicionGomero] = useState<UbicacionTracking | null>(null);
  const [enviandoCalificacion, setEnviandoCalificacion] = useState(false);
  const [yaCalifico, setYaCalifico] = useState(false);
  const [exitoVisible, setExitoVisible] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const mapRef = useRef<MapView | null>(null);
  // Mientras sea true el mapa se reencuadra solo; si el usuario lo mueve, deja de hacerlo hasta que toque "centrar".
  const seguir = useRef(true);

  const alturaColapsada = Math.min(330, height * 0.42) + insets.bottom;
  const alturaExpandida = height * 0.86;

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
  // Si el servicio termina con la pantalla abierta, se muestra la pantalla de exito.
  const estadoAnterior = useRef<Solicitud['estado'] | null>(null);
  useEffect(() => {
    const estado = solicitud?.estado;
    if (!estado) return;
    if (estadoAnterior.current && estadoAnterior.current !== estado) {
      if (estado === 'completada') {
        haptics.exito();
        setExitoVisible(true);
      } else {
        toast({ tipo: 'info', titulo: estadoLabel[estado] });
        haptics.exito();
      }
    }
    estadoAnterior.current = estado;
  }, [solicitud?.estado, toast]);

  const cargarPosicion = useCallback(async () => {
    if (!solicitud || !CON_TRACKING.includes(solicitud.estado)) return;
    try {
      const pos = await TrackingApi.ultimaPosicion(solicitudId);
      setPosicionGomero(pos);
    } catch {
      // todavia no hay tracking
    }
  }, [solicitud, solicitudId]);

  usePolling(cargarPosicion, 3000, !!solicitud);

  const mostrarChat = !!solicitud?.gomero_id && solicitud.estado !== 'cancelada';
  const chatActivo = !!solicitud && !['completada', 'cancelada'].includes(solicitud.estado);
  const noLeidos = useMensajesNoLeidos(solicitudId, usuario?.id, mostrarChat && chatActivo && enfocada);

  const encuadrar = useCallback(
    (animado = true) => {
      if (!solicitud) return;
      const cliente = { latitude: parseFloat(solicitud.latitud), longitude: parseFloat(solicitud.longitud) };
      if (posicionGomero) {
        mapRef.current?.fitToCoordinates(
          [cliente, { latitude: parseFloat(posicionGomero.latitud), longitude: parseFloat(posicionGomero.longitud) }],
          { edgePadding: { top: 80, right: 60, bottom: 80, left: 60 }, animated: animado }
        );
      } else {
        mapRef.current?.animateToRegion({ ...cliente, latitudeDelta: 0.01, longitudeDelta: 0.01 }, animado ? 400 : 0);
      }
    },
    [solicitud?.latitud, solicitud?.longitud, posicionGomero]
  );

  // Reencuadra el mapa para que cliente y gomero queden siempre visibles a medida que se mueve.
  useEffect(() => {
    if (seguir.current) encuadrar();
  }, [encuadrar]);

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

  const enviarCalificacion = async (puntuacion: number, comentario?: string) => {
    setEnviandoCalificacion(true);
    try {
      await SolicitudesApi.calificarSolicitud(solicitudId, puntuacion, comentario);
      setYaCalifico(true);
      setExitoVisible(false);
      haptics.exito();
      toast({ tipo: 'exito', titulo: '¡Gracias por tu calificación!' });
    } catch (err) {
      toast({ tipo: 'error', titulo: 'No se pudo calificar', mensaje: getErrorMessage(err) });
    } finally {
      setEnviandoCalificacion(false);
    }
  };

  const abrirChat = () => {
    if (!solicitud) return;
    navigation.navigate('Chat', {
      solicitudId,
      nombre: solicitud.gomero_nombre,
      apellido: solicitud.gomero_apellido,
      rol: 'Tu gomero',
      telefono: solicitud.gomero_telefono,
      activo: chatActivo,
    });
  };

  if (!solicitud && errorCarga) {
    return <ErrorState fullscreen title="No se pudo cargar la solicitud" subtitle={errorCarga} onRetry={cargar} />;
  }

  if (!solicitud) {
    return <DetalleSkeleton />;
  }

  const lat = parseFloat(solicitud.latitud);
  const lng = parseFloat(solicitud.longitud);

  let distancia: number | null = null;
  let etaMin: number | null = null;
  if (posicionGomero && solicitud.estado !== 'en_proceso') {
    distancia = distanciaKm(lat, lng, parseFloat(posicionGomero.latitud), parseFloat(posicionGomero.longitud));
    etaMin = estimarEtaMinutos(distancia);
  }

  const duracion = formatDuracion(solicitud.fecha_inicio ?? solicitud.fecha_asignacion, solicitud.fecha_completado);
  const resumen = [
    { label: 'Servicio', valor: solicitud.servicio_nombre ?? '' },
    ...(solicitud.gomero_nombre ? [{ label: 'Gomero', valor: `${solicitud.gomero_nombre} ${solicitud.gomero_apellido ?? ''}`.trim() }] : []),
    ...(duracion ? [{ label: 'Duración', valor: duracion }] : []),
    ...(solicitud.precio_final ? [{ label: 'Total', valor: formatPrecio(solicitud.precio_final), destacado: true }] : []),
  ];

  const encabezado = (
    <View style={styles.encabezado}>
      <View style={styles.encabezadoTexto}>
        <View style={styles.estadoFila}>
          {CON_TRACKING.includes(solicitud.estado) || solicitud.estado === 'pendiente' ? (
            <PulseDot color={solicitud.estado === 'pendiente' ? colors.warning : colors.success} />
          ) : null}
          <Text style={styles.estadoTitulo}>{estadoLabel[solicitud.estado]}</Text>
        </View>
        <Text style={styles.estadoDescripcion} numberOfLines={2}>{DESCRIPCION_ESTADO[solicitud.estado]}</Text>
      </View>
      {etaMin !== null && (
        <View style={styles.eta} accessibilityLabel={`Llega en unos ${etaMin} minutos`}>
          <Text style={styles.etaValor}>{etaMin}</Text>
          <Text style={styles.etaUnidad}>min</Text>
        </View>
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
        <ClientePin coordinate={{ latitude: lat, longitude: lng }} title="Tu ubicación" />
        {posicionGomero && (
          <GomeroPinAnimado
            coordinate={{ latitude: parseFloat(posicionGomero.latitud), longitude: parseFloat(posicionGomero.longitud) }}
            title={solicitud.gomero_nombre ?? 'Gomero'}
          />
        )}
      </MapView>

      <View style={[styles.barraSuperior, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        <IconButton icon="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Volver" />
        <IconButton
          icon="locate"
          onPress={() => {
            seguir.current = true;
            encuadrar();
          }}
          accessibilityLabel="Centrar el mapa"
        />
      </View>

      <BottomSheet alturaColapsada={alturaColapsada} alturaExpandida={alturaExpandida} encabezado={encabezado}>
        <View style={styles.cuerpo}>
          <EstadoTimeline estado={solicitud.estado} soloPasos />

          {solicitud.gomero_nombre ? (
            <>
              <View style={styles.persona}>
                <Avatar nombre={solicitud.gomero_nombre} apellido={solicitud.gomero_apellido} size={48} />
                <View style={styles.personaInfo}>
                  <Text style={styles.personaNombre} numberOfLines={1}>
                    {solicitud.gomero_nombre} {solicitud.gomero_apellido}
                  </Text>
                  <Text style={styles.personaRol}>
                    {posicionGomero && CON_TRACKING.includes(solicitud.estado)
                      ? `Ubicación ${formatRelativeTime(posicionGomero.registrado_en)}`
                      : 'Tu gomero asignado'}
                    {distancia !== null ? ` · ${distancia.toFixed(1)} km` : ''}
                  </Text>
                </View>
                {mostrarChat && (
                  <IconButton icon="chatbubble-ellipses" variante="suave" onPress={abrirChat} badge={noLeidos} accessibilityLabel="Abrir chat con el gomero" />
                )}
                {solicitud.gomero_telefono && chatActivo ? (
                  <IconButton
                    icon="call"
                    variante="solido"
                    color={colors.success}
                    onPress={() => Linking.openURL(`tel:${solicitud.gomero_telefono}`)}
                    accessibilityLabel="Llamar al gomero"
                  />
                ) : null}
              </View>
              {solicitud.gomero_id ? (
                <VehiculoGomero
                  gomeroId={solicitud.gomero_id}
                  tipo={solicitud.vehiculo_tipo}
                  marcaModelo={solicitud.vehiculo_marca_modelo}
                  color={solicitud.vehiculo_color}
                  patente={solicitud.vehiculo_patente}
                  tieneFoto={!!Number(solicitud.vehiculo_tiene_foto)}
                />
              ) : null}
            </>
          ) : solicitud.estado === 'pendiente' ? (
            <View style={styles.buscando}>
              <MaterialCommunityIcons name="radar" size={22} color={colors.warning} />
              <Text style={styles.buscandoTexto}>Te avisamos apenas un gomero acepte tu pedido.</Text>
            </View>
          ) : null}

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
                  <Text style={styles.datoLabel}>Lo que contaste del problema</Text>
                </View>
              </View>
            ) : null}
          </View>

          {CANCELABLES.includes(solicitud.estado) && (
            <Button title="Cancelar solicitud" variant="outlineDanger" icon="close-circle-outline" onPress={cancelar} style={styles.cancelBtn} />
          )}

          {solicitud.estado === 'completada' && !yaCalifico && (
            <View style={styles.calificarBox}>
              <Text style={styles.calificarTitulo}>¿Cómo fue el servicio?</Text>
              <Text style={styles.calificarSub}>Tu opinión ayuda a otros conductores.</Text>
              <Calificacion enviando={enviandoCalificacion} onEnviar={enviarCalificacion} />
            </View>
          )}
          {yaCalifico && (
            <View style={styles.graciasBox}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.gracias}>¡Gracias por tu calificación!</Text>
            </View>
          )}
        </View>
      </BottomSheet>

      <ServicioCompletado
        visible={exitoVisible}
        titulo="¡Servicio completado!"
        subtitulo="Ya podés seguir tu camino. Gracias por usar Gomería Móvil."
        resumen={resumen}
        textoCerrar="Ahora no"
        onCerrar={() => setExitoVisible(false)}
      >
        <Text style={styles.calificarTitulo}>¿Cómo fue el servicio?</Text>
        <Text style={styles.calificarSub}>Tu opinión ayuda a otros conductores.</Text>
        <Calificacion enviando={enviandoCalificacion} onEnviar={enviarCalificacion} />
      </ServicioCompletado>
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
    encabezado: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
    },
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
    cuerpo: { paddingHorizontal: spacing.xl },
    persona: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.xl,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    personaInfo: { flex: 1 },
    personaNombre: { ...typography.subheading, color: colors.text },
    personaRol: { ...typography.caption, ...tabular, color: colors.textMuted, marginTop: spacing.xxs },
    buscando: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.xl,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.warningLight,
    },
    buscandoTexto: { ...typography.smallStrong, color: colors.text, flex: 1 },
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
    calificarBox: {
      marginTop: spacing.xxl,
      padding: spacing.xl,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    calificarTitulo: { ...typography.heading, color: colors.text, textAlign: 'center' },
    calificarSub: { ...typography.small, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg },
    graciasBox: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xxl,
    },
    gracias: { ...typography.bodyStrong, color: colors.success },
  });
