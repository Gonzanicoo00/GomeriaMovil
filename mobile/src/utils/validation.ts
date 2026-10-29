const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function esEmailValido(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/** Saca espacios, puntos y guiones y pasa a mayúsculas: "ab 123-cd" -> "AB123CD". */
export function normalizarPatente(patente: string): string {
  return patente.replace(/[\s.-]/g, '').toUpperCase();
}

// Patentes argentinas: AAA123 y AA123BB (autos), 123ABC y A123BCD (motos).
const PATENTE_REGEX = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2}|\d{3}[A-Z]{3}|[A-Z]\d{3}[A-Z]{3})$/;

export function esPatenteValida(patente: string): boolean {
  return PATENTE_REGEX.test(normalizarPatente(patente));
}
