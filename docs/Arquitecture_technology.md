# BarcutX – Propuesta de Carpetas, Módulos, Tablas y Flujos

## 1. Estructura general del sistema

BarcutX se divide en 3 aplicaciones principales:

- **mobile-app**: app móvil para clientes y barberos
- **web-portal**: portal web para barberías y administración
- **backend-api**: API y lógica de negocio

También habrá servicios gestionados:
- Supabase
- Redis
- Stripe
- Google Maps

---

## 2. Estructura de carpetas propuesta

```text
BarcutX/
  apps/
    mobile-app/
    web-portal/
    backend-api/
  packages/
    shared-types/
    shared-constants/
    shared-utils/
    design-tokens/
  infra/
    docker/
    env/
    scripts/
  docs/
```

---

## 3. Estructura del proyecto móvil

```text
apps/mobile-app/
  app/
    (auth)/
    (customer)/
    (barber)/
    (shared)/
  src/
    components/
      common/
      queue/
      appointments/
      maps/
      payments/
      catalog/
    features/
      auth/
      profile/
      discovery/
      barber-shops/
      barbers/
      queue/
      appointments/
      memberships/
      payments/
      reviews/
      notifications/
      catalog/
    services/
      api/
      websocket/
      supabase/
      stripe/
      maps/
    store/
    hooks/
    theme/
    utils/
    types/
    constants/
  assets/
  app.json
  package.json
```

### Observación
La app móvil debe tener dos experiencias:
- **cliente**
- **barbero**

No necesariamente dos apps distintas. Se puede manejar por roles y navegación condicional.

---

## 4. Estructura del portal web

```text
apps/web-portal/
  src/
    app/
      login/
      onboarding/
      dashboard/
      barber-shop/
      barbers/
      services/
      appointments/
      queue/
      memberships/
      catalog/
      payouts/
      reports/
      settings/
    components/
      ui/
      forms/
      dashboard/
      queue/
      catalog/
      charts/
    features/
      auth/
      barber-shop/
      barbers/
      services/
      schedule/
      queue/
      memberships/
      billing/
      reports/
      catalog/
    lib/
      api/
      auth/
      supabase/
      stripe/
      utils/
    hooks/
    types/
    constants/
    styles/
  public/
  package.json
```

### Portal web principal para barberos
Aquí viven:
- configuración del negocio
- carga de catálogos
- servicios y precios
- horarios
- personal
- dashboard
- reportes
- gestión de Stripe Connect

---

## 5. Estructura del backend

```text
apps/backend-api/
  app/
    main.py
    core/
      config.py
      security.py
      database.py
      redis.py
      websocket_manager.py
      logging.py
    api/
      v1/
        routes/
          auth.py
          users.py
          barber_shops.py
          barbers.py
          services.py
          appointments.py
          queue.py
          memberships.py
          payments.py
          catalogs.py
          reviews.py
          notifications.py
          reports.py
    modules/
      auth/
      users/
      barber_shops/
      barbers/
      services/
      appointments/
      queue/
      memberships/
      payments/
      payouts/
      catalogs/
      reviews/
      notifications/
      reports/
      geo/
    schemas/
    models/
    repositories/
    services/
    workers/
    integrations/
      supabase/
      stripe/
      google_maps/
      push/
    tests/
  alembic/
  requirements.txt
  Dockerfile
```

---

## 6. Módulos backend propuestos

## Auth
Responsable de:
- login
- registro
- validación de JWT
- resolución de roles
- permisos básicos

## Users
Responsable de:
- perfil de usuario
- datos básicos
- preferencias
- historial

## Barber Shops
Responsable de:
- barberías
- sedes
- dirección
- estado
- configuración

## Barbers
Responsable de:
- perfil del barbero
- especialidades
- disponibilidad
- portafolio
- métricas

## Services
Responsable de:
- catálogo de servicios
- precios
- duración base
- servicios activos/inactivos

