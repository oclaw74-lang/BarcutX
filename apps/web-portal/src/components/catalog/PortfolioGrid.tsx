'use client'

import { useState } from 'react'
import { useDeletePortfolioItem } from '@/hooks/useCatalog'
import type { PortfolioItem } from '@/types/catalog'

export interface PortfolioGridProps {
  barberId: string
  items: PortfolioItem[]
  onUpload: () => void
}

interface PortfolioItemTileProps {
  barberId: string
  item: PortfolioItem
}

function PortfolioItemTile({ barberId, item }: PortfolioItemTileProps) {
  const [isHovered, setIsHovered] = useState(false)
  const deleteMutation = useDeletePortfolioItem(barberId)

  async function handleDelete() {
    if (!confirm('Eliminar esta foto del portafolio?')) return
    try {
      await deleteMutation.mutateAsync(item.id)
    } catch {
      // error visible via deleteMutation.isError
    }
  }

  return (
    <div
      className="group relative aspect-square overflow-hidden rounded-lg border border-[#2E2E2E] bg-[#2A2A2A]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="portfolio-item"
    >
      <img
        src={item.imageUrl}
        alt={item.caption ?? 'Foto del portafolio'}
        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
      />

      {/* Hover overlay */}
      {isHovered && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 p-2">
          {item.caption && (
            <p className="line-clamp-2 text-center text-xs text-white">
              {item.caption}
            </p>
          )}
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleteMutation.isPending}
            className="rounded bg-red-700/80 px-3 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="Eliminar foto"
          >
            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      )}

      {deleteMutation.isError && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-900/80 px-2 py-1">
          <p className="text-center text-xs text-red-300">Error al eliminar</p>
        </div>
      )}
    </div>
  )
}

/**
 * PortfolioGrid — 3-column grid of portfolio photos.
 *
 * The last cell is always the "+ Subir foto" button.
 * Items are sorted by the `order` field.
 *
 * Props:
 * - barberId: owner barber ID (for delete mutations)
 * - items: portfolio items (unsorted OK, sorted internally)
 * - onUpload: callback to open the upload modal
 */
export function PortfolioGrid({ barberId, items, onUpload }: PortfolioGridProps) {
  const sortedItems = [...items].sort((a, b) => a.order - b.order)

  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      data-testid="portfolio-grid"
    >
      {sortedItems.map((item) => (
        <PortfolioItemTile key={item.id} barberId={barberId} item={item} />
      ))}

      {/* Upload button — always last */}
      <button
        type="button"
        onClick={onUpload}
        className={[
          'aspect-square rounded-lg border-2 border-dashed border-[#2E2E2E]',
          'flex flex-col items-center justify-center gap-2',
          'text-[#9CA3AF] transition-colors hover:border-[#D97706] hover:text-[#D97706]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]',
        ].join(' ')}
        aria-label="Subir nueva foto al portafolio"
        data-testid="portfolio-upload-button"
      >
        <span className="text-2xl leading-none" aria-hidden>
          +
        </span>
        <span className="text-xs font-medium">Subir foto</span>
      </button>
    </div>
  )
}
