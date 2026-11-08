# Despliegue gratis

| Parte | Servicio |
|---|---|
| Base de datos (MySQL compatible) | TiDB Cloud Starter (gratis, sin vencimiento, límite de gasto $0) |
| Backend PHP | Render (Web Service gratis, Docker) |
| App Android | EAS Build (APK) |

## 1. Base de datos (TiDB Cloud)

1. En https://tidbcloud.com → **Create Resource** → plan **Starter**, **MySQL Compatible**,
   región **N. Virginia (us-east-1)**, límite de gasto **$0**.
2. **SQL Editor** → pegar el contenido de `backend/database/schema.sql` precedido de
   `CREATE DATABASE IF NOT EXISTS gomeria; USE gomeria;` → **Shift+Ctrl+Enter** (ejecutar todo).
3. **Connect** → anotar Host, Port (4000), Username; **Generate Password** y guardarla.

TiDB usa un certificado público: no hace falta subir ningún `ca.pem`.

> `backend/database/migraciones_mariadb.sql` es solo para bases viejas de XAMPP.

## 2. Backend (Render)

1. En https://render.com → **New** → **Blueprint** → elegir el repo. Toma `render.yaml`.
2. Completar `DB_HOST`, `DB_USERNAME` y `DB_PASSWORD` con los datos de TiDB.
3. Probar: `https://<tu-servicio>.onrender.com/api/health` y `/api/servicios`.

`JWT_SECRET` lo genera Render solo. `APP_DEBUG` queda en `false`.

## 3. App Android (EAS)

1. Si la URL de Render no es `https://gomeria-api.onrender.com`, cambiar
   `EXPO_PUBLIC_API_URL` en `mobile/eas.json`.
2. Desde `mobile/`:
   ```
   npm install -g eas-cli
   eas login
   eas init
   eas build -p android --profile preview
   ```
3. Al terminar, EAS da un link/QR para descargar el APK e instalarlo.

## Antes de presentar

- El plan gratis de Render se duerme tras 15 min sin uso; la primera petición tarda ~50 s.
  Abrir `/api/health` unos minutos antes.
- Cargar usuarios de prueba (cliente y gomero).
- Restringir la API key de Google Maps (en Google Cloud Console) al paquete
  `com.anonymous.gomeriamovil`.
