'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/Table'
import {
  useAppointments,
  useUpdateAppointmentStatus,
} from '@/hooks/useAppointments'
import type { Appointment, AppointmentStatus } from '@barcutx/shared-types'

// TODO: replace with real shop ID from auth context
const DEMO_SHOP_ID = 'demo'

const STATUS_OPTIONS: Array<{ value: AppointmentStatus | 'all'; label: string }> =
  [
    { value: 'all', label: 'Todas' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'confirmed', label: 'Confirmada' },
    { value: 'in_progress', label: 'En progreso' },
    { value: 'completed', label: 'Completada' },
    { value: 'cancelled', label: 'Cancelada' },
    { value: 'no_show', label: 'No presentado' },
  ]

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

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface AppointmentActionsProps {
  shopId: string
  appointment: Appointment
}

function AppointmentActions({ shopId, appointment }: AppointmentActionsProps) {
  const updateMutation = useUpdateAppointmentStatus(shopId)

  async function handleStatusChange(status: AppointmentStatus) {
    try {
      await updateMutation.mutateAsync({
        appointmentId: appointment.id,
        status,
      })
    } catch {
      // error accessible via updateMutation.isError
    }
  }

  const isPending = appointment.status === 'pending'
  const isConfirmed = appointment.status === 'confirmed'
  const isActive = isPending || isConfirmed

  if (!isActive) return <span className="text-xs text-[#6B7280]">—</span>

  return (
    <div className="flex items-center gap-2">
      {isPending && (
        <Button
          size="sm"
          variant="primary"
          isLoading={updateMutation.isPending}
          onClick={() => handleStatusChange('confirmed')}
        >
          Confirmar
        </Button>
      )}
      <Button
        size="sm"
        variant="danger"
        isLoading={updateMutation.isPending}
        onClick={() => handleStatusChange('cancelled')}
      >
        Cancelar
      </Button>
    </div>
  )
}

export default function AppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>(
    'all',
  )

  const activeFilter =
    statusFilter === 'all' ? undefined : { status: statusFilter }

  const { data: appointments, isLoading, isError } = useAppointments(
    DEMO_SHOP_ID,
    activeFilter,
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Reservas</h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          Gestiona las citas de tu barberia
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtro por estado">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatusFilter(opt.value)}
            className={[
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              statusFilter === opt.value
                ? 'bg-primary text-white'
                : 'bg-white/10 text-[#9CA3AF] hover:bg-white/20 hover:text-white',
            ].join(' ')}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <p className="text-sm text-[#9CA3AF]">Cargando reservas...</p>
      )}

      {isError && (
        <p className="text-sm text-red-400">
          Error al cargar las reservas. Verifica la conexion con el servidor.
        </p>
      )}

      {!isLoading && appointments && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>ID</TableHeader>
              <TableHeader>Fecha y hora</TableHeader>
              <TableHeader>Duracion</TableHeader>
              <TableHeader>Estado de pago</TableHeader>
              <TableHeader>Estado</TableHeader>
              <TableHeader>Acciones</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.length === 0 && (
              <TableRow>
                <TableCell
                  className="text-center text-[#9CA3AF]"
                  colSpan={6}
                >
                  No hay reservas con este filtro.
                </TableCell>
              </TableRow>
            )}
            {appointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell className="font-mono text-xs text-[#9CA3AF]">
                  #{appointment.id.slice(0, 8)}
                </TableCell>
                <TableCell>
                  {formatDateTime(appointment.scheduledStart)}
                </TableCell>
                <TableCell>{appointment.estimatedMinutes} min</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      appointment.paymentStatus === 'paid'
                        ? 'success'
                        : appointment.paymentStatus === 'failed'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {appointment.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[appointment.status]}>
                    {STATUS_OPTIONS.find((o) => o.value === appointment.status)
                      ?.label ?? appointment.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <AppointmentActions
                    shopId={DEMO_SHOP_ID}
                    appointment={appointment}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
