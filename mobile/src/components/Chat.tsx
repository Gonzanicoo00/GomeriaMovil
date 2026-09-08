import React, { useCallback, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Mensaje } from '../types';
import * as ChatApi from '../api/chat';
import { usePolling } from '../hooks/usePolling';
import { colors } from '../theme';

interface Props {
  solicitudId: number;
  usuarioId: number;
  activo: boolean;
}

export function Chat({ solicitudId, usuarioId, activo }: Props) {
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
      // silencioso: el proximo polling reintenta
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
        ListEmptyComponent={<Text style={styles.vacio}>Todavia no hay mensajes</Text>}
      />
      {activo && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={texto}
            onChangeText={setTexto}
            placeholder="Escribi un mensaje..."
            placeholderTextColor={colors.textMuted}
          />
          <Pressable style={styles.sendBtn} onPress={enviar} disabled={enviando}>
            <Text style={styles.sendText}>Enviar</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  lista: { padding: 12, flexGrow: 1 },
  vacio: { textAlign: 'center', color: colors.textMuted, marginTop: 20 },
  bubble: { maxWidth: '80%', borderRadius: 12, padding: 10, marginBottom: 8 },
  bubbleMio: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  bubbleOtro: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  remitente: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 2 },
  textoMio: { color: '#fff', fontSize: 14 },
  textoOtro: { color: colors.text, fontSize: 14 },
  inputRow: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: colors.border, gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
  },
  sendBtn: { justifyContent: 'center', paddingHorizontal: 16, backgroundColor: colors.primary, borderRadius: 20 },
  sendText: { color: '#fff', fontWeight: '700' },
});
