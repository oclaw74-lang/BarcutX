'use client'

import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TableRow, TableCell } from '@/components/ui/Table'
import type { BarberInvitation } from '@/types/team'

interface InvitationRowProps {
  invitation: BarberInvitation
  onResend: (invitationId: string) => void
  onCancel: (invitationId: string) => void
  isResending?: boolean
  isCancelling?: boolean
}

const STATUS_VARIANT: Record<BarberInvitation['status'], BadgeVariant> = {
  pending: 'warning',
  expired: 'muted',
  rejected: 'danger',
}

const STATUS_LABEL: Record<BarberInvitation['status'], string> = {
  pending: 'Pendiente',
  expired: 'Expirada',
  rejected: 'Rechazada',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getRemainingTime(expiresAt: string): string {
  const diffMs = new Date(expiresAt).getTime() - Date.now()

  if (diffMs <= 0) return 'Expirada'

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) return `${diffDays}d restantes`
  if (diffHours > 0) return `${diffHours}h restantes`
  return 'Menos de 1h'
}

/**
 * InvitationRow — single row in the invitations table.
 *
 * Props:
 * - invitation: BarberInvitation data object
 * - onResend: callback to resend the invitation
 * - onCancel: callback to cancel the invitation
 * - isResending: loading state for resend action
 * - isCancelling: loading state for cancel action
 */
export function InvitationRow({
  invitation,
  onResend,
  onCancel,
  isResending = false,
  isCancelling = false,
}: InvitationRowProps) {
  const canResend = invitation.status === 'pending' || invitation.status === 'expired'
  const canCancel = invitation.status === 'pending'

  return (
    <TableRow>
      <TableCell className="font-mono text-sm">{invitation.email}</TableCell>
      <TableCell>
        <Badge variant={STATUS_VARIANT[invitation.status]}>
          {STATUS_LABEL[invitation.status]}
        </Badge>
      </TableCell>
      <TableCell className="text-[#9CA3AF]">{formatDate(invitation.sentAt)}</TableCell>
      <TableCell className="text-[#9CA3AF]">
        {invitation.status === 'pending'
          ? getRemainingTime(invitation.expiresAt)
          : '—'}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {canResend && (
            <Button
              size="sm"
              variant="secondary"
              isLoading={isResending}
              disabled={isCancelling}
              onClick={() => onResend(invitation.id)}
              aria-label={`Reenviar invitacion a ${invitation.email}`}
            >
              Reenviar
            </Button>
          )}
          {canCancel && (
            <Button
              size="sm"
              variant="ghost"
              isLoading={isCancelling}
              disabled={isResending}
              onClick={() => onCancel(invitation.id)}
              aria-label={`Cancelar invitacion a ${invitation.email}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
