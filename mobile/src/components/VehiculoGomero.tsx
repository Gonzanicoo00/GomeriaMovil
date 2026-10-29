import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as GomerosApi from '../api/gomeros';
import { Bone, SkeletonGroup } from './Skeleton';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, radius, spacing, typography } from '../theme';
import { TipoVehiculo } from '../types';

interface Props {
  gomeroId: number;
  tipo: TipoVehiculo | null | undefined;
  marcaModelo: string | null | undefined;
  color: string | null | undefined;
  patente: string | null | undefined;
  tieneFoto: boolean;
}

const ICONO: Record<TipoVehiculo, keyof typeof MaterialCommunityIcons.glyphMap> = {
  moto: 'motorbike',
  auto: 'car-side',
  camioneta: 'car-pickup',
};

const NOMBRE: Record<TipoVehiculo, string> = {
  moto: 'Moto',
  auto: 'Auto',
  camioneta: 'Camioneta',
};

/** Cómo llega el gomero: foto, tipo, modelo, color y patente, para que el cliente lo reconozca. */
export function VehiculoGomero({ gomeroId, tipo, marcaModelo, color, patente, tieneFoto }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [foto, setFoto] = useState<string | null>(null);
  const [cargandoFoto, setCargandoFoto] = useState(tieneFoto);

  useEffect(() => {
    if (!tieneFoto) return;
    let activo = true;
    GomerosApi.fotoVehiculo(gomeroId)
      .then((base64) => activo && setFoto(base64))
      .catch(() => {})
      .finally(() => activo && setCargandoFoto(false));
    return () => {
      activo = false;
    };
  }, [gomeroId, tieneFoto]);

  // Gomeros registrados antes de que se pidieran estos datos.
  if (!tipo && !patente) return null;

  const descripcion = [marcaModelo, color].filter(Boolean).join(' · ');

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <View style={styles.icono}>
          <MaterialCommunityIcons name={tipo ? ICONO[tipo] : 'car-side'} size={22} color={colors.primary} />
        </View>
        <View style={styles.texto}>
          <Text style={styles.titulo}>Llega en {tipo ? NOMBRE[tipo].toLowerCase() : 'su vehículo'}</Text>
          {descripcion ? <Text style={styles.descripcion} numberOfLines={1}>{descripcion}</Text> : null}
        </View>
        {patente ? <Patente valor={patente} /> : null}
      </View>
      {cargandoFoto ? (
        <SkeletonGroup>
          <Bone height={180} rounded={0} />
        </SkeletonGroup>
      ) : foto ? (
        <Image
          source={{ uri: `data:image/jpeg;base64,${foto}` }}
          style={styles.foto}
          resizeMode="cover"
          accessibilityLabel="Foto del vehículo del gomero"
        />
      ) : null}
    </View>
  );
}

/** Patente con el estilo de las argentinas del Mercosur: franja azul arriba y letras negras. */
export function Patente({ valor }: { valor: string }) {
  const styles = createStyles(useTheme().colors);
  return (
    <View style={styles.patente} accessibilityLabel={`Patente ${valor.split('').join(' ')}`}>
      <View style={styles.patenteFranja}>
        <Text style={styles.patentePais}>ARGENTINA</Text>
      </View>
      <Text style={styles.patenteTexto}>{formatearPatente(valor)}</Text>
    </View>
  );
}

/** AB123CD -> "AB 123 CD", ABC123 -> "ABC 123". */
function formatearPatente(p: string) {
  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(p)) return `${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5)}`;
  if (/^[A-Z]{3}\d{3}$/.test(p)) return `${p.slice(0, 3)} ${p.slice(3)}`;
  return p;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      marginTop: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    foto: { width: '100%', aspectRatio: 16 / 9, borderRadius: 0 },
    info: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
    icono: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    texto: { flex: 1 },
    titulo: { ...typography.smallStrong, color: colors.text },
    descripcion: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xxs },
    patente: {
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: '#0F172A',
      backgroundColor: '#FFFFFF',
      overflow: 'hidden',
      minWidth: 92,
    },
    patenteFranja: { backgroundColor: '#1D4ED8', paddingVertical: 1, alignItems: 'center' },
    patentePais: { fontFamily: typography.micro.fontFamily, fontSize: 7, lineHeight: 9, letterSpacing: 1, color: '#FFFFFF' },
    patenteTexto: {
      ...typography.subheading,
      fontSize: 15,
      letterSpacing: 1,
      color: '#0F172A',
      textAlign: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
    },
  });
