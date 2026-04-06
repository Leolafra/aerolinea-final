# Despliegue publico

Esta guia deja el proyecto listo para publicarse en internet con:

- frontend en Vercel
- backend en Render o Railway
- dominio principal `aeropuertohaider.com`
- API en `api.aeropuertohaider.com`

## Arquitectura publica recomendada

- Web publica:
  - `https://aeropuertohaider.com`
- Portal de empleados:
  - `https://aeropuertohaider.com/employee-access`
  - `https://aeropuertohaider.com/staff`
- Backend API:
  - `https://api.aeropuertohaider.com/api`

## 1. Preparar repositorio

Sube la carpeta [skybridge-ops](/Users/leo/Documents/skybridge-ops) a GitHub.

## 2. Desplegar frontend en Vercel

Proyecto:

- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`

Variables de entorno en Vercel:

- `VITE_API_URL=https://api.aeropuertohaider.com/api`

Archivo ya preparado:

- [client/vercel.json](/Users/leo/Documents/skybridge-ops/client/vercel.json)

Esto permite:

- servir la web publica
- mantener las rutas SPA como `/employee-access` y `/staff`

## 3. Desplegar backend en Render

Servicio web:

- Root directory: `server`
- Build command: `npm install && npm run build`
- Start command: `npm run start`

Archivo ya preparado:

- [render.yaml](/Users/leo/Documents/skybridge-ops/render.yaml)

Variables de entorno en Render:

- `NODE_ENV=production`
- `PORT=4000`
- `DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME`
- `SESSION_SECRET=TU_SECRETO_LARGO_Y_ALEATORIO`
- `ALLOWED_ORIGINS=https://aeropuertohaider.com,https://www.aeropuertohaider.com`
- `AUTH_COOKIE_DOMAIN=.aeropuertohaider.com`
- `SESSION_COOKIE_NAME=skybridge.sid`
- `SESSION_SAME_SITE=none`
- `SESSION_SECURE=true`
- `PGSSL=true`

## 4. Desplegar backend en Railway

Servicio:

- Deploy desde el mismo repositorio
- Root service: `server`

Archivo ya preparado:

- [railway.toml](/Users/leo/Documents/skybridge-ops/railway.toml)

Variables de entorno en Railway:

- `NODE_ENV=production`
- `PORT=4000`
- `DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME`
- `SESSION_SECRET=TU_SECRETO_LARGO_Y_ALEATORIO`
- `ALLOWED_ORIGINS=https://aeropuertohaider.com,https://www.aeropuertohaider.com`
- `AUTH_COOKIE_DOMAIN=.aeropuertohaider.com`
- `SESSION_COOKIE_NAME=skybridge.sid`
- `SESSION_SAME_SITE=none`
- `SESSION_SECURE=true`
- `PGSSL=true`

## 5. Dominio real `aeropuertohaider.com`

Configuracion recomendada:

- Dominio principal:
  - `aeropuertohaider.com` -> Vercel
- Subdominio:
  - `www.aeropuertohaider.com` -> Vercel
- API:
  - `api.aeropuertohaider.com` -> Render o Railway

### DNS sugerido

En tu proveedor DNS crea:

1. Registro `A`
- Host: `@`
- Value: `76.76.21.21`

2. Registro `CNAME`
- Host: `www`
- Value: `cname.vercel-dns.com`

3. Registro para la API
- Si usas Render:
  - crea el custom domain `api.aeropuertohaider.com` dentro de Render
  - Render te mostrara el `CNAME` exacto que debes poner
- Si usas Railway:
  - crea el custom domain `api.aeropuertohaider.com` dentro de Railway
  - Railway te mostrara el `CNAME` exacto que debes poner

## 6. Orden exacto para dejarlo funcionando

1. Despliega el backend primero en Render o Railway.
2. Crea la base de datos PostgreSQL gestionada.
3. Configura todas las variables de entorno del backend.
4. Comprueba que `https://TU-BACKEND/health` responde.
5. Asigna `api.aeropuertohaider.com` al backend.
6. Despliega el frontend en Vercel con `VITE_API_URL=https://api.aeropuertohaider.com/api`.
7. Asigna `aeropuertohaider.com` y `www.aeropuertohaider.com` a Vercel.
8. Crea los registros DNS.
9. Espera propagacion DNS.
10. Abre:
   - `https://aeropuertohaider.com`
   - `https://aeropuertohaider.com/employee-access`
   - `https://aeropuertohaider.com/staff`

## 7. Cookies y autenticacion en produccion

La configuracion de backend ya queda preparada para eso:

- CORS por lista blanca mediante `ALLOWED_ORIGINS`
- cookies seguras con `SESSION_SECURE=true`
- compatibilidad cross-site con `SESSION_SAME_SITE=none`
- cookie compartida por subdominios con `AUTH_COOKIE_DOMAIN=.aeropuertohaider.com`

## 8. Base de datos real

Cuando `DATABASE_URL` existe:

- el backend crea una persistencia real en PostgreSQL
- el estado operativo deja de ser solo local
- los cambios de vuelos, pasajeros, check-in, equipaje, upgrades y auditoria se guardan

## 9. Credenciales demo iniciales

- `admin` / `Admin#1994`
- `checkin1` / `Counter#1994`
- `gate1` / `Gate#1994`
- `ops1` / `Ops#1994`
- `fleet1` / `Fleet#1994`

## 10. Enlaces oficiales utiles

- Vercel domains: https://vercel.com/docs/domains
- Render custom domains: https://render.com/docs/custom-domains
- Railway docs: https://docs.railway.com
