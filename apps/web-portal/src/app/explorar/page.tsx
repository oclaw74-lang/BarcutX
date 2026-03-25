'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui'
import { Badge } from '@/components/ui'
import { useSearchShops, useNearbyShops } from '@/hooks/useExplore'
import type { ShopSearchResult, ShopNearbyResult } from '@/hooks/useExplore'

// ---- Constants --------------------------------------------------------------

const PLACEHOLDER_COVER =
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80'

// ---- Sub-components ---------------------------------------------------------

interface ShopCardProps {
  id: string
  name: string
  city: string
  address: string | null
  logo_url: string | null
  is_open?: boolean
  distance_km?: number
  slug: string | null
}

function ShopCard({
  id,
  name,
  city,
  address,
  logo_url,
  is_open,
  distance_km,
  slug,
}: ShopCardProps) {
  const href = slug ? `/barberia/${slug}` : `/barberia/${id}`

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-primary/60"
      data-testid="shop-card"
    >
      {/* Cover area */}
      <div className="relative h-40 w-full overflow-hidden bg-background">
        <Image
          src={logo_url ?? PLACEHOLDER_COVER}
          alt={`Logo de ${name}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized={!logo_url}
        />
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-semibold text-white leading-tight">
            {name}
          </h3>
          {is_open !== undefined && (
            <Badge variant={is_open ? 'success' : 'danger'} className="shrink-0">
              {is_open ? 'Abierto' : 'Cerrado'}
            </Badge>
          )}
        </div>

        <p className="text-sm text-[#9CA3AF]">{city}</p>

        {address && (
          <p className="text-xs text-[#6B7280] line-clamp-1">{address}</p>
        )}

        {distance_km !== undefined && (
          <p className="text-xs font-medium text-primary">
            {distance_km < 1
              ? `${Math.round(distance_km * 1000)} m`
              : `${distance_km.toFixed(1)} km`}
          </p>
        )}
      </div>
    </Link>
  )
}

function SearchBar({
  value,
  onChange,
  onSubmit,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
}) {
  return (
    <form
      role="search"
      aria-label="Buscar barberías"
      className="flex w-full max-w-xl gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <input
        type="search"
        placeholder="Ciudad, ej: Madrid"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Ciudad"
        className="flex-1 rounded-md border border-border bg-surface px-4 py-2 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <Button type="submit" size="md">
        Buscar
      </Button>
    </form>
  )
}

function GeolocationButton({
  onLocate,
  isLocating,
}: {
  onLocate: () => void
  isLocating: boolean
}) {
  return (
    <Button
      variant="secondary"
      size="md"
      onClick={onLocate}
      isLoading={isLocating}
      aria-label="Usar mi ubicación"
    >
      Usar mi ubicacion
    </Button>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center gap-3 py-16 text-center"
      data-testid="empty-state"
    >
      <p className="text-[#9CA3AF]">{message}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Cargando barberías"
      data-testid="loading-skeleton"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-56 animate-pulse rounded-lg bg-surface"
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

// ---- Page -------------------------------------------------------------------

type SearchMode = 'idle' | 'city' | 'geo'

interface GeoCoords {
  lat: number
  lng: number
}

export default function ExplorarPage() {
  const [cityInput, setCityInput] = useState('')
  const [committedCity, setCommittedCity] = useState('')
  const [coords, setCoords] = useState<GeoCoords | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [mode, setMode] = useState<SearchMode>('idle')

  const {
    data: cityResults,
    isLoading: cityLoading,
    isError: cityError,
  } = useSearchShops(committedCity)

  const {
    data: nearbyResults,
    isLoading: nearbyLoading,
    isError: nearbyError,
  } = useNearbyShops(coords?.lat ?? 0, coords?.lng ?? 0)

  const handleCitySearch = useCallback(() => {
    if (cityInput.trim().length < 2) return
    setCommittedCity(cityInput.trim())
    setCoords(null)
    setMode('city')
  }, [cityInput])

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Tu navegador no soporta geolocalización.')
      return
    }
    setIsLocating(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setCommittedCity('')
        setMode('geo')
        setIsLocating(false)
      },
      () => {
        setGeoError('No se pudo obtener tu ubicación. Revisa los permisos.')
        setIsLocating(false)
      },
    )
  }, [])

  const isLoading = mode === 'city' ? cityLoading : mode === 'geo' ? nearbyLoading : false
  const isError = mode === 'city' ? cityError : mode === 'geo' ? nearbyError : false

  const shops: ShopCardProps[] =
    mode === 'city'
      ? (cityResults ?? []).map((s: ShopSearchResult) => ({
          id: s.id,
          name: s.name,
          city: s.city,
          address: s.address,
          logo_url: s.logo_url,
          slug: s.slug,
        }))
      : mode === 'geo'
        ? (nearbyResults ?? []).map((s: ShopNearbyResult) => ({
            id: s.id,
            name: s.name,
            city: '',
            address: s.address,
            logo_url: s.logo_url,
            is_open: s.is_open,
            distance_km: s.distance_km,
            slug: s.slug,
          }))
        : []

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-5xl space-y-10">

        {/* Hero */}
        <section className="text-center space-y-3">
          <h1 className="font-display text-4xl font-bold text-white">
            Encuentra tu barbería
          </h1>
          <p className="text-[#9CA3AF] text-lg">
            Busca por ciudad o usa tu ubicación actual
          </p>
        </section>

        {/* Search controls */}
        <section
          aria-label="Controles de búsqueda"
          className="flex flex-col items-center gap-4"
        >
          <SearchBar
            value={cityInput}
            onChange={setCityInput}
            onSubmit={handleCitySearch}
          />
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#6B7280]">o</span>
            <GeolocationButton onLocate={handleGeolocate} isLocating={isLocating} />
          </div>
          {geoError && (
            <p role="alert" className="text-sm text-red-400">
              {geoError}
            </p>
          )}
        </section>

        {/* Results */}
        <section aria-label="Resultados de búsqueda" aria-live="polite">
          {isLoading && <LoadingSkeleton />}

          {isError && (
            <p role="alert" className="text-center text-sm text-red-400">
              Ocurrió un error al cargar las barberías. Intenta de nuevo.
            </p>
          )}

          {!isLoading && !isError && mode !== 'idle' && shops.length === 0 && (
            <EmptyState message="No se encontraron barberías. Prueba con otra ciudad." />
          )}

          {!isLoading && shops.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shops.map((shop) => (
                <ShopCard key={shop.id} {...shop} />
              ))}
            </div>
          )}

          {mode === 'idle' && (
            <EmptyState message="Introduce una ciudad o usa tu ubicación para empezar." />
          )}
        </section>
      </div>
    </main>
  )
}
