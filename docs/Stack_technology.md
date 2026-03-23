# BarcutX – Stack Tecnológico Recomendado

## Decisión principal

BarcutX tendrá:

- **App móvil** para clientes y barberos
- **Portal web** para barberos y administración
- **Backend central** con lógica de negocio
- **Base de datos y servicios gestionados**
- **Tiempo real** para cola, ETA y cambios de estado
- **Pagos** para depósitos, membresías y cobros de plataforma

La app móvil **también debe funcionar para barberos**, pero el **portal web** será la superficie principal para configurar la barbería, administrar catálogos, horarios, servicios, equipos y revisar reportes.

---

## Stack final recomendado

### 1. App móvil
**React Native + Expo + TypeScript**

Usos:
- app de clientes
- app de barberos
- búsqueda de barberías
- cola virtual
- citas
- pagos
- notificaciones
- gestión operativa rápida del barbero desde el celular

### Por qué
- una sola base para iOS y Android
- buena velocidad de desarrollo
- ecosistema maduro
- buena integración con mapas, notificaciones y Stripe
- mejor encaje que Flutter para convivir con un portal web moderno en React/Next.js

---

### 2. Portal web
**Next.js + TypeScript + Tailwind CSS + shadcn/ui**

Usos:
- onboarding de barberías
- gestión de servicios
- gestión de precios
- configuración de horarios
- administración de barberos
- carga de catálogos
- gestión de productos
- revisión de agenda y cola
- dashboard y reportes
- onboarding de Stripe Connect

### Por qué
- excelente para paneles web modernos
- muy buena experiencia para CRUD, dashboards y catálogos
- más flexible que intentar resolver la web con React Native Web
- ideal para escritorio y tablets dentro del negocio

---

### 3. Backend
**Python + FastAPI**

Usos:
- API principal
- lógica de negocio
- motor de cola
- cálculo de ETA
- reglas de membresía
- integración con Stripe
- webhooks
- validaciones críticas
- autorizaciones
- tiempo real vía WebSockets

### Por qué
- rápido de desarrollar
- muy buen rendimiento para APIs
- excelente DX
- WebSockets nativo
- ideal para encapsular la lógica crítica del negocio

---

### 4. Base de datos y BaaS
**Supabase**

Servicios usados:
- PostgreSQL
- Auth
- Storage
- Realtime
- Row Level Security

### Por qué
- PostgreSQL sólido y flexible
- autenticación lista
- storage para imágenes, portafolios y catálogos
- realtime para sincronización secundaria
- seguridad por políticas
- acelera bastante el MVP

---

### 5. Cache, locks y eventos efímeros
**Redis**

Usos:
- cache de barberías cercanas
- locks para evitar doble reserva
- estado efímero de cola
- rate limiting
- eventos rápidos
- soporte para recalcular ETA

### Por qué
- reduce carga a la base
- ayuda en operaciones de alta concurrencia
- útil para colas, tiempos y coordinación

---

### 6. Pagos
**Stripe Connect + Stripe Billing**

Usos:
- depósitos
- prepago de turnos
- cobro de comisión de plataforma
- suscripciones
- payouts a barberías
- onboarding de barberías para cobros

### Por qué
- encaja perfecto con modelo marketplace
- permite connected accounts
- soporta membresías y cobros recurrentes
- muy buena documentación y escalabilidad

---

### 7. Mapas y geolocalización
**Google Maps Platform**

Usos:
- búsqueda de barberías cercanas
- cálculo de distancia
- geocodificación de direcciones
- sugerencia de ruta
- visualización en mapa

---

### 8. Archivos y media
**Supabase Storage**

Usos:
- fotos de barberías
- fotos de cortes
- catálogos
- logos
- imágenes promocionales

---

### 9. Notificaciones
**Expo Notifications**
y, según necesidad:
- FCM
- APNs
- correo transaccional

Usos:
- “faltan 2 personas”
- “sal ahora”
- recordatorios de cita
- confirmación de pago
- avisos de membresía

---

### 10. Despliegue e infraestructura
**Frontend web**
- Vercel

**Backend**
- Render, Railway o Fly.io al inicio
- Docker para empaquetado

**Servicios gestionados**
- Supabase
- Stripe
- Redis gestionado si es necesario

---

## Recomendación de diseño UI

BarcutX debe verse:
- moderno
- premium
- urbano
- rápido
- confiable

### Dirección visual sugerida
- tema oscuro premium
- fondos charcoal / graphite
- acentos cobre, naranja quemado o verde elegante
- tipografía: Inter, Sora o Manrope
- tarjetas amplias
- iconografía limpia
- fotos de cortes como elemento fuerte de la experiencia

### Estados visuales sugeridos
- verde: disponibilidad inmediata
- ámbar: espera media
- rojo: espera larga
- cobre / morado: prioridad o membresía premium

---

## Cómo se reparte la responsabilidad técnica

### React Native
Maneja:
- experiencia móvil del cliente
- experiencia móvil del barbero
- cola en vivo
- citas
- reservas
- pagos
- notificaciones

### Next.js
Maneja:
- administración web
- formularios y paneles
- catálogos
- reportes
- onboarding y configuración empresarial

### FastAPI
Maneja:
- lógica del dominio
- motor de cola
- ETA
- Stripe
- seguridad de negocio
- orquestación

### Supabase
Maneja:
- persistencia principal
- auth
- storage
- realtime complementario

### Redis
Maneja:
- cache
- locks
- eventos temporales
- coordinación rápida

---

## Recomendación final

### Stack oficial recomendado para BarcutX

**Móvil**
- React Native
- Expo
- TypeScript

**Web**
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

**Backend**
- Python
- FastAPI

**Datos**
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime

**Tiempo real**
- FastAPI WebSockets
- Redis

**Pagos**
- Stripe Connect
- Stripe Billing

**Mapas**
- Google Maps Platform

**Infra**
- Docker
- Vercel
- Render/Railway/Fly
