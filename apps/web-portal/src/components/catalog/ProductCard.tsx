'use client'

import { useUpdateProduct, useDeleteProduct } from '@/hooks/useCatalog'
import type { Product } from '@/types/catalog'

export interface ProductCardProps {
  barberId: string
  product: Product
  onEdit: (product: Product) => void
}

function Toggle({
  checked,
  onChange,
  isLoading,
}: {
  checked: boolean
  onChange: () => void
  isLoading: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={isLoading}
      className={[
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full',
        'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-[#D97706] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C1C1C]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        checked ? 'bg-[#D97706]' : 'bg-[#2A2A2A]',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-4' : 'translate-x-0.5',
        ].join(' ')}
      />
    </button>
  )
}

/**
 * ProductCard — displays a single product with photo, details, and actions.
 *
 * Props:
 * - barberId: ID of the owning barber (used for mutations)
 * - product: Product data to display
 * - onEdit: callback invoked when the user opens the edit modal
 */
export function ProductCard({ barberId, product, onEdit }: ProductCardProps) {
  const updateMutation = useUpdateProduct(barberId, product.id)
  const deleteMutation = useDeleteProduct(barberId)

  async function handleToggle() {
    try {
      await updateMutation.mutateAsync({ isActive: !product.isActive })
    } catch {
      // error visible via updateMutation.isError
    }
  }

  async function handleDelete() {
    if (!confirm(`Eliminar "${product.name}"? Esta accion no se puede deshacer.`)) return
    try {
      await deleteMutation.mutateAsync(product.id)
    } catch {
      // error visible via deleteMutation.isError
    }
  }

  const isActionPending = updateMutation.isPending || deleteMutation.isPending

  return (
    <div
      className="flex flex-col rounded-lg border border-[#2E2E2E] bg-[#1C1C1C] overflow-hidden"
      data-testid="product-card"
    >
      {/* Product image */}
      <div className="relative h-36 w-full bg-[#2A2A2A]">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-3xl text-[#4B4B4B]" aria-hidden>
              📦
            </span>
          </div>
        )}

        {/* Active badge overlay */}
        <div className="absolute top-2 right-2">
          <span
            className={[
              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
              product.isActive
                ? 'bg-emerald-900/80 text-emerald-400'
                : 'bg-[#1C1C1C]/80 text-[#9CA3AF]',
            ].join(' ')}
          >
            {product.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="truncate text-sm font-semibold text-white">{product.name}</p>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#D97706]">
            {product.price.toFixed(2)} EUR
          </span>
          <span
            className={[
              'text-xs',
              product.stock <= 0 ? 'text-red-400' : 'text-[#9CA3AF]',
            ].join(' ')}
          >
            Stock: {product.stock}
          </span>
        </div>

        {/* Actions row */}
        <div className="mt-1 flex items-center justify-between">
          <Toggle
            checked={product.isActive}
            onChange={() => void handleToggle()}
            isLoading={isActionPending}
          />

          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onEdit(product)}
              disabled={isActionPending}
              className="rounded px-2 py-1 text-xs text-[#9CA3AF] hover:bg-[#2A2A2A] hover:text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D97706]"
              aria-label={`Editar ${product.name}`}
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isActionPending}
              className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-900/20 hover:text-red-300 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
              aria-label={`Eliminar ${product.name}`}
            >
              Eliminar
            </button>
          </div>
        </div>

        {(updateMutation.isError || deleteMutation.isError) && (
          <p className="text-xs text-red-400">
            Error al actualizar el producto. Intenta de nuevo.
          </p>
        )}
      </div>
    </div>
  )
}
