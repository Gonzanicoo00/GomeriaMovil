import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Servicio, Solicitud } from '../../types';
import * as ServiciosApi from '../../api/servicios';
import * as SolicitudesApi from '../../api/solicitudes';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';
import { ClienteStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ClienteStackParamList, 'ClienteHome'>;

const ESTADOS_ACTIVOS = ['pendiente', 'asignada', 'en_camino', 'en_proceso'];

export default function ClienteHomeScreen({ navigation }: Props) {
  const { usuario, logout } = useAuth();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [solicitudActiva, setSolicitudActiva] = useState<Solicitud | null>(null);
  const [cargando, setCargando] = useState(true);

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
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.saludo}>Hola, {usuario?.nombre} 👋</Text>
          <Text style={styles.subtitulo}>¿Que necesitas hoy?</Text>
        </View>
        <Pressable onPress={() => logout()}>
          <Text style={styles.logout}>Salir</Text>
        </Pressable>
      </View>

      {solicitudActiva && (
        <Pressable
          style={styles.bannerActivo}
          onPress={() => navigation.navigate('SolicitudDetalle', { solicitudId: solicitudActiva.id })}
        >
          <Text style={styles.bannerTitulo}>Tenes una solicitud en curso</Text>
          <Text style={styles.bannerSubtitulo}>{solicitudActiva.servicio_nombre} · Toca para ver el estado</Text>
        </Pressable>
      )}

      <Pressable style={styles.historialLink} onPress={() => navigation.navigate('Historial')}>
        <Text style={styles.historialText}>Ver historial de servicios →</Text>
      </Pressable>

      <Text style={styles.seccion}>Servicios disponibles</Text>
      <FlatList
        data={servicios}
        keyExtractor={(s) => String(s.id)}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargar} />}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.servicioCard, !!solicitudActiva && styles.disabled]}
            disabled={!!solicitudActiva}
            onPress={() => navigation.navigate('NuevaSolicitud', { servicioId: item.id })}
          >
            <Text style={styles.servicioNombre}>{item.nombre}</Text>
            <Text style={styles.servicioDesc}>{item.descripcion}</Text>
            <Text style={styles.servicioPrecio}>desde ${item.precio_base}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 60, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  saludo: { fontSize: 22, fontWeight: '800', color: colors.secondary },
  subtitulo: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  logout: { color: colors.danger, fontWeight: '600' },
  bannerActivo: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, marginBottom: 16 },
  bannerTitulo: { color: '#fff', fontWeight: '700', fontSize: 15 },
  bannerSubtitulo: { color: '#FFEDD5', fontSize: 12, marginTop: 2 },
  historialLink: { marginBottom: 16 },
  historialText: { color: colors.primary, fontWeight: '600' },
  seccion: { fontSize: 15, fontWeight: '700', color: colors.secondary, marginBottom: 10 },
  lista: { paddingBottom: 40 },
  servicioCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: { opacity: 0.5 },
  servicioNombre: { fontSize: 16, fontWeight: '700', color: colors.text },
  servicioDesc: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  servicioPrecio: { fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: 8 },
});
