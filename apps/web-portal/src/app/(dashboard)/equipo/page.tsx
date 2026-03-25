'use client'

import { useState } from 'react'
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { BarberRow } from '@/components/team/BarberRow'
import { InvitationRow } from '@/components/team/InvitationRow'
import { JoinRequestCard } from '@/components/team/JoinRequestCard'
import { InviteBarberModal } from '@/components/team/InviteBarberModal'
import {
  useShopBarbers,
  useInvitations,
  useJoinRequests,
  useInviteBarber,
  useRemoveBarber,
  useResendInvitation,
  useCancelInvitation,
  useApproveRequest,
  useRejectRequest,
} from '@/hooks/useTeam'

// TODO: replace with real shop ID from auth context
const DEMO_SHOP_ID = 'demo'

type ActiveTab = 'barbers' | 'invitations' | 'requests'

// ---------------------------------------------------------------------------
// Tab: Active barbers
// ---------------------------------------------------------------------------

function BarbersTab({ shopId }: { shopId: string }) {
  const { data: barbers, isLoading, isError } = useShopBarbers(shopId)
  const removeMutation = useRemoveBarber(shopId)

  async function handleRemove(barberId: string) {
    try {
      await removeMutation.mutateAsync(barberId)
    } catch {
      // error accessible via removeMutation.isError
    }
  }

  if (isLoading) {
    return <p className="text-sm text-[#9CA3AF]">Cargando barberos...</p>
  }

  if (isError) {
    return (
      <p className="text-sm text-red-400">
        Error al cargar los barberos. Verifica la conexion con el servidor.
      </p>
    )
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Barbero</TableHeader>
          <TableHeader>Rol</TableHeader>
          <TableHeader>Estado</TableHeader>
          <TableHeader>Clientes hoy</TableHeader>
          <TableHeader>Ingresos hoy</TableHeader>
          <TableHeader>Incorporacion</TableHeader>
          <TableHeader>Acciones</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {(!barbers || barbers.length === 0) && (
          <TableRow>
            <TableCell className="text-center text-[#9CA3AF]" colSpan={7}>
              No hay barberos activos en tu barberia.
            </TableCell>
          </TableRow>
        )}
        {barbers?.map((barber) => (
          <BarberRow
            key={barber.id}
            barber={barber}
            onRemove={handleRemove}
            isRemoving={
              removeMutation.isPending &&
              removeMutation.variables === barber.id
            }
          />
        ))}
      </TableBody>
    </Table>
  )
}

// ---------------------------------------------------------------------------
// Tab: Invitations
// ---------------------------------------------------------------------------

