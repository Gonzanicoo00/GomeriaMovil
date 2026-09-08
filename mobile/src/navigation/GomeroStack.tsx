import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GomeroHomeScreen from '../screens/gomero/GomeroHomeScreen';
import SolicitudActivaScreen from '../screens/gomero/SolicitudActivaScreen';
import HistorialScreen from '../screens/gomero/HistorialScreen';
import { colors } from '../theme';
import { GomeroStackParamList } from './types';

const Stack = createNativeStackNavigator<GomeroStackParamList>();

export function GomeroStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.secondary },
      }}
    >
      <Stack.Screen name="GomeroHome" component={GomeroHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SolicitudActiva" component={SolicitudActivaScreen} options={{ title: 'Servicio activo' }} />
      <Stack.Screen name="Historial" component={HistorialScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
