'use client'

import { useState, useRef } from 'react'
import { useUpdateBarberService } from '@/hooks/useCatalog'
import type { BarberService } from '@/types/catalog'

const CATEGORY_LABELS: Record<string, string> = {
  haircut: 'Corte',
  beard: 'Barba',
  combo: 'Combo',
  kids: 'Ninos',
  other: 'Otro',
}

function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, string> = {
    haircut: '✂',
    beard: '🪒',
    combo: '⭐',
    kids: '👶',
    other: '•',
  }
  return (
    <span aria-label={CATEGORY_LABELS[category] ?? category} className="text-base">
      {icons[category] ?? '•'}
    </span>
  )
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
        'focus-visible:ring-[#D97706] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]',
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

export interface ServiceRowProps {
  barberId: string
  barberService: BarberService
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>
}

/**
 * ServiceRow — renders a single barber service row with:
 * - Drag handle
 * - Category icon
 * - Service name and duration
 * - Inline editable price
 * - Active/inactive toggle
 * - Edit button
 */
export function ServiceRow({ barberId, barberService, dragHandleProps }: ServiceRowProps) {
  const { service, customPrice, isActive, isInherited, id } = barberService

  const effectivePrice = customPrice ?? service.price

  const [isEditingPrice, setIsEditingPrice] = useState(false)
  const [priceInput, setPriceInput] = useState(String(effectivePrice))
  const priceInputRef = useRef<HTMLInputElement>(null)

  const updateMutation = useUpdateBarberService(barberId, id)

  async function handleToggle() {
    try {
      await updateMutation.mutateAsync({ isActive: !isActive })
    } catch {
      // error visible via updateMutation.isError
    }
  }

  function handlePriceClick() {
    setPriceInput(String(effectivePrice))
    setIsEditingPrice(true)
    // Focus on next tick after render
    setTimeout(() => priceInputRef.current?.select(), 0)
  }

  async function handlePriceCommit() {
    const parsed = parseFloat(priceInput)
    if (!isNaN(parsed) && parsed > 0 && parsed !== effectivePrice) {
      try {
        await updateMutation.mutateAsync({ customPrice: parsed })
      } catch {
        // error visible via updateMutation.isError
      }
    }
    setIsEditingPrice(false)
  }

  function handlePriceKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') void handlePriceCommit()
    if (e.key === 'Escape') setIsEditingPrice(false)
  }

  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-[#2E2E2E] bg-[#1C1C1C] px-4 py-3 transition-colors hover:border-[#3A3A3A]"
      data-testid="service-row"
    >
      {/* Drag handle */}
      <span
        {...dragHandleProps}
        className="cursor-grab text-[#4B4B4B] hover:text-[#9CA3AF] select-none text-lg leading-none"
        aria-label="Reordenar"
        title="Arrastra para reordenar"
      >
        &#8942;&#8942;
      </span>

      {/* Icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#2A2A2A]">
        <CategoryIcon category={service.category} />
      </div>

      {/* Name + duration */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{service.name}</p>
        <p className="text-xs text-[#9CA3AF]">
          {service.durationMinutes} min
          {isInherited && (
            <span className="ml-2 rounded bg-[#2A2A2A] px-1.5 py-0.5 text-[10px] text-[#D97706]">
              Heredado
            </span>
          )}
        </p>
      </div>

      {/* Inline price editor */}
      <div className="shrink-0">
        {isEditingPrice ? (
          <input
            ref={priceInputRef}
            type="number"
            min="0"
            step="0.5"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            onBlur={() => void handlePriceCommit()}
            onKeyDown={handlePriceKeyDown}
            className="w-20 rounded border border-[#D97706] bg-[#111111] px-2 py-1 text-right text-sm text-white focus:outline-none"
            aria-label="Precio del servicio"
          />
        ) : (
          <button
            type="button"
            onClick={handlePriceClick}
            className="rounded px-2 py-1 text-sm font-medium text-white hover:bg-[#2A2A2A] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D97706]"
            title="Click para editar el precio"
          >
            {effectivePrice.toFixed(2)} EUR
          </button>
        )}
      </div>

      {/* Active toggle */}
      <Toggle
        checked={isActive}
        onChange={() => void handleToggle()}
        isLoading={updateMutation.isPending}
      />
    </div>
  )
}
