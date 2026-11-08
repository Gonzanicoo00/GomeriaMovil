// URL del backend.
// - En los builds de EAS (APK) viene de EXPO_PUBLIC_API_URL, definida en eas.json
//   (ej. https://gomeria-api.onrender.com/api).
// - En desarrollo, si no está definida, se usa XAMPP en la IP local de tu PC.
//   El celular no puede usar "localhost": poné la IPv4 de tu red WiFi (`ipconfig`).
const LAN_IP = '192.168.1.5';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || `http://${LAN_IP}/Gomeria_movil/backend/public/api`;
