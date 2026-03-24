# BarcutX — Architecture Decision Record (ADR)

> Documento de decisiones de arquitectura para el MVP.
> Fecha: 2026-03-23
> Estado: **Aprobado** — decisiones finalizadas 2026-03-23

---

## 1. Validación del Stack

### 1.1 Stack confirmado

| Componente | Tecnología | Veredicto |
|---|---|---|
| App móvil | React Native + Expo + TypeScript | **Confirmado**. Expo SDK 52+ con New Architecture. Una sola app con navegación condicional por rol (cliente/barbero). |
| Portal web | Next.js 14+ (App Router) + TypeScript + Tailwind CSS + shadcn/ui | **Confirmado**. App Router con Server Components para el dashboard. |
| Backend | Python 3.12+ + FastAPI | **Confirmado**. Async nativo, WebSockets nativo, ideal para el motor de cola. |
| Base de datos | Supabase (PostgreSQL 15+, Auth, Storage, Realtime) | **Confirmado con restricción** (ver sección 1.2). |
| Cache/Realtime | Redis 7+ | **Confirmado**. Upstash Redis para producción. |
| Pagos | Stripe Connect (Standard) + Stripe Billing | **Confirmado con decisión pendiente** (ver sección 5). |
| Mapas | Google Maps Platform | **Confirmado**. Maps SDK for React Native + Places API + Geocoding API. |
| Infra | Docker (dev), Vercel (web), Railway (backend) | **Confirmado**. Railway sobre Render por mejor soporte de WebSockets persistentes y Redis addon nativo. |

### 1.2 Restricción crítica sobre Supabase

Supabase Auth es el **único punto de autenticación**. Sin embargo, **toda la lógica de negocio pasa por FastAPI**.

- Los clientes autentican contra Supabase Auth directamente.
- El JWT de Supabase se envía como `Authorization: Bearer <token>` a FastAPI.
- FastAPI valida el JWT contra la clave pública de Supabase (JWKS).
- **No se usa Supabase Realtime para la cola** — se usa FastAPI WebSockets + Redis. Supabase Realtime queda reservado para sincronización secundaria ligera.
- **No se usa Row Level Security como barrera principal** — la autorización vive en FastAPI. RLS es defensa en profundidad.

Razón: si la lógica de negocio depende de RLS policies, la migración futura a otro proveedor se vuelve extremadamente costosa.

---

## 2. Decisiones de Arquitectura Críticas

### 2.1 Monorepo Setup

**Decisión: pnpm workspaces + Turborepo**

```
BarcutX/
  apps/
    mobile-app/        # pnpm workspace — React Native + Expo
    web-portal/        # pnpm workspace — Next.js
    backend-api/       # Python — pyproject.toml con uv (NO es workspace JS)
  packages/
    shared-types/      # pnpm workspace — TypeScript types compartidos
    shared-constants/  # pnpm workspace
    shared-utils/      # pnpm workspace
    design-tokens/     # pnpm workspace
  infra/
    docker/
    env/
    scripts/
  docs/
  turbo.json
  pnpm-workspace.yaml
  .python-version
```

`pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/mobile-app"
  - "apps/web-portal"
  - "packages/*"
```

El backend Python está completamente aislado del monorepo JS. Turborepo solo orquesta tareas JS/TS.

### 2.2 Estrategia de Autenticación

**Flujo:**
1. Cliente se autentica en Supabase Auth (email, phone, OAuth).
2. Supabase devuelve JWT (access_token + refresh_token).
3. Cliente envía `Authorization: Bearer <JWT>` a FastAPI.
4. FastAPI valida JWT con JWKS de Supabase.
5. FastAPI extrae `user_id` (claim `sub`), consulta roles en DB.
6. FastAPI aplica RBAC y devuelve la respuesta.

**Roles (RBAC):**
- `customer` — cliente final
- `barber` — barbero operativo
- `shop_owner` — dueño de barbería
- `platform_admin` — administrador de BarcutX

El cliente usa `supabase.auth.refreshSession()` directamente. FastAPI solo valida access tokens.

### 2.3 WebSocket Manager

**Decisión: FastAPI WebSockets + Redis Pub/Sub como backbone**

```
FastAPI Instance 1          FastAPI Instance 2
  [WS Connections]            [WS Connections]
  [WSManager] ─────────────────────────────── [WSManager]
       │                                            │
       └──────────────── Redis Pub/Sub ─────────────┘
```

**Canales Redis Pub/Sub:**
- `queue:{barber_shop_id}` — actualizaciones de cola (posición, ETA, estado)
- `shop:{barber_shop_id}:status` — cambios de estado de barbería

**Formato de evento WebSocket:**
```json
{
  "type": "queue_update",
  "shop_id": "uuid",
  "data": {
    "queue_length": 5,
    "your_position": 3,
    "your_eta_minutes": 24,
    "entries": [...]
  },
  "timestamp": "2026-03-23T14:30:00Z"
}
```

