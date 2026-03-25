'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useCreateBarberService } from '@/hooks/useCatalog'
import type { ServiceCategory, CreateBarberServicePayload } from '@/types/catalog'

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  haircut: 'Corte',
  beard: 'Barba',
  combo: 'Combo',
  kids: 'Ninos',
  other: 'Otro',
}

interface ServiceFormState {
  name: string
  description: string
  price: string
  durationMinutes: string
  category: ServiceCategory
}

const EMPTY_FORM: ServiceFormState = {
  name: '',
  description: '',
  price: '',
  durationMinutes: '',
  category: 'haircut',
}

export interface AddServiceModalProps {
  barberId: string
  onClose: () => void
}

/**
 * AddServiceModal — modal form for adding a custom service to a barber's catalog.
 *
 * Props:
 * - barberId: the barber creating the service
 * - onClose: callback to dismiss the modal
 */
export function AddServiceModal({ barberId, onClose }: AddServiceModalProps) {
  const [form, setForm] = useState<ServiceFormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof ServiceFormState, string>>>({})

  const createMutation = useCreateBarberService(barberId)

  function validate(): boolean {
    const next: Partial<Record<keyof ServiceFormState, string>> = {}
    if (!form.name.trim()) next.name = 'El nombre es obligatorio'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      next.price = 'Precio invalido'
    if (
      !form.durationMinutes ||
      isNaN(Number(form.durationMinutes)) ||
      Number(form.durationMinutes) <= 0
    )
      next.durationMinutes = 'Duracion invalida'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleChange(field: keyof ServiceFormState, value: string) {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const payload: CreateBarberServicePayload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price),
      durationMinutes: Number(form.durationMinutes),
      category: form.category,
    }

    try {
      await createMutation.mutateAsync(payload)
      onClose()
    } catch {
      // error shown via createMutation.isError
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-[#2E2E2E] bg-[#1C1C1C] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2
            id="service-modal-title"
            className="font-display text-lg font-semibold text-white"
          >
            Nuevo servicio
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-white focus-visible:outline-none"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nombre del servicio"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
              placeholder="Corte clasico"
              className="sm:col-span-2"
            />

            {/* Category select */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-white">
                Categoria
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  handleChange('category', e.target.value as ServiceCategory)
                }
                className="h-10 w-full rounded-md border border-[#2E2E2E] bg-[#111111] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:ring-offset-1 focus:ring-offset-[#1C1C1C]"
              >
                {(Object.entries(CATEGORY_LABELS) as [ServiceCategory, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </div>

            <Input
              label="Precio (EUR)"
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
              error={errors.price}
              placeholder="15.00"
              type="number"
              min="0"
              step="0.5"
            />

            <Input
              label="Duracion estimada (min)"
              value={form.durationMinutes}
              onChange={(e) => handleChange('durationMinutes', e.target.value)}
              error={errors.durationMinutes}
              placeholder="30"
              type="number"
              min="1"
              step="1"
            />

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-sm font-medium text-white">
                Descripcion (opcional)
              </label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descripcion del servicio..."
                rows={3}
                className="w-full rounded-md border border-[#2E2E2E] bg-[#111111] px-3 py-2 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:ring-offset-1 focus:ring-offset-[#1C1C1C]"
              />
            </div>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-red-400" role="alert">
              Error al crear el servicio. Intenta de nuevo.
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              disabled={createMutation.isPending}
              className="bg-[#D97706] text-black hover:bg-[#B45309] focus-visible:ring-[#D97706]"
            >
              Crear servicio
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
