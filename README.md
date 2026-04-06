# Aeropuerto Haider / Plataforma Operativa Aeroportuaria

Plataforma web profesional en español para aeropuerto y aerolínea, construida sobre el proyecto actual y ampliada para cubrir:

- portal público corporativo
- área privada de clientes
- portal privado de empleados
- reservas, check-in y embarque
- equipaje, documentos y vista previa de impresión
- mensajería, incidencias y auditoría
- multiaerolínea y control operativo
- simulación viva con datos ricos

## Estado actual

El sistema queda preparado para:

- frontend desplegable en Vercel
- backend desplegable en Render o Railway
- persistencia real en PostgreSQL cuando `DATABASE_URL` sea PostgreSQL
- persistencia local en archivo JSON durante desarrollo si no hay PostgreSQL

## Arquitectura

- Frontend:
  - React + TypeScript + Vite
- Backend:
  - Express + TypeScript
- Persistencia:
  - PostgreSQL si `DATABASE_URL` empieza por `postgres://` o `postgresql://`
  - fichero local `server/data/app-state.json` en desarrollo sin base externa
- Impresión:
  - servicio de impresión con vista previa térmica y A4 operativa
  - QR de tarjeta de embarque
  - código de barras visual 1D simulado en la interfaz

## Mejoras profundas aplicadas en esta evolución

- validación de entrada con `zod` en autenticación, clientes, check-in, embarque, equipaje, upgrades y mensajería
- regeneración de sesión tras login de empleado y cliente
- endurecimiento del acceso con cabeceras de seguridad y bloqueo de navegación interna hasta cambiar contraseña
- control adicional por intentos fallidos para accesos de empleado y cliente
- caché y limpieza automática de caché en el frontend para evitar datos obsoletos tras mutaciones
- separación de componentes visuales reutilizables del cliente para reducir fragilidad del frontend
- vista documental más seria con QR, patrón de barras, resguardo de maletas y bloques térmicos
- histórico de impresión ampliado para equipaje y tarjetas
- modo desarrollo más estable: el `watch` del backend ya ignora `server/data` y evita reinicios por persistencia local

## Módulos públicos

- Inicio corporativo
- Estado de vuelos
- Destinos
- Servicios
- Noticias
- Avisos operativos
- Preguntas frecuentes
- Acceso elegante para clientes
- Acceso separado para empleados

## Módulos de clientes

- Registro
- Inicio de sesión
- Área privada
- Búsqueda de vuelos
- Reserva de vuelos
- Próximos vuelos
- Historial de vuelos
- Check-in online
- Tarjeta de embarque digital
- QR y código de barras
- Mensajes del sistema

## Módulos internos de empleados

- Dashboard operativo
- Vuelos
- Detalle de vuelo
- Pasajeros
- Check-in
- Embarque
- Equipaje
- Upgrades y sobreventa
- Incidencias
- Mensajería interna
- Clientes
- Flota
- Auditoría
- Ajustes

## Seguridad

- roles ampliados
- permisos por perfil
- auditoría de acciones
- historial de accesos
- bloqueo temporal por intentos fallidos
- obligación de cambio de contraseña en primer acceso para empleados
- usuario administrativo especial `Leo Lafragueta`

## Usuario administrativo especial

Se crea realmente en el sistema:

- Usuario: `Leo Lafragueta`
- Contraseña inicial: `Leo_012345678901`

Importante:

- no se muestra en la interfaz pública
- en el primer inicio de sesión se fuerza el cambio de contraseña

## Usuarios demo adicionales

- `helena.admin` / `Admin#1994`
- `mostrador.01` / `Counter#1994`
- `puerta.a12` / `Gate#1994`
- `ops.control` / `Ops#1994`
- `flota.01` / `Fleet#1994`
- `cliente.01` / `Service#1994`

## Variables de entorno

Frontend:

- [client/.env.example](/Users/leo/Documents/skybridge-ops/client/.env.example)
- [client/.env.production.example](/Users/leo/Documents/skybridge-ops/client/.env.production.example)

Backend:

- [server/.env.example](/Users/leo/Documents/skybridge-ops/server/.env.example)
- [server/.env.production.example](/Users/leo/Documents/skybridge-ops/server/.env.production.example)

## Desarrollo local

```bash
cd /Users/leo/Documents/skybridge-ops
npm install
npm run dev --workspace server
npm run dev --workspace client
```

Frontend local:

- `http://127.0.0.1:5173`

Backend local:

- `http://127.0.0.1:4000/api`

## Producción

```bash
cd /Users/leo/Documents/skybridge-ops
npm run build --workspace server
npm run build --workspace client
```

Guía exacta de despliegue:

- [DEPLOYMENT.md](/Users/leo/Documents/skybridge-ops/DEPLOYMENT.md)

## Documentación adicional

- Despliegue: [DEPLOYMENT.md](/Users/leo/Documents/skybridge-ops/DEPLOYMENT.md)
- Configuración Vercel: [client/vercel.json](/Users/leo/Documents/skybridge-ops/client/vercel.json)
- Render: [render.yaml](/Users/leo/Documents/skybridge-ops/render.yaml)
- Railway: [railway.toml](/Users/leo/Documents/skybridge-ops/railway.toml)

## Impresión

Actualmente queda implementado:

- tarjeta de embarque con QR
- código de barras visual
- resguardo de equipaje con vista previa
- vista previa térmica
- bloque A4 operativo
- historial de impresión
- preparación para flujo térmico ESC/POS

Queda preparado para ampliar a:

- etiquetas completas de maleta
- PDF A4 descargable
- manifiestos operativos más complejos
- integración con impresoras físicas y drivers específicos

## Limitaciones conocidas

- El sistema sigue usando una capa de simulación rica y no una integración con GDS real ni sistemas DCS reales.
- El código de barras visual es una representación operativa web, no un encoder certificado IATA BCBP.
- La impresión física real queda preparada pero no validada con hardware final.

## Validaciones realizadas

- frontend compila
- backend compila
- portal público responde
- login de clientes funciona
- registro de clientes funciona
- acceso de empleados funciona
- el usuario `Leo Lafragueta` funciona
- el cambio obligatorio de contraseña funciona
- la reserva de vuelos funciona
- el check-in online funciona
- la tarjeta de embarque con QR funciona
- el código de barras visual se genera
- la vista previa de impresión funciona
- vuelos cargan
- pasajeros cargan
- check-in de mostrador funciona
- equipaje funciona
- embarque funciona
- auditoría registra acciones
- la restricción por permisos funciona
- la simulación viva responde
