import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GomeroHomeScreen from '../screens/gomero/GomeroHomeScreen';
import SolicitudActivaScreen from '../screens/gomero/SolicitudActivaScreen';
import HistorialScreen from '../screens/gomero/HistorialScreen';
import MiPerfilScreen from '../screens/gomero/MiPerfilScreen';
import ChatScreen from '../screens/ChatScreen';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../theme';
import { GomeroStackParamList } from './types';

const Stack = createNativeStackNavigator<GomeroStackParamList>();

export function GomeroStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 17 },
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="GomeroHome" component={GomeroHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SolicitudActiva" component={SolicitudActivaScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Historial" component={HistorialScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MiPerfil" component={MiPerfilScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false, animation: 'slide_from_bottom' }} />
    </Stack.Navigator>
  );
}
