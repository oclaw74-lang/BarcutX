# BarcutX — Project Context

> Documento de visión de producto y alcance del MVP.
> Fecha: 2026-03-23
> Estado: Activo

---

## 1. Visión del Producto

**BarcutX** elimina la mayor fricción de las barberías modernas: **la espera sin información**.

Hoy, un cliente llega a una barbería sin saber cuánto esperará, se sienta o se va a otro lugar. El barbero pierde clientes y no puede optimizar su tiempo. El dueño no tiene visibilidad real de su operación.

BarcutX resuelve esto con una **cola virtual en tiempo real** que le dice al cliente exactamente cuándo llegar, le permite pagar desde el celular, y le da al barbero y al dueño herramientas para operar eficientemente.

**Eslogan:** "Tu fade, sin fila."

---

## 2. Segmentos de Usuario

### Cliente (B2C)
- Hombre urbano, 18-40 años
- Va a la barbería cada 2-4 semanas
- Valora su tiempo y odia esperar sin información
- Usa su celular para todo

**Trabajo principal:** encontrar barbería disponible, entrar a la cola sin hacer fila física, que le avisen cuando le toca.

### Barbero
- Opera en una barbería (puede ser el dueño o empleado)
- Necesita ver su cola, gestionar turnos y comunicarse con clientes
- Trabaja desde el celular durante el día

**Trabajo principal:** gestionar su cola de trabajo eficientemente sin interrupciones.

### Dueño de Barbería (B2B)
- Tiene 1 o más sucursales
- Quiere atraer más clientes, reducir no-shows y tener visibilidad de su operación
- Usa tablet o computador desde el negocio

**Trabajo principal:** configurar su negocio, conectar pagos, monitorear la operación y crecer.

---

## 3. Propuesta de Valor Diferencial

| Problema actual | Solución BarcutX |
|---|---|
| El cliente no sabe cuánto esperar | Cola virtual con ETA en tiempo real |
| El cliente tiene que estar físicamente para guardar el turno | Cola virtual desde cualquier lugar |
| El barbero pierde tiempo anunciando turnos | Push automático "sal ahora" |
| El dueño no tiene datos de su operación | Dashboard con métricas en tiempo real |
| No-shows sin penalización | Depósito obligatorio para reservar turno |
| Clientes leales sin beneficios | Membresías con prioridad y cortes incluidos |

**Diferencial clave vs competencia:** BarcutX no es solo un agendador. El motor de cola en tiempo real con ETA dinámico es el producto central.

---

## 4. MVP Scope

### P0 — Crítico para el MVP (sin esto no hay producto)

- **Auth**: registro e inicio de sesión (cliente, barbero, dueño)
- **Barbershop CRUD**: crear y configurar barbería, barberos, servicios, horarios
- **Discovery**: buscar barberías cercanas en mapa con ETA visible
- **Cola virtual**: entrar a la cola, ver posición en tiempo real, notificación "sal ahora"
- **Gestión de cola (barbero)**: aceptar, iniciar y finalizar turno desde el móvil
- **Portal web básico**: configuración del negocio, vista de cola, servicios

### P1 — Importante para el lanzamiento

- **Pagos básicos**: depósito para entrar a la cola (Stripe Connect)
- **Push notifications**: "sal ahora", confirmaciones
- **Vista de cola en portal web**: tiempo real para el dueño
- **Perfil de barbero**: fotos, especialidades

### P2 — Post-MVP

- Citas programadas (agenda)
- Membresías y Stripe Billing
- Catálogo de productos (ropa, bebidas, grooming)
- Reviews y reputación
- Reportes y analytics avanzados
- Payouts automáticos
- Multi-sucursal avanzado
- Recomendación por estilo / portafolio

---

## 5. KPIs del MVP

### Adopción (primeros 3 meses post-lanzamiento)

| KPI | Objetivo MVP |
|---|---|
| Barberías activas (con al menos 1 cola completada) | 10 |
| Clientes registrados | 200 |
| Colas completadas totales | 500 |
| Tasa de abandono de cola | < 20% |

