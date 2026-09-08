import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Switch, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SolicitudCard } from '../../components/SolicitudCard';
import * as SolicitudesApi from '../../api/solicitudes';
import * as GomerosApi from '../../api/gomeros';
import { getErrorMessage } from '../../api/client';
import { usePolling } from '../../hooks/usePolling';
import { useLocationWatcher } from '../../hooks/useLocationWatcher';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';
import { Solicitud } from '../../types';
import { GomeroStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<GomeroStackParamList, 'GomeroHome'>;

export default function GomeroHomeScreen({ navigation }: Props) {
  const { usuario, logout, refrescarUsuario } = useAuth();
  const [disponible, setDisponible] = useState(!!usuario?.gomero?.disponible);
  const [permisoUbicacion, setPermisoUbicacion] = useState(false);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(false);
  const [aceptandoId, setAceptandoId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermisoUbicacion(status === 'granted');
    })();
  }, []);

  // GPS continuo (no un timer fijo): se actualiza cada vez que el gomero se mueve,
  // asi la posicion que ve el cliente refleja el movimiento real.
  useLocationWatcher(disponible && permisoUbicacion, useCallback((coords) => {
    GomerosApi.actualizarUbicacion(coords.latitude, coords.longitude).catch(() => {});
  }, []));

  const cargarDisponibles = useCallback(async () => {
    if (!disponible) {
      setSolicitudes([]);
      return;
    }
    setCargando(true);
    try {
      setSolicitudes(await SolicitudesApi.solicitudesDisponibles());
    } catch {
      // el proximo polling reintenta
    } finally {
      setCargando(false);
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
      Alert.alert('Falta permiso', 'Necesitamos tu ubicacion para mostrarte solicitudes cercanas');
      return;
    }
    setDisponible(valor);
    try {
      await GomerosApi.actualizarDisponibilidad(valor);
      await refrescarUsuario();
    } catch (err) {
      setDisponible(!valor);
      Alert.alert('No se pudo actualizar', getErrorMessage(err));
    }
  };

  const aceptar = async (solicitud: Solicitud) => {
    setAceptandoId(solicitud.id);
    try {
      await SolicitudesApi.aceptarSolicitud(solicitud.id);
      navigation.navigate('SolicitudActiva', { solicitudId: solicitud.id });
    } catch (err) {
      Alert.alert('No se pudo aceptar', getErrorMessage(err));
      cargarDisponibles();
    } finally {
      setAceptandoId(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.saludo}>Hola, {usuario?.nombre} 🔧</Text>
          <Text style={styles.subtitulo}>
            {usuario?.gomero?.calificacion_promedio
              ? `★ ${parseFloat(usuario.gomero.calificacion_promedio).toFixed(1)}`
              : 'Sin calificaciones aun'}
          </Text>
        </View>
        <Pressable onPress={() => logout()}>
          <Text style={styles.logout}>Salir</Text>
        </Pressable>
      </View>

      <View style={styles.disponibleBox}>
        <View>
          <Text style={styles.disponibleTitulo}>{disponible ? 'Estas disponible' : 'Estas desconectado'}</Text>
          <Text style={styles.disponibleSub}>
            {disponible ? 'Vas a recibir solicitudes cercanas' : 'Activa para empezar a recibir pedidos'}
          </Text>
        </View>
        <Switch value={disponible} onValueChange={toggleDisponible} trackColor={{ true: colors.primary }} />
      </View>

      <Pressable style={styles.historialLink} onPress={() => navigation.navigate('Historial')}>
        <Text style={styles.historialText}>Ver historial de servicios →</Text>
      </Pressable>

      <Text style={styles.seccion}>Solicitudes disponibles</Text>
      {!disponible ? (
        <Text style={styles.vacio}>Activate como disponible para ver solicitudes cercanas</Text>
      ) : (
        <FlatList
          data={solicitudes}
          keyExtractor={(s) => String(s.id)}
          refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargarDisponibles} />}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={<Text style={styles.vacio}>No hay solicitudes cerca por ahora</Text>}
          renderItem={({ item }) => (
            <View>
              <SolicitudCard solicitud={item} mostrarCliente onPress={() => aceptar(item)} />
              {aceptandoId === item.id && <Text style={styles.aceptando}>Aceptando...</Text>}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 60, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  saludo: { fontSize: 22, fontWeight: '800', color: colors.secondary },
  subtitulo: { fontSize: 13, color: colors.warning, marginTop: 2, fontWeight: '600' },
  logout: { color: colors.danger, fontWeight: '600' },
  disponibleBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  disponibleTitulo: { fontWeight: '700', color: colors.text },
  disponibleSub: { fontSize: 12, color: colors.textMuted, marginTop: 2, maxWidth: 220 },
  historialLink: { marginBottom: 16 },
  historialText: { color: colors.primary, fontWeight: '600' },
  seccion: { fontSize: 15, fontWeight: '700', color: colors.secondary, marginBottom: 10 },
  lista: { paddingBottom: 40 },
  vacio: { textAlign: 'center', color: colors.textMuted, marginTop: 20 },
  aceptando: { textAlign: 'center', color: colors.primary, marginTop: -8, marginBottom: 12, fontSize: 12 },
});
