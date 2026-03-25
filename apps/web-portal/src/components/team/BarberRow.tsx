'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TableRow, TableCell } from '@/components/ui/Table'
import type { ShopBarber } from '@/types/team'

interface BarberRowProps {
  barber: ShopBarber
  onRemove: (barberId: string) => void
  isRemoving?: boolean
}

function BarberAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
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
        className="h-8 w-8 rounded-full object-cover"
      />
    )
  }

  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary"
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * BarberRow — single row in the active barbers table.
 *
 * Props:
 * - barber: ShopBarber data object
 * - onRemove: callback invoked with the barber's id
 * - isRemoving: disables action buttons while the remove mutation is pending
 */
export function BarberRow({ barber, onRemove, isRemoving = false }: BarberRowProps) {
  const [confirmRemove, setConfirmRemove] = useState(false)

  function handleRemoveClick() {
    if (confirmRemove) {
      onRemove(barber.id)
      setConfirmRemove(false)
    } else {
      setConfirmRemove(true)
    }
  }

  function handleCancelRemove() {
    setConfirmRemove(false)
  }

  const roleLabel: Record<ShopBarber['role'], string> = {
    senior: 'Senior',
    associate: 'Asociado',
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <BarberAvatar name={barber.name} avatarUrl={barber.avatarUrl} />
          <span className="font-medium text-white">{barber.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={barber.role === 'senior' ? 'default' : 'muted'}>
          {roleLabel[barber.role]}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={barber.status === 'active' ? 'success' : 'danger'}>
          {barber.status === 'active' ? 'Activo' : 'Inactivo'}
        </Badge>
      </TableCell>
      <TableCell className="text-[#9CA3AF]">{barber.clientsToday}</TableCell>
      <TableCell className="text-[#9CA3AF]">
        {formatCurrency(barber.revenueToday)}
      </TableCell>
      <TableCell className="text-[#9CA3AF]">{formatDate(barber.joinedAt)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {confirmRemove ? (
            <>
              <Button
                size="sm"
                variant="danger"
                isLoading={isRemoving}
                onClick={handleRemoveClick}
              >
                Confirmar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={isRemoving}
                onClick={handleCancelRemove}
              >
                Cancelar
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              disabled={isRemoving}
              onClick={handleRemoveClick}
              aria-label={`Remover a ${barber.name}`}
            >
              Remover
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