### Experiencia

| KPI | Objetivo |
|---|---|
| ETA accuracy (diferencia ETA estimado vs real) | ± 5 minutos |
| Latencia de actualización en cola (WebSocket) | < 2 segundos |
| Tasa de crashes mobile (Crashlytics) | < 1% de sesiones |

### Negocio

| KPI | Objetivo |
|---|---|
| Tasa de onboarding completado (barbería → cola activa) | > 60% |
| Tasa de conversión cliente → primera cola completada | > 40% |
| Retención de clientes (segunda cola en 30 días) | > 30% |

---

## 6. North Star Metric

> **Colas completadas por semana** (a nivel de plataforma)

Esta métrica captura que tanto los clientes como las barberías están usando activamente el producto. Una cola completada significa:
- Un cliente confió en BarcutX.
- Un barbero gestionó su turno en la plataforma.
- El ciclo de valor se cerró.

---

## 7. Riesgos de Producto

### R1: Adopción por parte de las barberías
Las barberías pequeñas son resistentes a cambiar sus hábitos de trabajo. Sin barberías activas no hay oferta para los clientes.

**Mitigación:** Onboarding simplificado. Cola gratuita sin pagos para reducir fricción. Valor inmediato visible (dashboard de cola).

### R2: ETA poco confiable daña la confianza del usuario
Si el ETA es impreciso, los clientes llegan tarde o esperan de todas formas. El diferencial se pierde.

**Mitigación:** Mostrar rango en lugar de número exacto. Calibrar con datos reales desde el primer día. Notificación proactiva si el ETA cambia significativamente.

### R3: Fricción en pagos (Stripe Connect KYC)
El onboarding de Stripe puede bloquear a barberías sin documentación lista.

**Mitigación:** Permitir operar sin pagos durante el piloto. Activar pagos cuando la barbería esté lista.

### R4: Retención de clientes baja
Si la experiencia en la primera cola no es excelente, los clientes no vuelven.

**Mitigación:** Onboarding guiado. Notificaciones claras. Feedback rápido post-servicio.

### R5: Competencia de WhatsApp / teléfono
Muchas barberías ya coordinan turnos por WhatsApp. El cliente percibe que "ya tiene solución".

**Mitigación:** Demostrar que BarcutX da información que WhatsApp no puede dar: ETA en vivo, posición en cola, pago integrado.

---

## 8. Stack Tecnológico (resumen)

| Capa | Tecnología |
|---|---|
| App móvil | React Native + Expo + TypeScript |
| Portal web | Next.js + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Python + FastAPI |
| Base de datos | Supabase (PostgreSQL + Auth + Storage) |
| Tiempo real | FastAPI WebSockets + Redis |
| Pagos | Stripe Connect + Stripe Billing |
| Mapas | Google Maps Platform |
| Infra | Docker (dev) + Vercel (web) + Railway (backend) |

---

## 9. Flujos Prioritarios del MVP

1. **Descubrimiento**: cliente abre app → ve barberías en mapa → ETA visible → entra al detalle
2. **Cola virtual**: cliente elige servicio → confirma → paga depósito → ve posición en tiempo real → recibe push → es atendido
3. **Gestión barbero**: barbero ve cola → acepta turno → inicia → finaliza → siguiente
4. **Onboarding dueño**: dueño se registra → crea barbería → agrega barberos y servicios → conecta Stripe → cola activa

---

## 10. Estructura del Repositorio

```
BarcutX/
  apps/
    mobile-app/      # React Native + Expo — clientes y barberos
    web-portal/      # Next.js — portal de administración
    backend-api/     # FastAPI — API central y motor de cola
  packages/
    shared-types/    # TypeScript types compartidos
    shared-constants/
    shared-utils/
    design-tokens/   # Colores, tipografías, tokens de marca
  infra/
    docker/          # docker-compose.yml y Dockerfiles
    env/             # .env.example por servicio
    scripts/         # scripts de setup y CI
  docs/              # Documentación del proyecto
```
