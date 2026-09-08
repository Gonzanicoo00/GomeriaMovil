import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { AuthStack } from './AuthStack';
import { ClienteStack } from './ClienteStack';
import { GomeroStack } from './GomeroStack';
import { colors } from '../theme';

export function RootNavigator() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!usuario ? <AuthStack /> : usuario.rol === 'gomero' ? <GomeroStack /> : <ClienteStack />}
    </NavigationContainer>
  );
}
