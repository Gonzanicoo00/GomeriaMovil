import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import MapView, { Region } from 'react-native-maps';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { IconButton } from '../../components/IconButton';
import { Bone, SkeletonGroup } from '../../components/Skeleton';
import { mapStyleClaro, mapStyleOscuro } from '../../components/MapPins';
import * as SolicitudesApi from '../../api/solicitudes';
import * as ServiciosApi from '../../api/servicios';
import { getErrorMessage } from '../../api/client';
import { useFeedback } from '../../context/FeedbackContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, radius, shadow, spacing, tabular, typography } from '../../theme';
import { Servicio } from '../../types';
import { formatPrecio } from '../../utils/format';
import { iconoServicio } from '../../utils/servicios';
import { ClienteStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ClienteStackParamList, 'NuevaSolicitud'>;

type Coordenada = { lat: number; lng: number };

const DELTA = 0.004;

function textoDireccion(d: Location.LocationGeocodedAddress | undefined): string | null {
  if (!d) return null;
  const calle = [d.street, d.streetNumber].filter(Boolean).join(' ');
  const partes = [calle || d.name, d.city ?? d.subregion].filter(Boolean);
  return partes.length ? partes.join(', ') : null;
}

/** Pin fijo en el centro del mapa: se levanta mientras el usuario arrastra. */
function PinCentral({ levantado }: { levantado: boolean }) {
  const { colors } = useTheme();
  const alto = useSharedValue(0);

  useEffect(() => {
    alto.value = withSpring(levantado ? 1 : 0, { damping: 12, stiffness: 260 });
  }, [levantado, alto]);

  const pin = useAnimatedStyle(() => ({ transform: [{ translateY: -12 * alto.value }] }));
  const sombra = useAnimatedStyle(() => ({ transform: [{ scale: 1 - 0.4 * alto.value }], opacity: 0.35 - 0.15 * alto.value }));

  return (
    <View style={pinStyles.centro} pointerEvents="none">
      <Animated.View style={[pinStyles.pin, pin]}>
        <MaterialCommunityIcons name="map-marker" size={48} color={colors.primary} />
      </Animated.View>
      <Animated.View style={[pinStyles.sombra, sombra]} />
    </View>
  );
}

const pinStyles = StyleSheet.create({
  centro: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  // la punta del icono queda justo en el centro del mapa
  pin: { marginBottom: 46 },
  sombra: { position: 'absolute', width: 14, height: 6, borderRadius: 7, backgroundColor: '#000' },
});

export default function NuevaSolicitudScreen({ route, navigation }: Props) {
  const { servicioId } = route.params;
  const { toast } = useFeedback();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [miPosicion, setMiPosicion] = useState<Coordenada | null>(null);
  const [ubicacion, setUbicacion] = useState<Coordenada | null>(null);
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);
  const [moviendo, setMoviendo] = useState(false);
  const [direccionDetectada, setDireccionDetectada] = useState<string | null>(null);
  const [direccion, setDireccion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const mapRef = useRef<MapView | null>(null);
  // Mientras el usuario no escriba su propia direccion, se completa con la del punto elegido en el mapa.
  const direccionEditada = useRef(false);

  const alturaMapa = Math.round(height * 0.44);

  useEffect(() => {
    ServiciosApi.listarServicios()
      .then((lista) => setServicio(lista.find((s) => s.id === servicioId) ?? null))
      .catch(() => {});
  }, [servicioId]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorUbicacion('Necesitamos permiso de ubicación para pedir el servicio');
        return;
      }
      try {
        const pos = await Location.getCurrentPositionAsync({});
        const punto = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMiPosicion(punto);
        setUbicacion(punto);
      } catch {
        setErrorUbicacion('No se pudo obtener tu ubicación. Revisá el GPS.');
      }
    })();
  }, []);

  const alCambiarRegion = async (region: Region) => {
    setMoviendo(false);
    const punto = { lat: region.latitude, lng: region.longitude };
    setUbicacion(punto);
    try {
      const [resultado] = await Location.reverseGeocodeAsync({ latitude: punto.lat, longitude: punto.lng });
      const texto = textoDireccion(resultado);
      setDireccionDetectada(texto);
      if (texto && !direccionEditada.current) setDireccion(texto);
    } catch {
      setDireccionDetectada(null);
    }
  };

  const recentrar = () => {
    if (!miPosicion) return;
    mapRef.current?.animateToRegion(
      { latitude: miPosicion.lat, longitude: miPosicion.lng, latitudeDelta: DELTA, longitudeDelta: DELTA },
      400
    );
  };

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
    <View style={styles.container}>
      <View style={{ height: alturaMapa }}>
        {miPosicion ? (
          <>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              customMapStyle={isDark ? mapStyleOscuro : mapStyleClaro}
              showsUserLocation
              showsMyLocationButton={false}
              showsPointsOfInterests={false}
              toolbarEnabled={false}
              initialRegion={{ latitude: miPosicion.lat, longitude: miPosicion.lng, latitudeDelta: DELTA, longitudeDelta: DELTA }}
              onRegionChange={() => !moviendo && setMoviendo(true)}
              onRegionChangeComplete={alCambiarRegion}
            />
            <PinCentral levantado={moviendo} />
            <View style={[styles.pista, { bottom: radius.xxl + spacing.md }]} pointerEvents="none">
              <Ionicons name="hand-left-outline" size={14} color={colors.text} />
              <Text style={styles.pistaTexto}>Mové el mapa para ajustar el punto</Text>
            </View>
            <IconButton
              icon="locate"
              onPress={recentrar}
              accessibilityLabel="Volver a mi ubicación"
              style={[styles.botonMapa, { bottom: radius.xxl + spacing.md }]}
            />
          </>
        ) : errorUbicacion ? (
          <View style={[styles.mapaVacio, { paddingTop: insets.top }]}>
            <View style={styles.errorIcono}>
              <Ionicons name="location-outline" size={28} color={colors.danger} />
            </View>
            <Text style={styles.errorTexto}>{errorUbicacion}</Text>
          </View>
        ) : (
          <SkeletonGroup style={styles.mapaVacio}>
            <Bone width={48} height={48} rounded={24} />
            <Text style={styles.cargandoTexto}>Buscando tu ubicación...</Text>
          </SkeletonGroup>
        )}

        <IconButton
          icon="chevron-back"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Volver"
          style={[styles.volver, { top: insets.top + spacing.sm }]}
        />
      </View>

      <KeyboardAvoidingView style={styles.panelWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.panel}
          contentContainerStyle={[styles.panelContenido, { paddingBottom: insets.bottom + spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.titulo}>Confirmá tu pedido</Text>

          <View style={styles.servicio}>
            <View style={styles.servicioIcono}>
              <MaterialCommunityIcons name={iconoServicio(servicio?.icono)} size={26} color={colors.primary} />
            </View>
            <View style={styles.servicioTexto}>
              <Text style={styles.servicioNombre} numberOfLines={1}>{servicio?.nombre ?? 'Servicio'}</Text>
              {servicio?.descripcion ? (
                <Text style={styles.servicioDesc} numberOfLines={2}>{servicio.descripcion}</Text>
              ) : null}
            </View>
            {servicio ? (
              <View style={styles.precioBox}>
                <Text style={styles.precioDesde}>desde</Text>
                <Text style={styles.precio}>{formatPrecio(servicio.precio_base)}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.puntoElegido}>
            <Ionicons name="location" size={18} color={ubicacion ? colors.success : colors.textMuted} />
            <Text style={styles.puntoTexto} numberOfLines={2}>
              {moviendo
                ? 'Ubicando...'
                : direccionDetectada ?? (ubicacion ? 'Punto marcado en el mapa' : 'Esperando tu ubicación')}
            </Text>
          </View>

          <Input
            label="Dirección / referencia (opcional)"
            icon="home-outline"
            value={direccion}
            onChangeText={(v) => {
              direccionEditada.current = true;
              setDireccion(v);
            }}
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
            disabled={!ubicacion || moviendo}
            style={styles.button}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    volver: { position: 'absolute', left: spacing.lg },
    botonMapa: { position: 'absolute', right: spacing.lg },
    pista: {
      position: 'absolute',
      left: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceElevated,
      ...shadow.raised,
    },
    pistaTexto: { ...typography.captionStrong, color: colors.text },
    mapaVacio: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.border,
      paddingHorizontal: spacing.xxl,
      paddingBottom: radius.xxl,
    },
    cargandoTexto: { ...typography.smallStrong, color: colors.textMuted, marginTop: spacing.md },
    errorIcono: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.dangerLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorTexto: { ...typography.bodyStrong, color: colors.text, textAlign: 'center', marginTop: spacing.md },
    panelWrap: { flex: 1, marginTop: -radius.xxl },
    panel: {
      flex: 1,
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
    },
    panelContenido: { padding: spacing.xl, paddingTop: spacing.xxl },
    titulo: { ...typography.title, color: colors.secondary },
    servicio: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    servicioIcono: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    servicioTexto: { flex: 1 },
    servicioNombre: { ...typography.subheading, color: colors.text },
    servicioDesc: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xxs },
    precioBox: { alignItems: 'flex-end' },
    precioDesde: { ...typography.caption, color: colors.textMuted },
    precio: { ...typography.subheading, ...tabular, color: colors.primary },
    puntoElegido: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
      marginBottom: spacing.xl,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    puntoTexto: { ...typography.smallStrong, color: colors.text, flex: 1 },
    textarea: { minHeight: 80, textAlignVertical: 'top' },
    button: { marginTop: spacing.sm },
  });
