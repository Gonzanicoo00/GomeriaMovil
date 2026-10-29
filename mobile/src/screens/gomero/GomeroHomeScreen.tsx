import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SolicitudCard } from '../../components/SolicitudCard';
import { Avatar } from '../../components/Avatar';
import { ProfileSheet } from '../../components/ProfileSheet';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FadeIn, PressableScale, PulseDot } from '../../components/Animated';
import { IconButton } from '../../components/IconButton';
import { ListaSkeleton } from '../../components/Skeleton';
import * as SolicitudesApi from '../../api/solicitudes';
import * as GomerosApi from '../../api/gomeros';
import { getErrorMessage } from '../../api/client';
import { usePolling } from '../../hooks/usePolling';
import { useLocationWatcher } from '../../hooks/useLocationWatcher';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { haptics } from '../../utils/haptics';
import { formatPrecio } from '../../utils/format';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, radius, shadow, spacing, tabular, typography } from '../../theme';
import { Solicitud } from '../../types';
import { GomeroStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<GomeroStackParamList, 'GomeroHome'>;

export default function GomeroHomeScreen({ navigation }: Props) {
  const { usuario, logout, refrescarUsuario } = useAuth();
  const { toast, confirmar } = useFeedback();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const [disponible, setDisponible] = useState(!!usuario?.gomero?.disponible);
  const [permisoUbicacion, setPermisoUbicacion] = useState(false);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(false);
  const [primeraCarga, setPrimeraCarga] = useState(true);
  const [aceptandoId, setAceptandoId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [perfilAbierto, setPerfilAbierto] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermisoUbicacion(status === 'granted');
    })();
  }, []);

  // GPS continuo (no un timer fijo): se actualiza cada vez que el gomero se mueve,
  // así la posición que ve el cliente refleja el movimiento real.
  useLocationWatcher(disponible && permisoUbicacion, useCallback((coords) => {
    GomerosApi.actualizarUbicacion(coords.latitude, coords.longitude).catch(() => {});
  }, []));

  const cargarDisponibles = useCallback(async () => {
    if (!disponible) {
      setSolicitudes([]);
      setPrimeraCarga(false);
      return;
    }
    setCargando(true);
    try {
      setSolicitudes(await SolicitudesApi.solicitudesDisponibles());
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCargando(false);
      setPrimeraCarga(false);
    }
  }, [disponible]);

  useFocusEffect(
    useCallback(() => {
      cargarDisponibles();
    }, [cargarDisponibles])
  );

  usePolling(cargarDisponibles, 8000, disponible);

  const toggleDisponible = async (valor: boolean) => {
    if (valor && !permisoUbicacion) {
      toast({ tipo: 'error', titulo: 'Falta permiso de ubicación', mensaje: 'Lo necesitamos para mostrarte solicitudes cercanas.' });
      return;
    }
    haptics.seleccion();
    setDisponible(valor);
    try {
      await GomerosApi.actualizarDisponibilidad(valor);
      await refrescarUsuario();
    } catch (err) {
      setDisponible(!valor);
      toast({ tipo: 'error', titulo: 'No se pudo actualizar', mensaje: getErrorMessage(err) });
    }
  };

  const aceptar = async (solicitud: Solicitud) => {
    const detalle = [
      solicitud.cliente_nombre && `Cliente: ${solicitud.cliente_nombre} ${solicitud.cliente_apellido ?? ''}`.trim(),
      typeof solicitud.distancia_km === 'number' && `A ${solicitud.distancia_km.toFixed(1)} km de vos`,
      solicitud.precio_estimado && `Precio estimado: ${formatPrecio(solicitud.precio_estimado)}`,
    ]
      .filter(Boolean)
      .join(' · ');
    const ok = await confirmar({
      titulo: `¿Aceptar "${solicitud.servicio_nombre}"?`,
      mensaje: detalle || undefined,
      confirmar: 'Aceptar pedido',
      cancelar: 'Ahora no',
      icono: 'checkmark-circle-outline',
    });
    if (!ok) return;

    setAceptandoId(solicitud.id);
    try {
      await SolicitudesApi.aceptarSolicitud(solicitud.id);
      navigation.navigate('SolicitudActiva', { solicitudId: solicitud.id });
    } catch (err) {
      toast({ tipo: 'error', titulo: 'No se pudo aceptar', mensaje: getErrorMessage(err) });
      cargarDisponibles();
    } finally {
      setAceptandoId(null);
    }
  };

  const calificacion = usuario?.gomero?.calificacion_promedio;
  const faltaVehiculo = !!usuario?.gomero && (!usuario.gomero.vehiculo_tipo || !usuario.gomero.vehiculo_patente);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.header}>
        <PressableScale style={styles.headerLeft} onPress={() => setPerfilAbierto(true)} hitSlop={8} accessibilityLabel="Abrir perfil">
          <Avatar nombre={usuario?.nombre} apellido={usuario?.apellido} />
          <View>
            <Text style={styles.saludo}>Hola, {usuario?.nombre}</Text>
            <View style={styles.calificacionRow}>
              <Ionicons name="star" size={13} color={colors.warning} />
              <Text style={styles.subtitulo}>
                {calificacion ? parseFloat(calificacion).toFixed(1) : 'Sin calificaciones aún'}
              </Text>
            </View>
          </View>
        </PressableScale>
        <IconButton icon="time-outline" variante="suave" onPress={() => navigation.navigate('Historial')} accessibilityLabel="Ver historial" />
      </View>

      {faltaVehiculo && (
        <PressableScale style={styles.avisoVehiculo} onPress={() => navigation.navigate('MiPerfil')} accessibilityRole="button">
          <View style={styles.avisoIcono}>
            <Ionicons name="car-outline" size={20} color={colors.warning} />
          </View>
          <View style={styles.avisoTexto}>
            <Text style={styles.avisoTitulo}>Cargá los datos de tu vehículo</Text>
            <Text style={styles.avisoSub}>El cliente ve la foto y la patente para reconocerte.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </PressableScale>
      )}

      <View style={styles.disponibleBox}>
        <View style={styles.disponibleTextoBox}>
          {disponible ? (
            <PulseDot color={colors.success} size={10} />
          ) : (
            <View style={[styles.puntoEstado, { backgroundColor: colors.textMuted }]} />
          )}
          <View>
            <Text style={styles.disponibleTitulo}>{disponible ? 'Estás disponible' : 'Estás desconectado'}</Text>
            <Text style={styles.disponibleSub}>
              {disponible ? 'Vas a recibir solicitudes cercanas' : 'Activá para empezar a recibir pedidos'}
            </Text>
          </View>
        </View>
        <Switch
          value={disponible}
          onValueChange={toggleDisponible}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor={colors.onPrimary}
        />
      </View>

      <Text style={styles.seccion}>Solicitudes disponibles</Text>
      {!disponible ? (
        <EmptyState
          icon="power-outline"
          title="Estás desconectado"
          subtitle="Activate como disponible para ver solicitudes cercanas"
          actionLabel="Conectarme"
          actionIcon="power-outline"
          onAction={() => toggleDisponible(true)}
        />
      ) : primeraCarga ? (
        <ListaSkeleton cantidad={3} />
      ) : error && solicitudes.length === 0 ? (
        <ErrorState subtitle={error} onRetry={cargarDisponibles} />
      ) : (
        <FlatList
          data={solicitudes}
          keyExtractor={(s) => String(s.id)}
          refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargarDisponibles} tintColor={colors.primary} />}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <EmptyState icon="map-outline" title="No hay solicitudes cerca por ahora" subtitle="Te avisamos apenas llegue una" />
          }
          renderItem={({ item, index }) => (
            <FadeIn index={index}>
              <SolicitudCard solicitud={item} mostrarCliente onPress={() => aceptar(item)} />
              {aceptandoId === item.id && <Text style={styles.aceptando}>Aceptando...</Text>}
            </FadeIn>
          )}
        />
      )}

      <ProfileSheet
        visible={perfilAbierto}
        usuario={usuario}
        onClose={() => setPerfilAbierto(false)}
        onHistorial={() => navigation.navigate('Historial')}
        onMiPerfil={() => navigation.navigate('MiPerfil')}
        onLogout={async () => {
          const ok = await confirmar({
            titulo: '¿Cerrar sesión?',
            mensaje: disponible
              ? 'Mientras no estés conectado no vas a recibir solicitudes.'
              : 'Vas a tener que volver a ingresar con tu email y contraseña.',
            confirmar: 'Cerrar sesión',
            destructivo: true,
            icono: 'log-out-outline',
          });
          if (ok) logout();
        }}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexShrink: 1 },
  saludo: { ...typography.heading, color: colors.secondary },
  calificacionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xxs },
  subtitulo: { ...typography.smallStrong, ...tabular, color: colors.textMuted },
  avisoVehiculo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.warningLight,
    marginBottom: spacing.md,
  },
  avisoIcono: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avisoTexto: { flex: 1 },
  avisoTitulo: { ...typography.smallStrong, color: colors.text },
  avisoSub: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xxs },
  disponibleBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    ...shadow.card,
  },
  disponibleTextoBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexShrink: 1 },
  puntoEstado: { width: 10, height: 10, borderRadius: 5 },
  disponibleTitulo: { ...typography.subheading, color: colors.text },
  disponibleSub: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xxs, maxWidth: 220 },
  seccion: { ...typography.heading, color: colors.secondary, marginBottom: spacing.md },
  lista: { paddingBottom: spacing.huge, flexGrow: 1 },
  aceptando: { ...typography.captionStrong, textAlign: 'center', color: colors.primary, marginTop: -spacing.sm, marginBottom: spacing.md },
});