### 2.4 Estrategia Redis para la Cola

Redis es la **capa de coordinación rápida**; PostgreSQL es la **fuente de verdad**.

| Key | Tipo | Contenido | TTL |
|---|---|---|---|
| `queue:{shop_id}:active` | Sorted Set | `member=entry_id, score=priority_score` | Sin TTL |
| `queue:{shop_id}:eta` | Hash | `field=entry_id, value=eta_iso` | Sin TTL |
| `queue:{shop_id}:lock:{entry_id}` | String | `"processing"` | 30s (distributed lock) |
| `queue:{shop_id}:stats` | Hash | `length, avg_wait, last_updated` | 5 min |
| `barber:{barber_id}:current` | String | `entry_id` o `null` | Sin TTL |

**Flujo de escritura:**
1. FastAPI valida permisos y pago.
2. FastAPI escribe `queue_entries` en PostgreSQL.
3. FastAPI escribe en Redis Sorted Set con priority_score.
4. FastAPI publica evento via Redis Pub/Sub.
5. WebSocket manager entrega actualización a todos los clientes conectados.

### 2.5 Modelo Stripe Connect

**Decisión: Stripe Connect Standard**

- Cada barbería tiene su propia cuenta Stripe (Connected Account).
- Onboarding hosted por Stripe (menor fricción).
- BarcutX cobra `application_fee` por transacción.
- Los pagos van directo a la cuenta de la barbería; Stripe deduce la fee.

**Flujo de depósito (cola):**
1. Cliente confirma turno → FastAPI crea `PaymentIntent` con `application_fee_amount` y `capture_method: "manual"`.
2. Si el cliente es atendido → FastAPI captura el pago.
3. Si cancela dentro del período → FastAPI cancela el PaymentIntent.
4. Webhook `payment_intent.succeeded` confirma estado.

---

## 3. Orden de Construcción del MVP

### Fase 0: Foundation (Semana 1-2)

- Monorepo setup (pnpm + Turborepo)
- Backend scaffolding (FastAPI + pyproject.toml + uv + alembic)
- Supabase project (dev + staging)
- Docker Compose local (PostgreSQL, Redis, FastAPI)
- CI básico (GitHub Actions: lint + typecheck + test)
- Shared packages scaffold
- `.env.example` documentado

**Entregable:** `pnpm install && docker compose up` levanta el entorno completo.

### Fase 1: Auth + Users + Barbershop CRUD (Semana 3-5)

- Supabase Auth (email + phone)
- FastAPI JWT middleware + RBAC
- Módulos: `auth`, `users`, `barber_shops`, `barbers`, `services`
- CRUD completo desde portal web
- Onboarding de dueño de barbería
- Mobile: login/registro + navegación por rol

**Entregable:** Un dueño puede crear su barbería con servicios. Un cliente puede registrarse y ver barberías.

### Fase 2: Discovery + Maps (Semana 6-7)

- Módulo `geo`: geocodificación + búsqueda por proximidad (PostGIS)
- Mobile: mapa + lista de barberías cercanas + detalle
- Cache de barberías en Redis (TTL 5 min)

**Entregable:** Un cliente ve barberías en el mapa y accede al detalle con servicios y precios.

### Fase 3: Cola Virtual — El Diferenciador (Semana 8-11)

- Módulo `queue`: lógica completa, ETA, prioridad
- WebSocket manager + Redis Pub/Sub
- Mobile (cliente): entrar a la cola → ver posición → recibir notificación
- Mobile (barbero): gestionar cola (aceptar/iniciar/finalizar)
- Web portal: vista en tiempo real de la cola
- Push notifications (Expo Notifications)

**Entregable:** El flujo completo de cola funciona end-to-end en tiempo real.

### Fase 4: Pagos Básicos (Semana 12-14)

- Stripe Connect onboarding desde portal web
- Depósito para entrar a la cola (PaymentIntent con capture manual)
- Webhook handler (`/api/v1/webhooks/stripe`)
- Mobile: flujo de pago con `@stripe/stripe-react-native`

**Entregable:** Una barbería cobra depósito por turno. BarcutX cobra su fee. Flujo end-to-end funcional.

### Post-MVP (fuera de scope pero diseñado para soportarlo)

- Membresías y Stripe Billing
- Catálogo de productos
- Reviews y reputación
- Reportes y analytics
- Citas programadas (híbrido con cola)

---

## 4. Riesgos Técnicos Críticos

### R1: Consistencia de la cola bajo concurrencia

**Problema:** Dos usuarios toman la misma posición, o dos barberos aceptan el mismo turno.

**Mitigación:**
- Distributed locks en Redis (`SET key value NX EX 30`).
- `SELECT ... FOR UPDATE` en PostgreSQL como segunda barrera.
- Tests de concurrencia obligatorios antes del lanzamiento.

