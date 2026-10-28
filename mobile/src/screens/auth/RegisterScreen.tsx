import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthHero } from '../../components/AuthHero';
import { PressableScale } from '../../components/Animated';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { haptics } from '../../utils/haptics';
import { getErrorMessage } from '../../api/client';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, radius, spacing, typography } from '../../theme';
import { Rol } from '../../types';
import { esEmailValido } from '../../utils/validation';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

interface Errores {
  nombre?: string;
  apellido?: string;
  email?: string;
  password?: string;
}

export default function RegisterScreen({ navigation }: Props) {
  const { registrar } = useAuth();
  const { toast } = useFeedback();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<Rol>('cliente');
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState<Errores>({});

  const validar = (): boolean => {
    const nuevos: Errores = {};
    if (!nombre.trim()) nuevos.nombre = 'Ingresá tu nombre';
    if (!apellido.trim()) nuevos.apellido = 'Ingresá tu apellido';
    if (!email.trim()) nuevos.email = 'Ingresá tu email';
    else if (!esEmailValido(email)) nuevos.email = 'El email no es válido';
    if (!password) nuevos.password = 'Ingresá una contraseña';
    else if (password.length < 6) nuevos.password = 'Debe tener al menos 6 caracteres';

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const handleRegister = async () => {
    if (!validar()) return;
    setLoading(true);
    try {
      await registrar({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        password,
        telefono: telefono.trim() || undefined,
        rol,
      });
    } catch (err) {
      toast({ tipo: 'error', titulo: 'No se pudo crear la cuenta', mensaje: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.huge }]}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <AuthHero compacto>
          <Logo size={52} light />
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.heroSub}>Sumate en menos de un minuto</Text>
        </AuthHero>

        <View style={styles.card}>
          <Text style={styles.label}>¿Cómo vas a usar la app?</Text>
          <View style={styles.rolSelector}>
            <RolOption
              label="Soy cliente"
              icon="person-outline"
              active={rol === 'cliente'}
              onPress={() => setRol('cliente')}
            />
            <RolOption
              label="Soy gomero"
              icon="construct-outline"
              active={rol === 'gomero'}
              onPress={() => setRol('gomero')}
            />
          </View>

          <Input
            label="Nombre"
            icon="person-outline"
            value={nombre}
            onChangeText={(v) => { setNombre(v); setErrores((e) => ({ ...e, nombre: undefined })); }}
            placeholder="Juan"
            error={errores.nombre}
          />
          <Input
            label="Apellido"
            icon="person-outline"
            value={apellido}
            onChangeText={(v) => { setApellido(v); setErrores((e) => ({ ...e, apellido: undefined })); }}
            placeholder="Pérez"
            error={errores.apellido}
          />
          <Input
            label="Email"
            icon="mail-outline"
            value={email}
            onChangeText={(v) => { setEmail(v); setErrores((e) => ({ ...e, email: undefined })); }}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="tu@email.com"
            error={errores.email}
          />
          <Input
            label="Teléfono (opcional)"
            icon="call-outline"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            placeholder="3511234567"
          />
          <Input
            label="Contraseña"
            icon="lock-closed-outline"
            value={password}
            onChangeText={(v) => { setPassword(v); setErrores((e) => ({ ...e, password: undefined })); }}
            secureTextEntry
            placeholder="Mínimo 6 caracteres"
            error={errores.password}
          />

          <Button title="Crear cuenta" icon="checkmark-outline" onPress={handleRegister} loading={loading} style={styles.button} />

          <View style={styles.pie}>
            <Text style={styles.pieTexto}>¿Ya tenés cuenta?</Text>
            <Pressable onPress={() => navigation.navigate('Login')} hitSlop={10}>
              <Text style={styles.pieLink}>Ingresá</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RolOption({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <PressableScale
      onPress={() => {
        haptics.seleccion();
        onPress();
      }}
      style={[styles.rolOption, active && styles.rolOptionActive]}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
    >
      <Ionicons name={icon} size={18} color={active ? colors.primary : colors.textMuted} />
      <Text style={[styles.rolOptionText, active && styles.rolOptionTextActive]}>{label}</Text>
    </PressableScale>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  card: {
    flex: 1,
    marginTop: -spacing.xxxl,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
  },
  label: { ...typography.smallStrong, color: colors.secondary, marginBottom: spacing.sm },
  title: { ...typography.title, color: colors.onPrimary, marginTop: spacing.md, textAlign: 'center' },
  heroSub: { ...typography.small, color: 'rgba(255,255,255,0.85)', marginTop: spacing.xs },
  rolSelector: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  rolOption: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md + spacing.xxs,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rolOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  rolOptionText: { ...typography.bodyStrong, color: colors.textMuted },
  rolOptionTextActive: { color: colors.primary },
  button: { marginTop: spacing.sm },
  pie: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxl,
  },
  pieTexto: { ...typography.body, color: colors.textMuted },
  pieLink: { ...typography.subheading, fontSize: 15, color: colors.primary },
});
