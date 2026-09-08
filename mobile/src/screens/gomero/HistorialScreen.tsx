import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SolicitudCard } from '../../components/SolicitudCard';
import * as SolicitudesApi from '../../api/solicitudes';
import { Solicitud } from '../../types';
import { colors } from '../../theme';
import { GomeroStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<GomeroStackParamList, 'Historial'>;

export default function HistorialScreen({ navigation }: Props) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setSolicitudes(await SolicitudesApi.misSolicitudes());
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
      <Text style={styles.titulo}>Historial de servicios</Text>
      <FlatList
        data={solicitudes}
        keyExtractor={(s) => String(s.id)}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargar} />}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={<Text style={styles.vacio}>Todavia no atendiste ningun servicio</Text>}
        renderItem={({ item }) => (
          <SolicitudCard
            solicitud={item}
            mostrarCliente
            onPress={() => navigation.navigate('SolicitudActiva', { solicitudId: item.id })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 60, paddingHorizontal: 20 },
  titulo: { fontSize: 22, fontWeight: '800', color: colors.secondary, marginBottom: 16 },
  lista: { paddingBottom: 40 },
  vacio: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});