function InvitationsTab({ shopId }: { shopId: string }) {
  const { data: invitations, isLoading, isError } = useInvitations(shopId)
  const resendMutation = useResendInvitation(shopId)
  const cancelMutation = useCancelInvitation(shopId)

  async function handleResend(invitationId: string) {
    try {
      await resendMutation.mutateAsync(invitationId)
    } catch {
      // error accessible via resendMutation.isError
    }
  }

  async function handleCancel(invitationId: string) {
    try {
      await cancelMutation.mutateAsync(invitationId)
    } catch {
      // error accessible via cancelMutation.isError
    }
  }

  if (isLoading) {
    return <p className="text-sm text-[#9CA3AF]">Cargando invitaciones...</p>
  }

  if (isError) {
    return (
      <p className="text-sm text-red-400">
        Error al cargar las invitaciones. Verifica la conexion con el servidor.
      </p>
    )
  }

  if (!invitations || invitations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-[#9CA3AF] text-sm">No has enviado invitaciones aun.</p>
        <p className="text-[#6B7280] text-xs mt-1">
          Usa el boton "+ Invitar barbero" para enviar una invitacion.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Email</TableHeader>
          <TableHeader>Estado</TableHeader>
          <TableHeader>Fecha de envio</TableHeader>
          <TableHeader>Tiempo restante</TableHeader>
          <TableHeader>Acciones</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {invitations.map((invitation) => (
          <InvitationRow
            key={invitation.id}
            invitation={invitation}
            onResend={handleResend}
            onCancel={handleCancel}
            isResending={
              resendMutation.isPending &&
              resendMutation.variables === invitation.id
            }
            isCancelling={
              cancelMutation.isPending &&
              cancelMutation.variables === invitation.id
            }
          />
        ))}
      </TableBody>
    </Table>
  )
}

// ---------------------------------------------------------------------------
// Tab: Join requests
// ---------------------------------------------------------------------------

function JoinRequestsTab({ shopId }: { shopId: string }) {
  const { data: requests, isLoading, isError } = useJoinRequests(shopId)
  const approveMutation = useApproveRequest(shopId)
  const rejectMutation = useRejectRequest(shopId)

  async function handleApprove(requestId: string) {
    try {
      await approveMutation.mutateAsync(requestId)
    } catch {
      // error accessible via approveMutation.isError
    }
  }

  async function handleReject(requestId: string) {
    try {
      await rejectMutation.mutateAsync(requestId)
    } catch {
      // error accessible via rejectMutation.isError
    }
  }

  if (isLoading) {
    return <p className="text-sm text-[#9CA3AF]">Cargando solicitudes...</p>
  }

  if (isError) {
    return (
      <p className="text-sm text-red-400">
        Error al cargar las solicitudes. Verifica la conexion con el servidor.
      </p>
    )
  }

  const pendingRequests = requests?.filter((r) => r.status === 'pending') ?? []

  if (pendingRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-[#9CA3AF] text-sm">No hay solicitudes pendientes.</p>
        <p className="text-[#6B7280] text-xs mt-1">
          Las solicitudes de barberos que quieran unirse apareceran aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {pendingRequests.map((request) => (
        <JoinRequestCard
          key={request.id}
          request={request}
          onApprove={handleApprove}
          onReject={handleReject}
          isApproving={
            approveMutation.isPending &&
            approveMutation.variables === request.id
          }
          isRejecting={
            rejectMutation.isPending &&
            rejectMutation.variables === request.id
          }
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EquipoPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('barbers')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  const { data: requests } = useJoinRequests(DEMO_SHOP_ID)
  const inviteMutation = useInviteBarber(DEMO_SHOP_ID)

  const pendingRequestCount =
    requests?.filter((r) => r.status === 'pending').length ?? 0

  async function handleInviteSubmit(email: string, message?: string) {
    await inviteMutation.mutateAsync({ email, message })
  }

  const tabs: Array<{ id: ActiveTab; label: string; badge?: number }> = [
    { id: 'barbers', label: 'Barberos activos' },
    { id: 'invitations', label: 'Invitaciones' },
    {
      id: 'requests',
      label: 'Solicitudes',
      badge: pendingRequestCount > 0 ? pendingRequestCount : undefined,
    },
  ]

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Gestion de equipo
            </h1>
            <p className="mt-1 text-sm text-[#9CA3AF]">
              Administra los barberos, invitaciones y solicitudes de tu barberia
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsInviteModalOpen(true)}
          >
            + Invitar barbero
          </Button>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Secciones de equipo"
          className="flex items-center gap-1 border-b border-border"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                'border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-[#9CA3AF] hover:text-white',
              ].join(' ')}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 px-1.5 text-xs font-semibold text-primary">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div
          id="panel-barbers"
          role="tabpanel"
          aria-labelledby="tab-barbers"
          hidden={activeTab !== 'barbers'}
        >
          {activeTab === 'barbers' && <BarbersTab shopId={DEMO_SHOP_ID} />}
        </div>

        <div
          id="panel-invitations"
          role="tabpanel"
          aria-labelledby="tab-invitations"
          hidden={activeTab !== 'invitations'}
        >
          {activeTab === 'invitations' && (
            <InvitationsTab shopId={DEMO_SHOP_ID} />
          )}
        </div>

        <div
          id="panel-requests"
          role="tabpanel"
          aria-labelledby="tab-requests"
          hidden={activeTab !== 'requests'}
        >
          {activeTab === 'requests' && (
            <JoinRequestsTab shopId={DEMO_SHOP_ID} />
          )}
        </div>
      </div>

      {/* Invite modal */}
      <InviteBarberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSubmit={handleInviteSubmit}
        isSubmitting={inviteMutation.isPending}
      />
    </>
  )
}