**Severidad:** Crítica.

### R2: WebSocket reliability en mobile

**Problema:** Conexiones móviles inestables → el cliente no recibe actualizaciones.

**Mitigación:**
- Reconnection automática con backoff exponencial.
- Al reconectar, GET del estado actual (REST como fallback).
- Push notifications como canal redundante para eventos críticos.
- Heartbeat cada 30s desde el servidor.

**Severidad:** Alta.

### R3: Cálculo de ETA impreciso

**Problema:** Si el ETA miente, los usuarios pierden confianza.

**Mitigación:**
- MVP: `ETA = SUM(duración_estimada[i]) / barberos_activos`.
- Trackear `started_at` y `finished_at` para calibrar `average_service_minutes`.
- Mostrar rango ("15-25 min") en lugar de número exacto.
- Recalcular en cada cambio de estado.

**Severidad:** Alta. El ETA ES el producto.

### R4: Stripe Connect onboarding friction

**Problema:** KYC de Stripe puede hacer que barberías pequeñas abandonen el onboarding.

**Mitigación:**
- Permitir cola gratuita (sin pagos) hasta que la barbería conecte Stripe.
- Guía paso a paso en el portal web.
- Monitorear tasa de abandono de onboarding.

**Severidad:** Media-Alta.

### R5: Complejidad del monorepo Python + JS

**Problema:** CI, linting y dependencias mezcladas.

**Mitigación:**
- Backend Python completamente aislado del monorepo JS.
- GitHub Actions con jobs separados: uno para JS/TS (Turborepo), otro para Python (uv + pytest).
- Docker Compose maneja ambos mundos en desarrollo.

**Severidad:** Media.

---

## 5. Decisiones Finales

| # | Decisión | Elección | Razón |
|---|---|---|---|
| 5.1 | ORM en FastAPI | **SQLAlchemy 2.0 async + Alembic** | Más maduro, migraciones robustas |
| 5.2 | Stripe Connect tier | **Standard** | Menos trabajo de implementación, la barbería gestiona sus propios payouts |
| 5.3 | Geo queries | **PostGIS directo** | Sin acoplamiento a Supabase client |
| 5.4 | Redis en producción | **Upstash Redis** | Free tier 10k req/day, luego $0.20/100k req — costo mínimo |
| 5.5 | Modelo de pricing BarcutX | **Fee por transacción %** | Sin costo fijo para la barbería — BarcutX cobra solo cuando hay cobros. Escala con el negocio. |

## 6. Estimación de Costo en Producción (MVP)

Infraestructura con **costo mínimo** para el lanzamiento:

| Servicio | Plan | Costo/mes |
|---|---|---|
| Supabase | Free (500MB DB, 1GB storage, 50k MAU) | $0 |
| Vercel (web portal) | Hobby | $0 |
| Railway (backend FastAPI) | Starter ($5 crédito/mes incluido) | ~$0-5 |
| Upstash Redis | Free (10k req/day) | $0 |
| Google Maps | $200 crédito mensual gratuito | $0 |
| Stripe | Sin costo fijo — cobra % por transacción | $0 fijo |
| **Total fijo** | | **$0-5/mes** |

Cuando el tráfico crece:
- Supabase Pro: $25/mes (más storage y conexiones)
- Railway: ~$10-20/mes según uso de CPU/RAM
- Upstash: escala por requests (Pay as you go)

---

## 6. Criterios de Aceptación del MVP

El MVP está listo cuando:

1. Un cliente puede descubrir una barbería, entrar a la cola, ver su posición en tiempo real y ser atendido.
2. El cambio de posición en la cola se refleja en **menos de 2 segundos** en todos los clientes conectados.
3. El flujo depósito → servicio → cobro → fee de plataforma funciona end-to-end con Stripe.
4. Mínimo 80% de coverage en módulos `queue`, `payments`, `auth`.
5. JWT validation + RBAC en cada endpoint. Rate limiting en endpoints públicos. Stripe webhook signature verification.
6. Structured logging (JSON). Audit logs para acciones críticas. Health check (`/health`).
7. Pipeline CI/CD funcional. Rollback en menos de 5 minutos.

---

## Apéndice: Dependencias Clave

### Backend (Python)
```
fastapi>=0.115
uvicorn[standard]
sqlalchemy[asyncio]>=2.0
asyncpg
alembic
pydantic>=2.0
pydantic-settings
python-jose[cryptography]
redis[hiredis]>=5.0
stripe>=8.0
httpx
pytest
pytest-asyncio
```

### Mobile (React Native)
```
expo ~52
expo-router
@supabase/supabase-js
@stripe/stripe-react-native
react-native-maps
expo-notifications
expo-location
zustand
```

### Web Portal (Next.js)
```
next >=14
react >=18
tailwindcss
@supabase/supabase-js
@supabase/ssr
@stripe/stripe-js
shadcn/ui
zustand
recharts
```
