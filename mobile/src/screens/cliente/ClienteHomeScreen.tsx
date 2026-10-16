import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Servicio, Solicitud } from '../../types';
import * as ServiciosApi from '../../api/servicios';
import * as SolicitudesApi from '../../api/solicitudes';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FadeIn, PulseDot } from '../../components/Animated';
import { ServicioSkeleton, SkeletonGroup } from '../../components/Skeleton';
import { ProfileSheet } from '../../components/ProfileSheet';
import { getErrorMessage } from '../../api/client';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, estadoLabel, radius, shadow, spacing, typography } from '../../theme';
import { formatPrecio } from '../../utils/format';
import { ClienteStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ClienteStackParamList, 'ClienteHome'>;

const ESTADOS_ACTIVOS = ['pendiente', 'asignada', 'en_camino', 'en_proceso'];

const ICONO_SERVICIO: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  tire: 'tire',
  patch: 'car-tire-alert',
  air: 'gauge',
  wrench: 'wrench',
  inspect: 'magnify-scan',
};

export default function ClienteHomeScreen({ navigation }: Props) {
  const { usuario, logout } = useAuth();
  const { confirmar } = useFeedback();
  const enfocada = useIsFocused();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [solicitudActiva, setSolicitudActiva] = useState<Solicitud | null>(null);
  const [cargando, setCargando] = useState(true);
  const [primeraCarga, setPrimeraCarga] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [perfilAbierto, setPerfilAbierto] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [listaServicios, listaSolicitudes] = await Promise.all([
        ServiciosApi.listarServicios(),
        SolicitudesApi.misSolicitudes(),
      ]);
      setServicios(listaServicios);
      const activa = listaSolicitudes.find((s) => ESTADOS_ACTIVOS.includes(s.estado));
      setSolicitudActiva(activa ?? null);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCargando(false);
      setPrimeraCarga(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const cerrarSesion = async () => {
    const ok = await confirmar({
      titulo: '¿Cerrar sesión?',
      mensaje: 'Vas a tener que volver a ingresar con tu email y contraseña.',
      confirmar: 'Cerrar sesión',
      destructivo: true,
      icono: 'log-out-outline',
    });
    if (ok) logout();
  };

  if (error && servicios.length === 0) {
    return <ErrorState fullscreen subtitle={error} onRetry={cargar} />;
  }

  // Con una cantidad impar de servicios se agrega un hueco para que la ultima tarjeta no ocupe todo el ancho.
  const grilla: (Servicio | null)[] = servicios.length % 2 ? [...servicios, null] : servicios;

  const encabezado = (
    <>
      <View
        style={[
          styles.hero,
          { paddingTop: insets.top + spacing.lg },
          solicitudActiva && styles.heroConActiva,
        ]}
      >
        {/* Circulos decorativos de fondo */}
        <View style={[styles.circulo, styles.circuloGrande]} />
        <View style={[styles.circulo, styles.circuloChico]} />

        <View style={styles.heroTop}>
          <Pressable style={styles.perfilBtn} onPress={() => setPerfilAbierto(true)} hitSlop={8}>
            <Avatar nombre={usuario?.nombre} apellido={usuario?.apellido} size={40} style={styles.avatar} />
            <View>
              <Text style={styles.heroSaludo}>Hola,</Text>
              <Text style={styles.heroNombre} numberOfLines={1}>{usuario?.nombre}</Text>
            </View>
          </Pressable>
          <Pressable
            style={styles.heroIconBtn}
            onPress={() => navigation.navigate('Historial')}
            android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true, radius: 22 }}
            accessibilityLabel="Ver historial"
          >
            <Ionicons name="time-outline" size={22} color="#fff" />
          </Pressable>
        </View>

        <Text style={styles.heroTitulo}>¿Qué necesitás hoy?</Text>
        <Text style={styles.heroSubtitulo}>Te conectamos con un gomero cerca tuyo en minutos.</Text>
      </View>

      {solicitudActiva && (
        <Pressable
          style={styles.activa}
          onPress={() => navigation.navigate('SolicitudDetalle', { solicitudId: solicitudActiva.id })}
          android_ripple={{ color: colors.primaryLight }}
        >
          <View style={styles.activaIcono}>
            <Ionicons name="pulse" size={22} color={colors.primary} />
          </View>
          <View style={styles.activaTexto}>
            <View style={styles.activaEnVivo}>
              <PulseDot color={colors.success} />
              <Text style={styles.activaEtiqueta}>En curso · {estadoLabel[solicitudActiva.estado]}</Text>
            </View>
            <Text style={styles.activaTitulo} numberOfLines={1}>{solicitudActiva.servicio_nombre}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
      )}

      <View style={styles.seccionRow}>
        <Text style={styles.seccion}>Servicios</Text>
        {solicitudActiva && <Text style={styles.seccionNota}>Disponibles al terminar tu pedido</Text>}
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      {enfocada && <StatusBar style="light" />}
      <FlatList
        data={primeraCarga ? [] : grilla}
        keyExtractor={(s) => (s ? String(s.id) : 'relleno')}
        numColumns={2}
        columnWrapperStyle={styles.columna}
        ListHeaderComponent={encabezado}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargar} tintColor={colors.primary} />}
        contentContainerStyle={[styles.lista, { paddingBottom: insets.bottom + spacing.xxxl }]}
        ListEmptyComponent={
          primeraCarga ? (
            <SkeletonGroup>
              {[0, 1, 2].map((fila) => (
                <View key={fila} style={[styles.columna, styles.filaSkeleton]}>
                  <ServicioSkeleton />
                  <ServicioSkeleton />
                </View>
              ))}
            </SkeletonGroup>
          ) : (
            <EmptyState icon="construct-outline" title="No hay servicios disponibles por ahora" />
          )
        }
        renderItem={({ item, index }) => !item ? <View style={styles.relleno} /> : (
          <FadeIn index={index} style={styles.relleno}>
            <Pressable
              style={[styles.servicioCard, !!solicitudActiva && styles.disabled]}
              disabled={!!solicitudActiva}
              onPress={() => navigation.navigate('NuevaSolicitud', { servicioId: item.id })}
              android_ripple={{ color: colors.primaryLight }}
            >
              <View style={styles.servicioIcono}>
                <MaterialCommunityIcons
                  name={ICONO_SERVICIO[item.icono ?? ''] ?? 'car-wrench'}
                  size={28}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.servicioNombre} numberOfLines={2}>{item.nombre}</Text>
              <Text style={styles.servicioDesc} numberOfLines={2}>{item.descripcion}</Text>
              <View style={styles.servicioPie}>
                <Text style={styles.servicioDesde}>desde</Text>
                <Text style={styles.servicioPrecio}>{formatPrecio(item.precio_base)}</Text>
              </View>
            </Pressable>
          </FadeIn>
        )}
      />

      <ProfileSheet
        visible={perfilAbierto}
        usuario={usuario}
        onClose={() => setPerfilAbierto(false)}
        onHistorial={() => navigation.navigate('Historial')}
        onLogout={cerrarSesion}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    lista: { flexGrow: 1 },
    hero: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xxxl,
      borderBottomLeftRadius: radius.xxl,
      borderBottomRightRadius: radius.xxl,
      overflow: 'hidden',
    },
    heroConActiva: { paddingBottom: spacing.huge + spacing.xl },
    circulo: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
    circuloGrande: { width: 260, height: 260, top: -90, right: -80 },
    circuloChico: { width: 140, height: 140, bottom: -50, left: -40 },
    heroTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xxl,
    },
    perfilBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexShrink: 1 },
    avatar: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' },
    heroSaludo: { ...typography.caption, color: 'rgba(255,255,255,0.8)' },
    heroNombre: { ...typography.subheading, color: '#fff' },
    heroIconBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroTitulo: { ...typography.display, color: '#fff' },
    heroSubtitulo: { ...typography.small, color: 'rgba(255,255,255,0.85)', marginTop: spacing.xs },
    activa: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginHorizontal: spacing.xl,
      marginTop: -spacing.huge,
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      ...shadow.raised,
    },
    activaIcono: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activaTexto: { flex: 1 },
    activaEnVivo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    activaEtiqueta: { ...typography.captionStrong, color: colors.success },
    activaTitulo: { ...typography.subheading, color: colors.text, marginTop: spacing.xxs },
    seccionRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      marginTop: spacing.xxl,
      marginBottom: spacing.md,
    },
    seccion: { ...typography.heading, color: colors.secondary },
    seccionNota: { ...typography.caption, color: colors.textMuted },
    columna: { gap: spacing.md, paddingHorizontal: spacing.xl, marginBottom: spacing.md },
    servicioCard: {
      flex: 1,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadow.card,
    },
    servicioIcono: {
      width: 52,
      height: 52,
      borderRadius: radius.md,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    relleno: { flex: 1 },
    filaSkeleton: { flexDirection: 'row' },
    disabled: { opacity: 0.5 },
    servicioNombre: { ...typography.subheading, color: colors.text, minHeight: 40 },
    servicioDesc: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs, minHeight: 32 },
    servicioPie: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginTop: spacing.md },
    servicioDesde: { ...typography.caption, color: colors.textMuted },
    servicioPrecio: { ...typography.subheading, color: colors.primary },
  });
