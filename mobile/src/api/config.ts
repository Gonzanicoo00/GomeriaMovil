// IP local de la maquina donde corre XAMPP. Como el celular (fisico o emulador)
// no puede usar "localhost" para llegar a tu PC, hay que apuntar a la IP de tu red WiFi.
// Cambiala si tu PC tiene otra IP (correla con `ipconfig` y buscá "IPv4").
const LAN_IP = '192.168.93.90';

export const API_BASE_URL = `http://${LAN_IP}/Gomeria_movil/backend/public/api`;
