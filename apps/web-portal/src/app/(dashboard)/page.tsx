'use client'

import { StatsCard } from '@/components/dashboard/StatsCard'
import { useAppointments } from '@/hooks/useAppointments'
import { useQueue } from '@/hooks/useQueue'
import { useServices } from '@/hooks/useServices'
import { Badge } from '@/components/ui/Badge'
import type { AppointmentStatus } from '@barcutx/shared-types'

// TODO: replace with real shop ID from the authenticated user's context
const DEMO_SHOP_ID = 'demo'

const STATUS_VARIANT: Record<
  AppointmentStatus,
  'warning' | 'success' | 'danger' | 'muted' | 'info'
> = {
  pending: 'warning',
  confirmed: 'success',
  in_progress: 'info',
  completed: 'muted',
  cancelled: 'danger',
  no_show: 'danger',
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  in_progress: 'En progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No presentado',
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function DashboardPage() {
  const today = new Date().toISOString().split('T')[0]

  const appointmentsQuery = useAppointments(DEMO_SHOP_ID, { date: today })
  const queueQuery = useQueue(DEMO_SHOP_ID)
  const servicesQuery = useServices(DEMO_SHOP_ID)

  const totalAppointmentsToday = appointmentsQuery.data?.length ?? 0
  const clientsInQueue =
    queueQuery.data?.filter(
      (e) =>
        e.status === 'waiting' ||
        e.status === 'called' ||
        e.status === 'in_progress',
    ).length ?? 0
  const activeServices =
    servicesQuery.data?.filter((s) => s.isActive).length ?? 0

  const recentPending =
    appointmentsQuery.data?.filter((a) => a.status === 'pending').slice(0, 5) ??
    []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">
          Bienvenido a BarcutX
        </h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          Resumen de actividad de tu barberia
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Citas hoy"
          value={appointmentsQuery.isLoading ? '...' : totalAppointmentsToday}
          description="Total de citas para hoy"
        />
        <StatsCard
          title="En cola"
          value={queueQuery.isLoading ? '...' : clientsInQueue}
          description="Clientes esperando ahora"
        />
        <StatsCard
          title="Servicios activos"
          value={servicesQuery.isLoading ? '...' : activeServices}
          description="Servicios disponibles"
        />
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-white">
          Reservas pendientes
        </h2>

        {appointmentsQuery.isLoading && (
          <p className="text-sm text-[#9CA3AF]">Cargando reservas...</p>
        )}

        {appointmentsQuery.isError && (
          <p className="text-sm text-red-400">
            Error al cargar reservas. Verifica la conexion con el servidor.
          </p>
        )}

        {!appointmentsQuery.isLoading && recentPending.length === 0 && (
          <p className="text-sm text-[#9CA3AF]">
            No hay reservas pendientes para hoy.
          </p>
        )}

        {recentPending.length > 0 && (
          <ul className="flex flex-col gap-2">
            {recentPending.map((appointment) => (
              <li
                key={appointment.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-white">
                    Cita #{appointment.id.slice(0, 8)}
                  </span>
                  <span className="text-xs text-[#6B7280]">
                    {formatDateTime(appointment.scheduledStart)}
                    {' · '}
                    {appointment.estimatedMinutes} min
                  </span>
                </div>
                <Badge variant={STATUS_VARIANT[appointment.status]}>
                  {STATUS_LABEL[appointment.status]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
