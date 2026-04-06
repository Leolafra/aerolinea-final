# Aeropuerto Haider / SkyBridge Atlantic Web

Web publica completa en espanol para aerolinea y aeropuerto, con portal privado de empleados y backend listo para despliegue en internet.

## Que incluye

- Web publica corporativa:
  - inicio
  - vuelos
  - informacion del aeropuerto y la aerolinea
  - servicios
  - contacto
  - boton visible `Acceso empleados`
- Portal interno privado:
  - dashboard
  - pasajeros
  - vuelos
  - check-in
  - embarque
  - maletas
  - upgrades
  - auditoria
  - ajustes
- Backend listo para produccion con:
  - CORS configurable
  - sesiones por cookie segura
  - variables de entorno para dominio real
  - persistencia en PostgreSQL cuando `DATABASE_URL` esta configurada
- Archivos de despliegue:
  - [client/vercel.json](/Users/leo/Documents/skybridge-ops/client/vercel.json)
  - [render.yaml](/Users/leo/Documents/skybridge-ops/render.yaml)
  - [railway.toml](/Users/leo/Documents/skybridge-ops/railway.toml)

## Estructura

- Frontend publico y portal: [client](/Users/leo/Documents/skybridge-ops/client)
- Backend API: [server](/Users/leo/Documents/skybridge-ops/server)
- Esquema relacional de referencia: [server/prisma/schema.prisma](/Users/leo/Documents/skybridge-ops/server/prisma/schema.prisma)
- Configuracion de despliegue: [DEPLOYMENT.md](/Users/leo/Documents/skybridge-ops/DEPLOYMENT.md)

## Variables de entorno

Frontend:

- [client/.env.example](/Users/leo/Documents/skybridge-ops/client/.env.example)
- [client/.env.production.example](/Users/leo/Documents/skybridge-ops/client/.env.production.example)

Backend:

- [server/.env.example](/Users/leo/Documents/skybridge-ops/server/.env.example)
- [server/.env.production.example](/Users/leo/Documents/skybridge-ops/server/.env.production.example)

## Desarrollo

```bash
cd /Users/leo/Documents/skybridge-ops
npm install
npm run dev --workspace server
npm run dev --workspace client
```

## Build de produccion

```bash
cd /Users/leo/Documents/skybridge-ops
npm install
npm run build --workspace server
npm run build --workspace client
```

## Credenciales demo

- `admin` / `Admin#1994`
- `checkin1` / `Counter#1994`
- `gate1` / `Gate#1994`
- `ops1` / `Ops#1994`
- `fleet1` / `Fleet#1994`

## Despliegue publico recomendado

- Frontend en Vercel
- Backend en Render o Railway
- Dominio principal:
  - `aeropuertohaider.com`
- API en subdominio:
  - `api.aeropuertohaider.com`

La guia exacta esta en [DEPLOYMENT.md](/Users/leo/Documents/skybridge-ops/DEPLOYMENT.md).
