'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useBarberPublicProfile, useBarberPortfolio, useSendInvitation } from '@/hooks/useTalent'
import { AUTH_TOKEN_KEY } from '@/lib/api'
import type { SendInvitationPayload } from '@/types/talent'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AVATAR_PLACEHOLDER =
  'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=200&q=80'

// Hardcoded shop id resolved from localStorage/context.
// In a real implementation this would come from an auth context / shop store.
const DEMO_SHOP_ID = 'demo'

// ---------------------------------------------------------------------------
// Invitation Modal
// ---------------------------------------------------------------------------

interface InvitationModalProps {
  barberName: string
  shopId: string
  barberId: string
  onClose: () => void
}

function InvitationModal({
  barberName,
  shopId,
  barberId,
  onClose,
}: InvitationModalProps) {
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const sendInvitation = useSendInvitation(shopId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: SendInvitationPayload = { barberId, message: message.trim() || undefined }
    try {
      await sendInvitation.mutateAsync(payload)
      setSuccess(true)
    } catch {
      // error surface handled below via isError
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invitation-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-xl border border-white/15 bg-[#171A21] p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between">
          <h2
            id="invitation-modal-title"
            className="text-lg font-semibold text-white"
          >
            Invitar a mi barberia
          </h2>
          <button
            type="button"
            aria-label="Cerrar modal de invitacion"
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="text-3xl">✓</span>
            <p className="text-white">
              Invitacion enviada a{' '}
              <span className="font-semibold text-[#D97706]">{barberName}</span>
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-lg bg-[#D97706] px-6 py-2 text-sm font-medium text-white hover:bg-[#B45309]"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-[#9CA3AF]">
              Enviaras una invitacion a{' '}
              <span className="font-medium text-white">{barberName}</span> para
              unirse a tu barberia.
            </p>

            <div>
              <label
                htmlFor="invitation-message"
                className="mb-1.5 block text-xs font-medium text-[#9CA3AF]"
              >
                Mensaje opcional
              </label>
              <textarea
                id="invitation-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Cuentale sobre tu barberia..."
                className="w-full resize-none rounded-lg border border-white/15 bg-[#0F1115] px-4 py-2.5 text-sm text-white placeholder-[#4B5563] focus:border-[#D97706] focus:outline-none focus:ring-1 focus:ring-[#D97706]"
              />
            </div>

            {sendInvitation.isError && (
              <p role="alert" className="text-xs text-red-400">
                Error al enviar la invitacion. Intenta de nuevo.
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-white/20 px-4 py-2 text-sm text-[#9CA3AF] hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={sendInvitation.isPending}
                className="flex-1 rounded-lg bg-[#D97706] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#B45309] disabled:opacity-60"
              >
                {sendInvitation.isPending ? 'Enviando...' : 'Invitar a mi barberia'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ProfileSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
        <div className="h-28 w-28 rounded-full bg-white/10" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-48 rounded bg-white/10" />
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="h-4 w-24 rounded bg-white/10" />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BarberProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [showInviteModal, setShowInviteModal] = useState(false)

  const {
    data: barber,
    isLoading: isLoadingProfile,
    isError: isErrorProfile,
  } = useBarberPublicProfile(id)

  const {
    data: portfolio,
    isLoading: isLoadingPortfolio,
  } = useBarberPortfolio(id)

  // Determine if the current user is an authenticated owner.
  // We rely on the presence of the auth token in localStorage as a simple
  // signal; a proper auth context would be the production approach.
  const isOwner =
    typeof window !== 'undefined' &&
    !!localStorage.getItem(AUTH_TOKEN_KEY)

  return (
    <div className="min-h-screen bg-[#0F1115]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0F1115]/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link
            href="/"
            className="font-display text-xl font-bold text-[#D97706]"
          >
            BarcutX
          </Link>
          <span className="text-white/30">/</span>
          <Link
            href="/talento"
            className="text-sm text-[#9CA3AF] hover:text-white"
          >
            Talento
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {isErrorProfile && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            No se pudo cargar el perfil del barbero.
          </div>
        )}

        {isLoadingProfile && <ProfileSkeleton />}

        {!isLoadingProfile && barber && (
          <div className="flex flex-col gap-10">
            {/* Profile header */}
            <section aria-label="Perfil del barbero">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
                <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-[#D97706]/50">
                  <Image
                    src={barber.avatarUrl ?? AVATAR_PLACEHOLDER}
                    alt={`Avatar de ${barber.name}`}
                    fill
                    className="object-cover"
                    sizes="112px"
                    priority
                  />
                </div>

                <div className="flex-1">
                  <h1 className="font-display text-3xl font-bold text-white">
                    {barber.name}
                  </h1>
                  <p className="mt-1 text-[#D97706]">{barber.specialty}</p>
                  <p className="mt-0.5 text-sm text-[#9CA3AF]">{barber.city}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {barber.isAvailable && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1 text-xs font-medium text-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                        Disponible
                      </span>
                    )}
                    <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-[#9CA3AF]">
                      {barber.availabilityType}
                    </span>
                  </div>

                  {barber.bio && (
                    <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#9CA3AF]">
                      {barber.bio}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Portfolio */}
            <section aria-label="Portfolio del barbero">
              <h2 className="mb-4 font-display text-xl font-semibold text-white">
                Portfolio
              </h2>
              {isLoadingPortfolio && (
                <div
                  className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
                  aria-hidden="true"
                >
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg bg-white/10 animate-pulse"
                    />
                  ))}
                </div>
              )}
              {!isLoadingPortfolio && portfolio && portfolio.length === 0 && (
                <p className="text-sm text-[#9CA3AF]">
                  Este barbero aun no ha subido fotos a su portfolio.
                </p>
              )}
              {!isLoadingPortfolio && portfolio && portfolio.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {portfolio.map((item) => (
                    <div
                      key={item.id}
                      className="relative aspect-square overflow-hidden rounded-lg"
                    >
                      <Image
                        src={item.imageUrl}
                        alt={item.caption ?? `Trabajo de ${barber.name}`}
                        fill
                        className="object-cover transition-transform hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Contact section: only for authenticated owners */}
            {isOwner && (
              <section
                aria-label="Contactar con el barbero"
                className="rounded-xl border border-[#D97706]/30 bg-[#D97706]/5 p-6"
              >
                <h2 className="mb-2 font-display text-lg font-semibold text-white">
                  Contactar
                </h2>
                <p className="mb-4 text-sm text-[#9CA3AF]">
                  Invita a este barbero a unirse a tu barberia directamente
                  desde aqui.
                </p>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="rounded-lg bg-[#D97706] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#B45309] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]"
                >
                  Invitar a mi barberia
                </button>
              </section>
            )}
          </div>
        )}
      </main>

      {showInviteModal && barber && (
        <InvitationModal
          barberName={barber.name}
          shopId={DEMO_SHOP_ID}
          barberId={barber.id}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  )
}
