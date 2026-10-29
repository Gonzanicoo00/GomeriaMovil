import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import axios from 'axios';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { Input } from '../../components/Input';
import { DatosVehiculo, ErroresVehiculo, VehiculoForm, validarVehiculo, vehiculoParaApi } from '../../components/VehiculoForm';
import * as GomerosApi from '../../api/gomeros';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, radius, spacing, typography } from '../../theme';
import { GomeroStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<GomeroStackParamList, 'MiPerfil'>;

interface Errores {
  nombre?: string;
  apellido?: string;
}

export default function MiPerfilScreen({ navigation }: Props) {
  const { usuario, refrescarUsuario } = useAuth();
  const { toast } = useFeedback();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const gomero = usuario?.gomero;

  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [apellido, setApellido] = useState(usuario?.apellido ?? '');
  const [telefono, setTelefono] = useState(usuario?.telefono ?? '');
  const [errores, setErrores] = useState<Errores>({});
  const [vehiculo, setVehiculo] = useState<DatosVehiculo>({
    tipo: gomero?.vehiculo_tipo ?? null,
    marcaModelo: gomero?.vehiculo_marca_modelo ?? '',
    color: gomero?.vehiculo_color ?? '',
    patente: gomero?.vehiculo_patente ?? '',
    foto: null,
    fotoActualUri: null,
  });
  const [erroresVehiculo, setErroresVehiculo] = useState<ErroresVehiculo>({});
  const [cargandoFoto, setCargandoFoto] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const vehiculoIncompleto = !gomero?.vehiculo_tipo || !gomero?.vehiculo_patente;

  useEffect(() => {
    if (!usuario) return;
    let activo = true;
    GomerosApi.fotoVehiculo(usuario.id)
      .then((base64) => {
        if (activo) setVehiculo((v) => ({ ...v, fotoActualUri: `data:image/jpeg;base64,${base64}` }));
      })
      .catch((err) => {
        // 404 = todavía no cargó foto; cualquier otro error se avisa.
        if (activo && !(axios.isAxiosError(err) && err.response?.status === 404)) {
          toast({ tipo: 'error', titulo: 'No se pudo cargar la foto', mensaje: getErrorMessage(err) });
        }
      })
      .finally(() => activo && setCargandoFoto(false));
    return () => {
      activo = false;
    };
  }, [usuario?.id]);

  const guardar = async () => {
    const nuevos: Errores = {};
    if (nombre.trim().length < 2) nuevos.nombre = 'Ingresá tu nombre';
    if (apellido.trim().length < 2) nuevos.apellido = 'Ingresá tu apellido';
    const nuevosVehiculo = validarVehiculo(vehiculo);
    setErrores(nuevos);
    setErroresVehiculo(nuevosVehiculo);
    if (Object.keys(nuevos).length > 0 || Object.keys(nuevosVehiculo).length > 0) {
      toast({ tipo: 'error', titulo: 'Revisá los datos marcados' });
      return;
    }

    setGuardando(true);
    try {
      await GomerosApi.actualizarPerfil({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim(),
        vehiculo: vehiculoParaApi(vehiculo),
      });
      await refrescarUsuario();
      toast({ tipo: 'exito', titulo: 'Perfil actualizado' });
      navigation.goBack();
    } catch (err) {
      toast({ tipo: 'error', titulo: 'No se pudo guardar', mensaje: getErrorMessage(err) });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <IconButton icon="chevron-back" variante="suave" color={colors.text} onPress={() => navigation.goBack()} accessibilityLabel="Volver" />
        <Text style={styles.titulo}>Mi perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <View style={styles.identidad}>
          <Avatar nombre={nombre || usuario?.nombre} apellido={apellido || usuario?.apellido} size={64} />
          <View style={styles.identidadTexto}>
            <Text style={styles.nombre} numberOfLines={1}>{nombre} {apellido}</Text>
            <Text style={styles.email} numberOfLines={1}>{usuario?.email}</Text>
          </View>
        </View>

        {vehiculoIncompleto && (
          <View style={styles.aviso}>
            <Text style={styles.avisoTitulo}>Completá los datos de tu vehículo</Text>
            <Text style={styles.avisoTexto}>
              Los clientes ven la foto, el modelo y la patente cuando aceptás un pedido. Así saben a quién esperar.
            </Text>
          </View>
        )}

        <Text style={styles.seccion}>Datos personales</Text>
        <Input
          label="Nombre"
          icon="person-outline"
          value={nombre}
          onChangeText={(v) => { setNombre(v); setErrores((e) => ({ ...e, nombre: undefined })); }}
          error={errores.nombre}
        />
        <Input
          label="Apellido"
          icon="person-outline"
          value={apellido}
          onChangeText={(v) => { setApellido(v); setErrores((e) => ({ ...e, apellido: undefined })); }}
          error={errores.apellido}
        />
        <Input
          label="Teléfono"
          icon="call-outline"
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
          placeholder="3511234567"
        />

        <Text style={styles.seccion}>Mi vehículo</Text>
        <VehiculoForm
          valor={vehiculo}
          onChange={setVehiculo}
          errores={erroresVehiculo}
          onErroresChange={setErroresVehiculo}
          cargandoFoto={cargandoFoto}
        />
      </ScrollView>

      <View style={[styles.pie, { paddingBottom: insets.bottom + spacing.lg }]}>
        {/* Hasta que llega la foto guardada no se sabe si falta, así que se espera para guardar. */}
        <Button title="Guardar cambios" icon="checkmark-outline" onPress={guardar} loading={guardando} disabled={cargandoFoto} />
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    titulo: { ...typography.heading, color: colors.text, flex: 1 },
    contenido: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
    identidad: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
      padding: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    identidadTexto: { flex: 1 },
    nombre: { ...typography.heading, color: colors.text },
    email: { ...typography.small, color: colors.textMuted, marginTop: spacing.xxs },
    aviso: {
      marginTop: spacing.lg,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.warningLight,
    },
    avisoTitulo: { ...typography.subheading, color: colors.text },
    avisoTexto: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs },
    seccion: {
      ...typography.captionStrong,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: spacing.xxl,
      marginBottom: spacing.md,
    },
    pie: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
  });
