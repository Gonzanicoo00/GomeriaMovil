import React, { useCallback, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Mensaje } from '../types';
import * as ChatApi from '../api/chat';
import { usePolling } from '../hooks/usePolling';
import { marcarChatVisto } from '../hooks/useMensajesNoLeidos';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, radius, spacing, tabular, typography } from '../theme';
import { EmptyState } from './EmptyState';
import { IconButton } from './IconButton';

interface Props {
  solicitudId: number;
  usuarioId: number;
  activo: boolean;
  /** Espacio que ocupa el header de navegacion (para que el teclado no tape el input en iOS). */
  offsetTeclado?: number;
}

function hora(fecha: string) {
  const d = new Date(fecha.replace(' ', 'T'));
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export function Chat({ solicitudId, usuarioId, activo, offsetTeclado = 0 }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const lastIdRef = useRef(0);
  const listaRef = useRef<FlatList<Mensaje>>(null);

  const agregar = useCallback(
    (nuevos: Mensaje[]) => {
      lastIdRef.current = nuevos[nuevos.length - 1].id;
      marcarChatVisto(solicitudId, lastIdRef.current);
      setMensajes((prev) => [...prev, ...nuevos]);
    },
    [solicitudId]
  );

  const cargarMensajes = useCallback(async () => {
    try {
      const nuevos = await ChatApi.listarMensajes(solicitudId, lastIdRef.current);
      if (nuevos.length) agregar(nuevos);
    } catch {
      // silencioso: el próximo polling reintenta
    }
  }, [solicitudId, agregar]);

  // Con el chat cerrado igual se cargan los mensajes una vez para poder leer el historial.
  usePolling(cargarMensajes, activo ? 3000 : 60000);

  const enviar = async () => {
    const contenido = texto.trim();
    if (!contenido) return;
    setEnviando(true);
    setTexto('');
    try {
      const creado = await ChatApi.enviarMensaje(solicitudId, contenido);
      agregar([creado]);
    } catch {
      setTexto(contenido);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={offsetTeclado}
      style={styles.container}
    >
      <FlatList
        ref={listaRef}
        data={mensajes}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.lista}
        onContentSizeChange={() => listaRef.current?.scrollToEnd({ animated: mensajes.length > 0 })}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => {
          const esMio = item.remitente_id === usuarioId;
          const anterior = mensajes[index - 1];
          const agrupado = anterior?.remitente_id === item.remitente_id;
          return (
            <Animated.View
              entering={FadeInUp.duration(220)}
              style={[styles.bubble, esMio ? styles.bubbleMio : styles.bubbleOtro, agrupado && styles.agrupado]}
            >
              {!esMio && !agrupado && <Text style={styles.remitente}>{item.remitente_nombre}</Text>}
              <Text style={esMio ? styles.textoMio : styles.textoOtro}>{item.contenido}</Text>
              <Text style={[styles.hora, esMio && styles.horaMia]}>{hora(item.created_at)}</Text>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <EmptyState icon="chatbubbles-outline" title="Todavía no hay mensajes" subtitle="Escribí para coordinar los detalles" />
        }
      />
      {activo ? (
        <View style={[styles.inputRow, { paddingBottom: insets.bottom + spacing.sm }]}>
          <TextInput
            style={styles.input}
            value={texto}
            onChangeText={setTexto}
            placeholder="Escribí un mensaje..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <IconButton
            icon="send"
            variante="solido"
            size={44}
            onPress={enviar}
            disabled={enviando}
            accessibilityLabel="Enviar mensaje"
            style={(!texto.trim() || enviando) && styles.sendBtnDisabled}
          />
        </View>
      ) : (
        <View style={[styles.cerrado, { paddingBottom: insets.bottom + spacing.md }]}>
          <Text style={styles.cerradoTexto}>El chat se cerró porque el servicio terminó.</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    lista: { padding: spacing.lg, flexGrow: 1 },
    bubble: {
      maxWidth: '80%',
      borderRadius: radius.lg,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginTop: spacing.md,
    },
    agrupado: { marginTop: spacing.xs },
    bubbleMio: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: spacing.xs },
    bubbleOtro: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderBottomLeftRadius: spacing.xs,
    },
    remitente: { ...typography.captionStrong, color: colors.primary, marginBottom: spacing.xxs },
    textoMio: { ...typography.body, color: colors.onPrimary },
    textoOtro: { ...typography.body, color: colors.text },
    hora: { ...typography.micro, ...tabular, color: colors.textMuted, alignSelf: 'flex-end', marginTop: spacing.xxs },
    horaMia: { color: 'rgba(255,255,255,0.75)' },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
      gap: spacing.sm,
    },
    input: {
      flex: 1,
      maxHeight: 120,
      minHeight: 44,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.xl,
      ...typography.body,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md - spacing.xxs,
      paddingBottom: spacing.md - spacing.xxs,
      color: colors.text,
      backgroundColor: colors.background,
    },
    sendBtnDisabled: { opacity: 0.5 },
    cerrado: {
      paddingTop: spacing.md,
      paddingHorizontal: spacing.xl,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    cerradoTexto: { ...typography.small, color: colors.textMuted, textAlign: 'center' },
  });
