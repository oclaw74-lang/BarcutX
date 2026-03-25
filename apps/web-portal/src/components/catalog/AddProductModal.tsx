'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useCreateProduct, useUpdateProduct } from '@/hooks/useCatalog'
import type {
  Product,
  ProductCategory,
  CreateProductPayload,
} from '@/types/catalog'

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  wax: 'Cera',
  shampoo: 'Shampoo',
  conditioner: 'Acondicionador',
  oil: 'Aceite',
  razor: 'Navaja / Maquinilla',
  other: 'Otro',
}

interface ProductFormState {
  name: string
  description: string
  price: string
  stock: string
  category: ProductCategory
  imageUrl: string
}

const EMPTY_FORM: ProductFormState = {
  name: '',
  description: '',
  price: '',
  stock: '',
  category: 'other',
  imageUrl: '',
}

function formFromProduct(product: Product): ProductFormState {
  return {
    name: product.name,
    description: product.description ?? '',
    price: String(product.price),
    stock: String(product.stock),
    category: product.category,
    imageUrl: product.imageUrl ?? '',
  }
}

export interface AddProductModalProps {
  barberId: string
  /** When provided, the modal works in edit mode */
  editingProduct?: Product | null
  onClose: () => void
}

/**
 * AddProductModal — modal form for creating or editing a barber product.
 *
 * Props:
 * - barberId: owning barber
 * - editingProduct: when set, pre-fills the form for editing
 * - onClose: callback to close the modal
 */
export function AddProductModal({
  barberId,
  editingProduct,
  onClose,
}: AddProductModalProps) {
  const isEditing = Boolean(editingProduct)

  const [form, setForm] = useState<ProductFormState>(
    editingProduct ? formFromProduct(editingProduct) : EMPTY_FORM,
  )
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormState, string>>>({})

  const createMutation = useCreateProduct(barberId)
  const updateMutation = useUpdateProduct(barberId, editingProduct?.id ?? '')

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const hasApiError = createMutation.isError || updateMutation.isError

  useEffect(() => {
    if (editingProduct) {
      setForm(formFromProduct(editingProduct))
    } else {
      setForm(EMPTY_FORM)
    }
    setErrors({})
  }, [editingProduct])

  function validate(): boolean {
    const next: Partial<Record<keyof ProductFormState, string>> = {}
    if (!form.name.trim()) next.name = 'El nombre es obligatorio'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
      next.price = 'Precio invalido'
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0)
      next.stock = 'Stock invalido (minimo 0)'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleChange(field: keyof ProductFormState, value: string) {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const payload: CreateProductPayload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price),
      stock: Number(form.stock),
      category: form.category,
      imageUrl: form.imageUrl.trim() || undefined,
    }

    try {
      if (isEditing && editingProduct) {
        await updateMutation.mutateAsync(payload)
      } else {
        await createMutation.mutateAsync(payload)
      }
      onClose()
    } catch {
      // error shown via hasApiError
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
      aria-labelledby="product-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-[#2E2E2E] bg-[#1C1C1C] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2
            id="product-modal-title"
            className="font-display text-lg font-semibold text-white"
          >
            {isEditing ? 'Editar producto' : 'Nuevo producto'}
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
              label="Nombre"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
              placeholder="Cera mate premium"
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
                  handleChange('category', e.target.value as ProductCategory)
                }
                className="h-10 w-full rounded-md border border-[#2E2E2E] bg-[#111111] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:ring-offset-1 focus:ring-offset-[#1C1C1C]"
              >
                {(Object.entries(CATEGORY_LABELS) as [ProductCategory, string][]).map(
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
              placeholder="12.99"
              type="number"
              min="0"
              step="0.01"
            />

            <Input
              label="Stock"
              value={form.stock}
              onChange={(e) => handleChange('stock', e.target.value)}
              error={errors.stock}
              placeholder="10"
              type="number"
              min="0"
              step="1"
            />

            <Input
              label="URL de foto (opcional)"
              value={form.imageUrl}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
              placeholder="https://..."
              type="url"
              className="sm:col-span-2"
            />

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-sm font-medium text-white">
                Descripcion (opcional)
              </label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descripcion del producto..."
                rows={3}
                className="w-full rounded-md border border-[#2E2E2E] bg-[#111111] px-3 py-2 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:ring-offset-1 focus:ring-offset-[#1C1C1C]"
              />
            </div>
          </div>

          {hasApiError && (
            <p className="text-sm text-red-400" role="alert">
              Error al guardar el producto. Intenta de nuevo.
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="bg-[#D97706] text-black hover:bg-[#B45309] focus-visible:ring-[#D97706]"
            >
              {isEditing ? 'Guardar cambios' : 'Crear producto'}
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
