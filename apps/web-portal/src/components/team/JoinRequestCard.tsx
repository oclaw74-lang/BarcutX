'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { JoinRequest } from '@/types/team'

interface JoinRequestCardProps {
  request: JoinRequest
  onApprove: (requestId: string) => void
  onReject: (requestId: string) => void
  isApproving?: boolean
  isRejecting?: boolean
}

function RequestAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-12 w-12 rounded-full object-cover shrink-0"
      />
    )
  }

  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary"
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * JoinRequestCard — card that displays a barber's join request.
 *
 * Props:
 * - request: JoinRequest data object
 * - onApprove: callback invoked with the request id
 * - onReject: callback invoked with the request id
 * - isApproving: loading state for approve action
 * - isRejecting: loading state for reject action
 */
export function JoinRequestCard({
  request,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
}: JoinRequestCardProps) {
  const isBusy = isApproving || isRejecting

  return (
    <Card bordered className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <RequestAvatar name={request.name} avatarUrl={request.avatarUrl} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white">{request.name}</p>
          {request.specialty && (
            <p className="text-xs text-primary mt-0.5">{request.specialty}</p>
          )}
          <p className="text-xs text-[#6B7280] mt-1">
            Solicitado el {formatDate(request.requestedAt)}
          </p>
        </div>
      </div>

      {request.message && (
        <p className="text-sm text-[#9CA3AF] border-l-2 border-border pl-3 italic">
          "{request.message}"
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button
          size="sm"
          variant="primary"
          isLoading={isApproving}
          disabled={isBusy}
          onClick={() => onApprove(request.id)}
          aria-label={`Aprobar solicitud de ${request.name}`}
          className="flex-1 bg-green-600 hover:bg-green-700 focus-visible:ring-green-600"
        >
          Aprobar
        </Button>
        <Button
          size="sm"
          variant="danger"
          isLoading={isRejecting}
          disabled={isBusy}
          onClick={() => onReject(request.id)}
          aria-label={`Rechazar solicitud de ${request.name}`}
          className="flex-1"
        >
          Rechazar
        </Button>
      </div>
    </Card>
  )
}