## Appointments
Responsable de:
- citas programadas
- reprogramaciones
- cancelaciones
- recordatorios

## Queue
Responsable de:
- cola virtual
- personas delante
- prioridad
- estado del turno
- ETA
- eventos en vivo

## Memberships
Responsable de:
- planes
- beneficios
- consumo mensual
- prioridad
- elegibilidad de cerquillos ilimitados

## Payments
Responsable de:
- depósitos
- cobros
- reembolsos
- intents de pago
- conciliación con Stripe

## Payouts
Responsable de:
- transferencias a barberías
- balance por negocio
- comisiones de plataforma

## Catalogs
Responsable de:
- ropa
- bebidas
- comida
- grooming products
- promociones

## Reviews
Responsable de:
- reseñas
- calificaciones
- reputación de barbería y barbero

## Notifications
Responsable de:
- push
- correo
- avisos operativos
- cambios en cola y cita

## Reports
Responsable de:
- dashboard básico
- ingresos
- ocupación
- tiempos promedio
- no-shows

## Geo
Responsable de:
- geocodificación
- distancias
- búsquedas cercanas
- ranking geográfico

---

## 7. Tablas principales propuestas

## users
Guarda:
- id
- auth_id
- first_name
- last_name
- email
- phone
- avatar_url
- role
- status
- created_at
- updated_at

## user_roles
Guarda:
- id
- user_id
- role_name

## barber_shops
Guarda:
- id
- owner_user_id
- name
- slug
- description
- phone
- email
- address
- city
- country
- latitude
- longitude
- logo_url
- cover_url
- is_active
- created_at
- updated_at

## barber_shop_settings
Guarda:
- id
- barber_shop_id
- opening_hours_json
- queue_enabled
- appointments_enabled
- membership_enabled
- deposit_required
- default_currency
- timezone

## barbers
Guarda:
- id
- barber_shop_id
- user_id nullable
- display_name
- bio
- specialization
- average_service_minutes
- is_active
- created_at

## barber_portfolio_items
Guarda:
- id
- barber_id
- title
- description
- image_url
- style_tag
- created_at

## services
Guarda:
- id
- barber_shop_id
- barber_id nullable
- name
- description
- price
- duration_minutes
- category
- is_active

## appointments
Guarda:
- id
- barber_shop_id
- barber_id
- user_id
- service_id
- status
- scheduled_start
- scheduled_end
- estimated_minutes
- notes
- payment_status
- source
- created_at

## queue_entries
Guarda:
- id
- barber_shop_id
- barber_id nullable
- user_id
- service_id
- status
- queue_position
- people_ahead
- priority_score
- estimated_duration_minutes
- eta_at_join
- current_eta
- joined_at
- accepted_at
- started_at
- finished_at
- source

## membership_plans
Guarda:
- id
- barber_shop_id nullable
- name
- description
- monthly_price
- included_cuts
- unlimited_lineups
- priority_level
- booking_window_days
- is_active

## memberships
Guarda:
- id
- user_id
- barber_shop_id
- membership_plan_id
- stripe_subscription_id
- status
- current_period_start
- current_period_end
- remaining_cuts
- created_at

## payments
Guarda:
- id
- user_id
- barber_shop_id
- appointment_id nullable
- queue_entry_id nullable
- membership_id nullable
- stripe_payment_intent_id
- stripe_charge_id
- amount
- currency
- payment_type
- status
- created_at

## payouts
Guarda:
- id
- barber_shop_id
- stripe_transfer_id
- gross_amount
- platform_fee
- net_amount
- status
- created_at

## catalogs
Guarda:
- id
- barber_shop_id
- name
- description
- category
- is_active

## catalog_items
Guarda:
- id
- catalog_id
- name
- description
- price
- image_url
- stock
- is_active

## reviews
Guarda:
- id
- barber_shop_id
- barber_id nullable
- user_id
- rating
- comment
- created_at

## notifications
Guarda:
- id
- user_id
- type
- title
- body
- channel
- status
- payload_json
- created_at

