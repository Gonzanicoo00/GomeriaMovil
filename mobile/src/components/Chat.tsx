import React, { useCallback, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mensaje } from '../types';
import * as ChatApi from '../api/chat';
import { usePolling } from '../hooks/usePolling';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, radius, spacing, typography } from '../theme';
import { EmptyState } from './EmptyState';

interface Props {
  solicitudId: number;
  usuarioId: number;
  activo: boolean;
}

export function Chat({ solicitudId, usuarioId, activo }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const lastIdRef = useRef(0);

  const cargarMensajes = useCallback(async () => {
    try {
      const nuevos = await ChatApi.listarMensajes(solicitudId, lastIdRef.current);
      if (nuevos.length) {
        lastIdRef.current = nuevos[nuevos.length - 1].id;
        setMensajes((prev) => [...prev, ...nuevos]);
      }
    } catch {
      // silencioso: el próximo polling reintenta
    }
  }, [solicitudId]);

  usePolling(cargarMensajes, 3000, activo);

  const enviar = async () => {
    const contenido = texto.trim();
    if (!contenido) return;
    setEnviando(true);
    setTexto('');
    try {
      const creado = await ChatApi.enviarMensaje(solicitudId, contenido);
      lastIdRef.current = creado.id;
      setMensajes((prev) => [...prev, creado]);
    } catch {
      setTexto(contenido);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <FlatList
        data={mensajes}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => {
          const esMio = item.remitente_id === usuarioId;
          return (
            <View style={[styles.bubble, esMio ? styles.bubbleMio : styles.bubbleOtro]}>
              {!esMio && <Text style={styles.remitente}>{item.remitente_nombre}</Text>}
              <Text style={esMio ? styles.textoMio : styles.textoOtro}>{item.contenido}</Text>
            </View>
          );
        }}
        ListEmptyComponent={<EmptyState icon="chatbubbles-outline" title="Todavía no hay mensajes" subtitle="Escribile para coordinar los detalles" />}
      />
      {activo && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={texto}
            onChangeText={setTexto}
            placeholder="Escribí un mensaje..."
            placeholderTextColor={colors.textMuted}
          />
          <Pressable
            style={[styles.sendBtn, (!texto.trim() || enviando) && styles.sendBtnDisabled]}
            onPress={enviar}
            disabled={enviando}
            android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true }}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1 },
    lista: { padding: spacing.md, flexGrow: 1 },
    bubble: { maxWidth: '80%', borderRadius: radius.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
    bubbleMio: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
    bubbleOtro: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
    remitente: { ...typography.captionStrong, color: colors.textMuted, marginBottom: spacing.xxs },
    textoMio: { ...typography.body, fontSize: 14, color: '#fff' },
    textoOtro: { ...typography.body, fontSize: 14, color: colors.text },
    inputRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      ...typography.body,
      fontSize: 14,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      color: colors.text,
      backgroundColor: colors.background,
    },
    sendBtn: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
    },
    sendBtnDisabled: { opacity: 0.5 },
  });
