import React from 'react';
import { Image, ImageStyle, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { fonts } from '../theme';
import { iniciales } from '../utils/format';

interface Props {
  nombre?: string | null;
  apellido?: string | null;
  /** Foto de la persona; sin foto se muestran las iniciales. */
  uri?: string | null;
  size?: number;
  style?: ViewStyle;
}

// Colores con buen contraste con texto blanco, en claro y en oscuro.
const PALETA = ['#0EA5E9', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#6366F1', '#10B981', '#EF4444'];

/** Siempre el mismo color para la misma persona. */
function colorPara(texto: string): string {
  let hash = 0;
  for (let i = 0; i < texto.length; i++) hash = (hash * 31 + texto.charCodeAt(i)) | 0;
  return PALETA[Math.abs(hash) % PALETA.length];
}

export function Avatar({ nombre, apellido, uri, size = 44, style }: Props) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size, borderRadius: size / 2 }, style as ImageStyle]}
        resizeMode="cover"
        accessibilityLabel={`Foto de ${nombre ?? ''} ${apellido ?? ''}`.trim()}
      />
    );
  }

  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colorPara(`${nombre ?? ''} ${apellido ?? ''}`) },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.38 }]} maxFontSizeMultiplier={1}>
        {iniciales(nombre, apellido)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: '#FFFFFF', fontFamily: fonts.bold },
});
