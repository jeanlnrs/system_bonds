# system_bonds

Portal web para que los clientes consulten sus bonos corporativos: resumen de cartera, detalle de cada bono, calendario de pagos trimestrales y gestión de la cuenta.

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite, React Router, lucide-react |
| Backend | Node.js + Express 5, JWT, bcrypt |
| Base de datos | PostgreSQL (Supabase) — todo el acceso a datos va por stored procedures |

```
database/   01_schema.sql · 02_procedures.sql · 03_seed.sql (datos ficticios)
backend/    API REST; cada endpoint llama a un sp_*
frontend/   SPA en React
```

## Puesta en marcha

```bash
npm run install:all
```

### Base de datos (Supabase)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. **Connect → Session pooler** y copia la URI.
3. Copia `backend/.env.example` a `backend/.env` y completa `DATABASE_URL` y `JWT_SECRET`.
4. Crea tablas, SPs y datos de prueba (borra y recrea las tablas):

```bash
npm run db:setup
```

> Sin `DATABASE_URL` el backend arranca con una base PostgreSQL en memoria (PGlite) cargada con los mismos scripts; útil para desarrollo sin conexión.

### Ejecutar

En dos terminales:

```bash
npm run dev:api   # http://localhost:4000
npm run dev:web   # http://localhost:5173
```

Cuentas de prueba (contraseña `Demo1234!`): `lucia@demo.com`, `carlos@demo.com`, `ana@demo.com`.

## Despliegue en Vercel

El repositorio se publica como un solo proyecto: el frontend como sitio estático y el backend como función serverless (`api/index.js`, que reutiliza `backend/src/app.js`). La configuración está en `vercel.json`.

1. En [vercel.com](https://vercel.com): **Add New → Project** e importa este repositorio (Root Directory: la raíz).
2. En **Environment Variables** agrega `DATABASE_URL` y `JWT_SECRET` (los mismos valores de `backend/.env`).
3. **Deploy**.

Las funciones corren en `iad1` (Washington D.C.), la misma zona que la base de Supabase (`us-east-1`).

## Stored procedures

| SP | Uso |
|---|---|
| `sp_obtener_credenciales(correo)` | Login: id y hash de contraseña |
| `sp_obtener_cliente(id)` | Perfil del cliente |
| `sp_resumen_cartera(cliente)` | Totales de la cartera: invertido, cobrado, pendiente, próximo pago |
| `sp_listar_bonos(cliente)` | Bonos del cliente con avance de pagos |
| `sp_detalle_bono(cliente, bono)` | Ficha completa (solo si el bono es del cliente) |
| `sp_calendario_pagos(cliente, bono)` | Cupones trimestrales y amortización, con estado Pagado/Pendiente |
| `sp_actualizar_correo(cliente, correo)` | Cambio de correo (valida formato y duplicados) |
| `sp_obtener_hash_cliente(cliente)` / `sp_actualizar_contrasena(cliente, hash)` | Cambio de contraseña |

En PostgreSQL los procedimientos que devuelven filas se implementan como `FUNCTION ... RETURNS TABLE`. Los cupones se pagan al cierre de cada trimestre (31-mar, 30-jun, 30-set, 31-dic) y se generan a partir de las fechas de emisión y vencimiento; un pago figura como *Pagado* cuando su fecha ya pasó.

## API

| Método | Ruta | Auth |
|---|---|---|
| POST | `/api/auth/login` | — |
| GET | `/api/cuenta` | JWT |
| PUT | `/api/cuenta/correo` | JWT |
| PUT | `/api/cuenta/contrasena` | JWT |
| GET | `/api/cartera/resumen` | JWT |
| GET | `/api/cartera/bonos` | JWT |
| GET | `/api/cartera/bonos/:id` | JWT |
