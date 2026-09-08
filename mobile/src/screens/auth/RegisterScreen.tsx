import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../api/client';
import { colors } from '../../theme';
import { Rol } from '../../types';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { registrar } = useAuth();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<Rol>('cliente');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nombre || !apellido || !email || !password) {
      Alert.alert('Faltan datos', 'Completa nombre, apellido, email y contraseña');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña muy corta', 'Debe tener al menos 6 caracteres');
      return;
    }
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
      Alert.alert('No se pudo crear la cuenta', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Crear cuenta</Text>

        <View style={styles.rolSelector}>
          <RolOption label="Soy cliente" active={rol === 'cliente'} onPress={() => setRol('cliente')} />
          <RolOption label="Soy gomero" active={rol === 'gomero'} onPress={() => setRol('gomero')} />
        </View>

        <Input label="Nombre" value={nombre} onChangeText={setNombre} placeholder="Juan" />
        <Input label="Apellido" value={apellido} onChangeText={setApellido} placeholder="Perez" />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="tu@email.com"
        />
        <Input
          label="Telefono (opcional)"
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
          placeholder="3511234567"
        />
        <Input
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Minimo 6 caracteres"
        />

        <Button title="Crear cuenta" onPress={handleRegister} loading={loading} style={styles.button} />
        <Button
          title="Ya tengo cuenta"
          variant="outline"
          onPress={() => navigation.navigate('Login')}
          style={styles.button}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RolOption({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Text
      onPress={onPress}
      style={[styles.rolOption, active && styles.rolOptionActive]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: colors.secondary, marginBottom: 24 },
  rolSelector: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  rolOption: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    color: colors.textMuted,
    fontWeight: '600',
    overflow: 'hidden',
  },
  rolOptionActive: {
    borderColor: colors.primary,
    color: colors.primary,
    backgroundColor: '#FFF7ED',
  },
  button: { marginTop: 8 },
});
