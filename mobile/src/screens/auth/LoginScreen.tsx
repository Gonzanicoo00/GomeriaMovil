import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthHero } from '../../components/AuthHero';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { getErrorMessage } from '../../api/client';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, radius, spacing, typography } from '../../theme';
import { esEmailValido } from '../../utils/validation';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

interface Errores {
  email?: string;
  password?: string;
}

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { toast } = useFeedback();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState<Errores>({});

  const validar = (): boolean => {
    const nuevos: Errores = {};
    if (!email.trim()) nuevos.email = 'Ingresá tu email';
    else if (!esEmailValido(email)) nuevos.email = 'El email no es válido';
    if (!password) nuevos.password = 'Ingresá tu contraseña';

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const handleLogin = async () => {
    if (!validar()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      toast({ tipo: 'error', titulo: 'No se pudo iniciar sesión', mensaje: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <AuthHero>
          <Logo showText light size={72} />
        </AuthHero>

        <View style={styles.card}>
          <Text style={styles.titulo}>Iniciá sesión</Text>
          <Text style={styles.subtitulo}>Asistencia vial en minutos, donde estés.</Text>

          <View style={styles.form}>
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
              label="Contraseña"
              icon="lock-closed-outline"
              value={password}
              onChangeText={(v) => { setPassword(v); setErrores((e) => ({ ...e, password: undefined })); }}
              secureTextEntry
              placeholder="••••••"
              error={errores.password}
            />

            <Button title="Ingresar" icon="log-in-outline" onPress={handleLogin} loading={loading} style={styles.button} />
          </View>

          <View style={styles.pie}>
            <Text style={styles.pieTexto}>¿No tenés cuenta?</Text>
            <Pressable onPress={() => navigation.navigate('Register')} hitSlop={10}>
              <Text style={styles.pieLink}>Crear cuenta</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
      paddingTop: spacing.xxxl,
    },
    titulo: { ...typography.title, color: colors.secondary },
    subtitulo: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs },
    form: { marginTop: spacing.xxl },
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
