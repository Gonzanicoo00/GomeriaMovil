import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Avatar } from '../components/Avatar';
import { Chat } from '../components/Chat';
import { IconButton } from '../components/IconButton';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, typography } from '../theme';
import { ChatParams } from '../navigation/types';

/** Chat a pantalla completa. Se usa igual desde el stack del cliente y del gomero. */
export default function ChatScreen() {
  const { params } = useRoute<RouteProp<{ Chat: ChatParams }, 'Chat'>>();
  const navigation = useNavigation();
  const { usuario } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <IconButton icon="chevron-back" variante="suave" color={colors.text} onPress={() => navigation.goBack()} accessibilityLabel="Volver" />
        <Avatar nombre={params.nombre} apellido={params.apellido} size={40} />
        <View style={styles.headerTexto}>
          <Text style={styles.nombre} numberOfLines={1}>
            {params.nombre} {params.apellido}
          </Text>
          <Text style={styles.rol}>{params.rol}</Text>
        </View>
        {params.telefono ? (
          <IconButton
            icon="call"
            variante="solido"
            color={colors.success}
            onPress={() => Linking.openURL(`tel:${params.telefono}`)}
            accessibilityLabel={`Llamar a ${params.nombre}`}
          />
        ) : null}
      </View>
      <Chat solicitudId={params.solicitudId} usuarioId={usuario!.id} activo={params.activo} />
    </View>
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
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTexto: { flex: 1 },
    nombre: { ...typography.subheading, color: colors.text },
    rol: { ...typography.caption, color: colors.textMuted },
  });
