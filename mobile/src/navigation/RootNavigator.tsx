import React from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { AuthStack } from './AuthStack';
import { ClienteStack } from './ClienteStack';
import { GomeroStack } from './GomeroStack';
import { LoadingView } from '../components/LoadingView';
import BloqueoScreen from '../screens/auth/BloqueoScreen';
import { navigationRef } from './navigationRef';
import { fonts } from '../theme';

export function RootNavigator() {
  const { usuario, cargando, bloqueado } = useAuth();
  const { colors, isDark } = useTheme();
  usePushNotifications();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
    fonts: {
      regular: { fontFamily: fonts.regular, fontWeight: '400' as const },
      medium: { fontFamily: fonts.medium, fontWeight: '500' as const },
      bold: { fontFamily: fonts.bold, fontWeight: '700' as const },
      heavy: { fontFamily: fonts.extrabold, fontWeight: '800' as const },
    },
  };

  if (cargando) {
    return <LoadingView texto="Iniciando Gomería Móvil..." />;
  }

  if (usuario && bloqueado) {
    return <BloqueoScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      {!usuario ? <AuthStack /> : usuario.rol === 'gomero' ? <GomeroStack /> : <ClienteStack />}
    </NavigationContainer>
  );
}
