import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconButton } from '../../components/IconButton';
import { Button } from '../../components/Button';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors, radius, spacing, typography } from '../../theme';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Terminos'>;

const ULTIMA_ACTUALIZACION = '29 de octubre de 2026';
/** Se guarda junto con la cuenta para saber qué versión aceptó cada usuario. Cambiarla al editar el texto. */
export const TERMINOS_VERSION = '2026-10-29';

interface Seccion {
  titulo: string;
  parrafos: string[];
}

const SECCIONES: Seccion[] = [
  {
    titulo: '1. Aceptación',
    parrafos: [
      'Al crear una cuenta y usar la app aceptás estos Términos y Condiciones y la Política de Privacidad. Si no estás de acuerdo, no uses la app.',
    ],
  },
  {
    titulo: '2. Qué es la app',
    parrafos: [
      'La app es una plataforma que conecta a personas que necesitan auxilio con sus neumáticos (clientes) con gomeros independientes que ofrecen ese servicio.',
      'No somos una gomería ni empleamos a los gomeros: el servicio lo presta y lo cobra cada gomero, que es el único responsable por su trabajo.',
    ],
  },
  {
    titulo: '3. Tu cuenta',
    parrafos: [
      'Tenés que ser mayor de 18 años y cargar datos reales y actualizados.',
      'Sos responsable de cuidar tu contraseña y de todo lo que se haga desde tu cuenta. Si notás un uso no autorizado, avisanos.',
    ],
  },
  {
    titulo: '4. Si sos cliente',
    parrafos: [
      'Te comprometés a describir el problema con honestidad, indicar una ubicación correcta y estar disponible cuando llegue el gomero.',
      'Cancelar seguido o pedir servicios que no necesitás puede llevar a la suspensión de la cuenta.',
      'El precio final lo acordás directamente con el gomero. Los precios que muestra la app son orientativos.',
    ],
  },
  {
    titulo: '5. Si sos gomero',
    parrafos: [
      'Declarás tener la experiencia, las herramientas y las habilitaciones necesarias para prestar el servicio, y cumplir con tus obligaciones fiscales.',
      'Te comprometés a aceptar solo los pedidos que puedas atender, llegar en el tiempo indicado, cobrar precios razonables y tratar con respeto al cliente.',
      'Mientras estés disponible, la app comparte tu ubicación con los clientes que te asignen para que puedan seguir tu llegada.',
    ],
  },
  {
    titulo: '6. Ubicación y datos personales',
    parrafos: [
      'Usamos tu ubicación para encontrar gomeros cercanos y mostrar el seguimiento del servicio. Compartimos tu nombre, teléfono y ubicación solo con la otra parte del servicio en curso.',
      'No vendemos tus datos. Podés pedir que corrijamos o borremos tu información en cualquier momento.',
    ],
  },
  {
    titulo: '7. Conducta',
    parrafos: [
      'No está permitido usar la app para fines ilegales, acosar a otros usuarios, publicar contenido ofensivo en el chat ni intentar vulnerar la seguridad del sistema.',
      'Podemos suspender o dar de baja cuentas que no cumplan estos términos.',
    ],
  },
  {
    titulo: '8. Responsabilidad',
    parrafos: [
      'Hacemos lo posible para que la app funcione bien, pero no garantizamos que esté siempre disponible ni libre de errores.',
      'No somos responsables por daños derivados del servicio prestado por el gomero ni por acuerdos entre usuarios fuera de la app.',
    ],
  },
  {
    titulo: '9. Cambios',
    parrafos: [
      'Podemos actualizar estos términos. Si el cambio es importante te vamos a avisar en la app, y seguir usándola implica que aceptás la nueva versión.',
    ],
  },
  {
    titulo: '10. Ley aplicable',
    parrafos: [
      'Estos términos se rigen por las leyes de la República Argentina, incluida la Ley 24.240 de Defensa del Consumidor y la Ley 25.326 de Protección de Datos Personales.',
    ],
  },
];

export default function TerminosScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" variante="suave" color={colors.text} onPress={() => navigation.goBack()} accessibilityLabel="Volver" />
        <Text style={styles.titulo}>Términos y Condiciones</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={styles.fecha}>Última actualización: {ULTIMA_ACTUALIZACION}</Text>
        {SECCIONES.map((s) => (
          <View key={s.titulo} style={styles.seccion}>
            <Text style={styles.seccionTitulo}>{s.titulo}</Text>
            {s.parrafos.map((p) => (
              <Text key={p} style={styles.parrafo}>{p}</Text>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.pie, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          title="Acepto los términos"
          icon="checkmark-outline"
          onPress={() => navigation.popTo('Register', { aceptoTerminos: true })}
        />
      </View>
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
      marginBottom: spacing.md,
    },
    titulo: { ...typography.heading, color: colors.text, flex: 1 },
    contenido: { paddingHorizontal: spacing.xxl, paddingBottom: spacing.xxl },
    fecha: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.lg },
    seccion: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    seccionTitulo: { ...typography.subheading, color: colors.text, marginBottom: spacing.sm },
    parrafo: { ...typography.small, color: colors.textMuted, marginBottom: spacing.xs },
    pie: {
      paddingHorizontal: spacing.xxl,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
  });
