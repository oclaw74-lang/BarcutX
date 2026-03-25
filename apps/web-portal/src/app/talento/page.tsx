'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAvailableBarbers } from '@/hooks/useTalent'
import type { BarberSpecialty, AvailabilityType, BarberTalent } from '@/types/talent'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPECIALTIES: BarberSpecialty[] = [
  'Todos',
  'Fade',
  'Degradado',
  'Barba',
  'Diseños',
  'Coloracion',
]

const AVAILABILITY_TYPES: AvailabilityType[] = [
  'Todos',
  'Tiempo completo',
  'Medio tiempo',
  'Freelance',
]

const AVATAR_PLACEHOLDER =
  'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=200&q=80'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function BarberTalentCardSkeleton() {
  return (
    <div
      className="rounded-xl border border-white/10 bg-[#171A21] p-5 animate-pulse"
      aria-hidden="true"
    >
      <div className="mb-4 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-white/10" />
          <div className="h-3 w-1/2 rounded bg-white/10" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-1/3 rounded bg-white/10" />
        <div className="h-3 w-1/4 rounded bg-white/10" />
      </div>
    </div>
  )
}

interface BarberTalentCardProps {
  barber: BarberTalent
}

function BarberTalentCard({ barber }: BarberTalentCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#171A21] p-5 transition-colors hover:border-[#D97706]/40">
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full">
          <Image
            src={barber.avatarUrl ?? AVATAR_PLACEHOLDER}
            alt={`Avatar de ${barber.name}`}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-white">{barber.name}</h3>
          <p className="mt-0.5 truncate text-sm text-[#9CA3AF]">
            {barber.specialty}
          </p>
          <p className="mt-0.5 truncate text-sm text-[#9CA3AF]">
            {barber.city}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {barber.isAvailable && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            Disponible
          </span>
        )}
        <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-[#9CA3AF]">
          {barber.availabilityType}
        </span>
      </div>

      <Link
        href={`/talento/${barber.id}`}
        className="mt-auto block rounded-lg bg-[#D97706] px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-[#B45309] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]"
      >
        Ver perfil
      </Link>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TalentMarketplacePage() {
  const [cityInput, setCityInput] = useState('')
  const [city, setCity] = useState('')
  const [specialty, setSpecialty] = useState<BarberSpecialty>('Todos')
  const [availabilityType, setAvailabilityType] =
    useState<AvailabilityType>('Todos')

  const { data: barbers, isLoading, isError } = useAvailableBarbers({
    city,
    specialty,
    availabilityType,
  })

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setCity(cityInput)
  }

  return (
    <div className="min-h-screen bg-[#0F1115]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0F1115]/80 px-6 py-4 backdrop-blur">
        <Link
          href="/"
          className="font-display text-xl font-bold text-[#D97706]"
        >
          BarcutX
        </Link>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mb-10 text-center">
          <h1 className="font-display text-4xl font-bold text-white">
            Marketplace de Talento
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[#9CA3AF]">
            Encuentra barberos disponibles para tu barberia o descubre
            oportunidades de trabajo.
          </p>
        </section>

        {/* Filters */}
        <form
          onSubmit={handleSearch}
          className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end"
          aria-label="Filtros de busqueda de talento"
        >
          <div className="flex-1">
            <label
              htmlFor="city-input"
              className="mb-1.5 block text-xs font-medium text-[#9CA3AF]"
            >
              Ciudad
            </label>
            <input
              id="city-input"
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Ej. Madrid, Barcelona..."
              className="w-full rounded-lg border border-white/15 bg-[#171A21] px-4 py-2.5 text-sm text-white placeholder-[#4B5563] focus:border-[#D97706] focus:outline-none focus:ring-1 focus:ring-[#D97706]"
            />
          </div>

          <div className="sm:w-48">
            <label
              htmlFor="specialty-select"
              className="mb-1.5 block text-xs font-medium text-[#9CA3AF]"
            >
              Especialidad
            </label>
            <select
              id="specialty-select"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value as BarberSpecialty)}
              className="w-full rounded-lg border border-white/15 bg-[#171A21] px-4 py-2.5 text-sm text-white focus:border-[#D97706] focus:outline-none focus:ring-1 focus:ring-[#D97706]"
            >
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:w-52">
            <label
              htmlFor="availability-select"
              className="mb-1.5 block text-xs font-medium text-[#9CA3AF]"
            >
              Disponibilidad
            </label>
            <select
              id="availability-select"
              value={availabilityType}
              onChange={(e) =>
                setAvailabilityType(e.target.value as AvailabilityType)
              }
              className="w-full rounded-lg border border-white/15 bg-[#171A21] px-4 py-2.5 text-sm text-white focus:border-[#D97706] focus:outline-none focus:ring-1 focus:ring-[#D97706]"
            >
              {AVAILABILITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-[#D97706] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#B45309] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] sm:self-end"
          >
            Buscar
          </button>
        </form>

        {/* Grid */}
        {isError && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            Error al cargar los barberos. Intenta de nuevo.
          </div>
        )}

        {isLoading && (
          <div
            aria-busy="true"
            aria-label="Cargando barberos disponibles"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <BarberTalentCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && !isError && barbers && barbers.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <span className="text-4xl">🔍</span>
            <p className="text-[#9CA3AF]">
              No se encontraron barberos con los filtros aplicados.
            </p>
          </div>
        )}

        {!isLoading && !isError && barbers && barbers.length > 0 && (
          <div
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            aria-label={`${barbers.length} barberos encontrados`}
          >
            {barbers.map((barber) => (
              <BarberTalentCard key={barber.id} barber={barber} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