## audit_logs
Guarda:
- id
- actor_user_id
- entity_name
- entity_id
- action
- payload_json
- created_at

---

## 8. Flujo principal de autenticación

### Cliente
1. el usuario se registra o inicia sesión
2. Supabase Auth valida identidad
3. FastAPI recibe el JWT
4. FastAPI valida rol y permisos
5. se devuelve perfil y contexto de uso

### Barbero o dueño
1. se registra
2. completa onboarding
3. crea barbería o se vincula a una
4. configura Stripe Connect
5. activa servicios, horarios y personal

---

## 9. Flujo principal de descubrimiento

1. el usuario abre la app
2. se obtiene ubicación
3. se consultan barberías cercanas
4. se ordena por:
   - distancia
   - rating
   - ETA
   - disponibilidad
5. el usuario entra al detalle de barbería
6. ve servicios, precios, cola y barberos

---

## 10. Flujo de cola virtual

1. el usuario elige barbería
2. elige servicio
3. opcionalmente elige barbero
4. la app muestra:
   - personas delante
   - ETA estimado
   - depósito requerido
5. el usuario confirma
6. se realiza pago o preautorización si aplica
7. FastAPI crea queue_entry
8. Redis actualiza estado efímero
9. WebSocket emite actualización
10. el usuario recibe cambios de ETA en tiempo real
11. cuando faltan pocas personas:
   - se envía push “sal ahora”
12. el barbero acepta / inicia / finaliza
13. se actualiza historial y métricas

---

## 11. Flujo de cita programada

1. el usuario entra al perfil de barbería
2. selecciona servicio y barbero
3. selecciona fecha y hora
4. se valida disponibilidad
5. se requiere depósito si aplica
6. se crea appointment
7. se envían confirmaciones
8. antes de la cita se envían recordatorios
9. al llegar, la cita puede:
   - entrar directa al flujo de atención
   - convertirse en queue_entry interna si el negocio opera de forma híbrida

---

## 12. Flujo de membresía

1. el usuario ve planes disponibles
2. selecciona plan
3. paga con Stripe Billing
4. se crea membership
5. se asignan beneficios:
   - cortes incluidos
   - prioridad
   - cerquillo ilimitado
   - ventana de reserva ampliada
6. cuando entra a cola o agenda:
   - el sistema calcula prioridad
   - valida cortes restantes si aplica

---

## 13. Flujo del portal web para barberos

1. el dueño inicia sesión
2. entra al dashboard
3. configura barbería:
   - perfil
   - dirección
   - horarios
   - métodos de operación
4. configura personal
5. configura servicios
6. sube catálogo
7. conecta Stripe
8. monitorea:
   - cola
   - agenda
   - ingresos
   - reseñas
   - membresías

---

## 14. Flujo de ETA

1. se crea una entrada en cola
2. el sistema calcula ETA base usando:
   - duración del servicio
   - duración promedio del barbero
   - personas delante
   - retraso acumulado
   - prioridad
3. se guarda current_eta
4. cada cambio de estado dispara recomputación
5. se empuja al cliente por WebSocket y/o push
6. el ETA se ajusta durante toda la espera

---

## 15. Reglas arquitectónicas recomendadas

- usar arquitectura modular desde el inicio
- no comenzar con microservicios
- separar claramente dominio, integraciones y transporte
- mantener la lógica de cola en backend y no en cliente
- usar Supabase como plataforma de datos, no como reemplazo total de la lógica
- usar Redis para coordinación rápida
- usar Stripe webhooks como fuente de verdad para estados de pago
- registrar auditoría de acciones clave
- diseñar desde el inicio para soportar múltiples barberías

---

## 16. Siguiente nivel después del MVP

Después del MVP se puede agregar:
- analytics avanzados
- recomendación por estilo
- búsqueda por portafolio
- precios dinámicos
- motor predictivo más avanzado
- franquicias multi-sucursal
- campañas y fidelización avanzada
