import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, fonts } from '../theme';
import { iniciales } from '../utils/format';

interface Props {
  nombre?: string | null;
  apellido?: string | null;
  size?: number;
  style?: ViewStyle;
}

export function Avatar({ nombre, apellido, size = 44, style }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{iniciales(nombre, apellido)}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: { color: colors.background, fontFamily: fonts.bold },
  });
