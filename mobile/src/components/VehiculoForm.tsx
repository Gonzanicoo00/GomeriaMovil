import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PressableScale } from './Animated';
import { Input } from './Input';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, radius, spacing, typography } from '../theme';
import { TipoVehiculo } from '../types';
import { haptics } from '../utils/haptics';
import { esPatenteValida, normalizarPatente } from '../utils/validation';

export interface DatosVehiculo {
  tipo: TipoVehiculo | null;
  marcaModelo: string;
  color: string;
  patente: string;
}

export type ErroresVehiculo = Partial<Record<'tipo' | 'marcaModelo' | 'color' | 'patente', string>>;

export const VEHICULO_VACIO: DatosVehiculo = { tipo: null, marcaModelo: '', color: '', patente: '' };

const TIPOS: { tipo: TipoVehiculo; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { tipo: 'moto', label: 'Moto', icon: 'motorbike' },
  { tipo: 'auto', label: 'Auto', icon: 'car-side' },
  { tipo: 'camioneta', label: 'Camioneta', icon: 'car-pickup' },
];

export function validarVehiculo(v: DatosVehiculo): ErroresVehiculo {
  const errores: ErroresVehiculo = {};
  if (!v.tipo) errores.tipo = 'Elegí en qué te movés';
  if (v.marcaModelo.trim().length < 2) errores.marcaModelo = 'Ingresá la marca y el modelo';
  if (v.color.trim().length < 3) errores.color = 'Ingresá el color';
  if (!v.patente.trim()) errores.patente = 'Ingresá la patente';
  else if (!esPatenteValida(v.patente)) errores.patente = 'Revisá la patente (ej: AB123CD o ABC123)';
  return errores;
}

/** Lo que espera la API. */
export function vehiculoParaApi(v: DatosVehiculo) {
  return {
    tipo: v.tipo as TipoVehiculo,
    marca_modelo: v.marcaModelo.trim(),
    color: v.color.trim(),
    patente: normalizarPatente(v.patente),
  };
}

interface Props {
  valor: DatosVehiculo;
  onChange: (valor: DatosVehiculo) => void;
  errores: ErroresVehiculo;
  onErroresChange: (errores: ErroresVehiculo) => void;
}

export function VehiculoForm({ valor, onChange, errores, onErroresChange }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const set = <K extends keyof DatosVehiculo>(campo: K, v: DatosVehiculo[K], error: keyof ErroresVehiculo) => {
    onChange({ ...valor, [campo]: v });
    if (errores[error]) onErroresChange({ ...errores, [error]: undefined });
  };

  return (
    <View>
      <Text style={styles.label}>¿En qué te movés?</Text>
      <View style={styles.tipos}>
        {TIPOS.map((t) => {
          const activo = valor.tipo === t.tipo;
          return (
            <PressableScale
              key={t.tipo}
              onPress={() => {
                haptics.seleccion();
                set('tipo', t.tipo, 'tipo');
              }}
              style={[styles.tipo, activo && styles.tipoActivo, errores.tipo ? styles.tipoError : null]}
              accessibilityRole="radio"
              accessibilityState={{ selected: activo }}
            >
              <MaterialCommunityIcons name={t.icon} size={24} color={activo ? colors.primary : colors.textMuted} />
              <Text style={[styles.tipoTexto, activo && styles.tipoTextoActivo]}>{t.label}</Text>
            </PressableScale>
          );
        })}
      </View>
      {errores.tipo ? <Text style={styles.error}>{errores.tipo}</Text> : null}

      <Input
        label="Marca y modelo"
        icon="car-outline"
        value={valor.marcaModelo}
        onChangeText={(v) => set('marcaModelo', v, 'marcaModelo')}
        placeholder={valor.tipo === 'moto' ? 'Honda Wave 110' : 'Fiat Fiorino'}
        error={errores.marcaModelo}
      />
      <Input
        label="Color"
        icon="color-palette-outline"
        value={valor.color}
        onChangeText={(v) => set('color', v, 'color')}
        placeholder="Rojo"
        error={errores.color}
      />
      <Input
        label="Patente"
        icon="card-outline"
        value={valor.patente}
        onChangeText={(v) => set('patente', v.toUpperCase(), 'patente')}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={9}
        placeholder={valor.tipo === 'moto' ? 'A123BCD' : 'AB123CD'}
        error={errores.patente}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    label: { ...typography.smallStrong, color: colors.secondary, marginBottom: spacing.sm },
    tipos: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
    tipo: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    tipoActivo: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    tipoError: { borderColor: colors.danger },
    tipoTexto: { ...typography.smallStrong, color: colors.textMuted },
    tipoTextoActivo: { color: colors.primary },
    error: { ...typography.caption, color: colors.danger, marginTop: -spacing.sm, marginBottom: spacing.md },
  });
