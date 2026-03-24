'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  useQueue,
  useCallNextInQueue,
  useUpdateQueueEntry,
  useQueueWebSocket,
} from '@/hooks/useQueue'
import type { QueueEntry } from '@barcutx/shared-types'

// TODO: replace with real shop ID from auth context
const DEMO_SHOP_ID = 'demo'

const STATUS_VARIANT: Record<
  QueueEntry['status'],
  'warning' | 'info' | 'success' | 'muted' | 'danger'
> = {
  waiting: 'warning',
  called: 'info',
  in_progress: 'success',
  completed: 'muted',
  cancelled: 'danger',
  no_show: 'danger',
}

const STATUS_LABEL: Record<QueueEntry['status'], string> = {
  waiting: 'Esperando',
  called: 'Llamado',
  in_progress: 'En servicio',
  completed: 'Completado',
  cancelled: 'Cancelado',
  no_show: 'No presentado',
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface QueueEntryCardProps {
  entry: QueueEntry
  shopId: string
}

function QueueEntryCard({ entry, shopId }: QueueEntryCardProps) {
  const updateMutation = useUpdateQueueEntry(shopId)

  async function handleMarkServing() {
    try {
      await updateMutation.mutateAsync({ entryId: entry.id, status: 'in_progress' })
    } catch {
      // error accessible via updateMutation.isError
    }
  }

  async function handleMarkDone() {
    try {
      await updateMutation.mutateAsync({ entryId: entry.id, status: 'completed' })
    } catch {
      // error accessible via updateMutation.isError
    }
  }

  async function handleMarkNoShow() {
    try {
      await updateMutation.mutateAsync({ entryId: entry.id, status: 'no_show' })
    } catch {
      // error accessible via updateMutation.isError
    }
  }

  return (
    <Card bordered>
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-lg font-bold text-primary">
            {entry.queuePosition}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-white">
              Cliente #{entry.userId.slice(0, 8)}
            </span>
            <span className="text-xs text-[#6B7280]">
              Unio: {formatTime(entry.joinedAt)}
              {' · '}
              ETA: {entry.estimatedDurationMinutes} min
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={STATUS_VARIANT[entry.status]}>
            {STATUS_LABEL[entry.status]}
          </Badge>

          {entry.status === 'called' && (
            <Button
              size="sm"
              onClick={handleMarkServing}
              isLoading={updateMutation.isPending}
            >
              Iniciar
            </Button>
          )}
          {entry.status === 'in_progress' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleMarkDone}
              isLoading={updateMutation.isPending}
            >
              Completar
            </Button>
          )}
          {(entry.status === 'waiting' || entry.status === 'called') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleMarkNoShow}
              isLoading={updateMutation.isPending}
            >
              No vino
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function QueuePage() {
  const { data: queue, isLoading, isError } = useQueue(DEMO_SHOP_ID)
  const callNextMutation = useCallNextInQueue(DEMO_SHOP_ID)

  // Connect to real-time WebSocket updates
  useQueueWebSocket(DEMO_SHOP_ID, true)

  const activeEntries =
    queue?.filter(
      (e) =>
        e.status === 'waiting' ||
        e.status === 'called' ||
        e.status === 'in_progress',
    ) ?? []

  const waitingCount = queue?.filter((e) => e.status === 'waiting').length ?? 0

  async function handleCallNext() {
    try {
      await callNextMutation.mutateAsync()
    } catch {
      // error accessible via callNextMutation.isError
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Cola Virtual
          </h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            Gestion en tiempo real de la cola de espera
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-[#9CA3AF]">
            {waitingCount} esperando
          </span>
          <Button
            onClick={handleCallNext}
            isLoading={callNextMutation.isPending}
            disabled={waitingCount === 0 || callNextMutation.isPending}
          >
            Llamar siguiente
          </Button>
        </div>
      </div>

      {callNextMutation.isError && (
        <p className="text-sm text-red-400">
          Error al llamar al siguiente cliente.
        </p>
      )}

      {isLoading && (
        <p className="text-sm text-[#9CA3AF]">Cargando cola...</p>
      )}

      {isError && (
        <p className="text-sm text-red-400">
          Error al cargar la cola. Verifica la conexion con el servidor.
        </p>
      )}

      {!isLoading && activeEntries.length === 0 && (
        <Card bordered>
          <CardHeader>
            <CardTitle className="text-base text-[#9CA3AF]">
              Cola vacia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#6B7280]">
              No hay clientes en la cola en este momento.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {activeEntries
          .sort((a, b) => a.queuePosition - b.queuePosition)
          .map((entry) => (
            <QueueEntryCard
              key={entry.id}
              entry={entry}
              shopId={DEMO_SHOP_ID}
            />
          ))}
      </div>
    </div>
  )
}
