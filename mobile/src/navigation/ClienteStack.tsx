import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ClienteHomeScreen from '../screens/cliente/ClienteHomeScreen';
import NuevaSolicitudScreen from '../screens/cliente/NuevaSolicitudScreen';
import SolicitudDetalleScreen from '../screens/cliente/SolicitudDetalleScreen';
import HistorialScreen from '../screens/cliente/HistorialScreen';
import ChatScreen from '../screens/ChatScreen';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../theme';
import { ClienteStackParamList } from './types';

const Stack = createNativeStackNavigator<ClienteStackParamList>();

export function ClienteStack() {
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
      <Stack.Screen name="ClienteHome" component={ClienteHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="NuevaSolicitud" component={NuevaSolicitudScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SolicitudDetalle" component={SolicitudDetalleScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Historial" component={HistorialScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false, animation: 'slide_from_bottom' }} />
    </Stack.Navigator>
  );
}
