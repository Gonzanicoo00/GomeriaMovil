# Despliegue gratis

| Parte | Servicio |
|---|---|
| Base de datos MySQL | Aiven (plan Free) |
| Backend PHP | Render (Web Service gratis, Docker) |
| App Android | EAS Build (APK) |

## 1. Base de datos (Aiven)

1. Crear cuenta en https://aiven.io → **Create service** → **MySQL** → plan **Free**.
2. En la pestaña *Overview* anotar: Host, Port, User (`avnadmin`), Password, Database (`defaultdb`).
3. Descargar el **CA certificate** (`ca.pem`).
4. Conectarse con MySQL Workbench o HeidiSQL (con SSL y ese `ca.pem`) e importar
   `backend/database/schema.sql`.

> `backend/database/migraciones_mariadb.sql` es solo para bases viejas de XAMPP.
> No correrlo en Aiven.

## 2. Backend (Render)

1. Subir los cambios a GitHub (`git push`).
2. En https://render.com → **New** → **Blueprint** → elegir el repo. Toma `render.yaml`.
3. Completar las variables que pide:
   - `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`: los de Aiven.
   - `DB_SSL_CA`: `/etc/secrets/ca.pem`
4. En el servicio → **Environment** → **Secret Files** → agregar `ca.pem` con el contenido
   del certificado de Aiven.
5. Probar: `https://<tu-servicio>.onrender.com/api/health` y `/api/servicios`.

`JWT_SECRET` lo genera Render solo. `APP_DEBUG` queda en `false`.

## 3. App Android (EAS)

1. Si el nombre del servicio en Render no quedó `gomeria-api`, cambiar
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
