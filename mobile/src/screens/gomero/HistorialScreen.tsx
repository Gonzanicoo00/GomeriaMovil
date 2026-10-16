import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SolicitudCard } from '../../components/SolicitudCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FadeIn } from '../../components/Animated';
import { ListaSkeleton } from '../../components/Skeleton';
import * as SolicitudesApi from '../../api/solicitudes';
import { getErrorMessage } from '../../api/client';
import { Solicitud } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, spacing, typography } from '../../theme';
import { GomeroStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<GomeroStackParamList, 'Historial'>;

export default function HistorialScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [primeraCarga, setPrimeraCarga] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setSolicitudes(await SolicitudesApi.misSolicitudes());
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

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={styles.titulo}>Historial de servicios</Text>
      {primeraCarga ? (
        <ListaSkeleton />
      ) : error && solicitudes.length === 0 ? (
        <ErrorState subtitle={error} onRetry={cargar} />
      ) : (
        <FlatList
          data={solicitudes}
          keyExtractor={(s) => String(s.id)}
          refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargar} tintColor={colors.primary} />}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <EmptyState icon="document-text-outline" title="Todavía no atendiste ningún servicio" />
          }
          renderItem={({ item, index }) => (
            <FadeIn index={index}>
              <SolicitudCard
                solicitud={item}
                mostrarCliente
                onPress={() => navigation.navigate('SolicitudActiva', { solicitudId: item.id })}
              />
            </FadeIn>
          )}
        />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.xl },
    titulo: { ...typography.title, color: colors.secondary, marginBottom: spacing.lg },
    lista: { paddingBottom: spacing.huge, flexGrow: 1 },
  });
