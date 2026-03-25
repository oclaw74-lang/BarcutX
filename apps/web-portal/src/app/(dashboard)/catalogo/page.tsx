'use client'

import { useState } from 'react'
import { ServiceRow } from '@/components/catalog/ServiceRow'
import { ProductCard } from '@/components/catalog/ProductCard'
import { PortfolioGrid } from '@/components/catalog/PortfolioGrid'
import { AddProductModal } from '@/components/catalog/AddProductModal'
import { AddServiceModal } from '@/components/catalog/AddServiceModal'
import { Button } from '@/components/ui/Button'
import {
  useBarberServices,
  useBarberProducts,
  useBarberPortfolio,
  useAddPortfolioItem,
} from '@/hooks/useCatalog'
import type { Product } from '@/types/catalog'

// TODO: replace with real barber ID from auth context
const DEMO_BARBER_ID = 'demo'

// ---- Tab types --------------------------------------------------------------

type Tab = 'services' | 'products' | 'portfolio'

const TAB_LABELS: Record<Tab, string> = {
  services: 'Mis Servicios',
  products: 'Mis Productos',
  portfolio: 'Mi Portafolio',
}

// ---- Tab bar ----------------------------------------------------------------

interface TabBarProps {
  activeTab: Tab
  onChange: (tab: Tab) => void
}

function TabBar({ activeTab, onChange }: TabBarProps) {
  return (
    <div
      className="flex gap-1 rounded-lg bg-[#222] p-1"
      role="tablist"
      aria-label="Secciones del catalogo"
    >
      {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={activeTab === tab}
          onClick={() => onChange(tab)}
          className={[
            'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]',
            activeTab === tab
              ? 'bg-[#2A2A2A] text-white shadow-sm'
              : 'text-[#9CA3AF] hover:text-white',
          ].join(' ')}
        >
          {TAB_LABELS[tab]}
        </button>
      ))}
    </div>
  )
}

// ---- Skeleton ---------------------------------------------------------------

function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-14 animate-pulse rounded-lg bg-[#1C1C1C]"
          aria-hidden
        />
      ))}
    </div>
  )
}

function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-[3/4] animate-pulse rounded-lg bg-[#1C1C1C]"
          aria-hidden
        />
      ))}
    </div>
  )
}

// ---- Services tab -----------------------------------------------------------

function ServicesTab({ barberId }: { barberId: string }) {
  const [showModal, setShowModal] = useState(false)
  const { data: services, isLoading, isError } = useBarberServices(barberId)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#9CA3AF]">
          Gestiona tus servicios propios y los heredados del shop
        </p>
        <Button
          size="sm"
          onClick={() => setShowModal(true)}
          className="bg-[#D97706] text-black hover:bg-[#B45309]"
        >
          + Agregar servicio
        </Button>
      </div>

      {isLoading && <SkeletonRows />}

      {isError && (
        <p className="text-sm text-red-400" role="alert">
          Error al cargar los servicios.
        </p>
      )}

      {!isLoading && services && (
        <>
          {services.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[#2E2E2E] py-12">
              <span className="text-4xl" aria-hidden>
                ✂
              </span>
              <p className="text-sm text-[#9CA3AF]">
                No tienes servicios configurados.
              </p>
              <Button
                size="sm"
                onClick={() => setShowModal(true)}
                className="bg-[#D97706] text-black hover:bg-[#B45309]"
              >
                Agregar primer servicio
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {services.map((barberService) => (
                <ServiceRow
                  key={barberService.id}
                  barberId={barberId}
                  barberService={barberService}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showModal && (
        <AddServiceModal
          barberId={barberId}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

// ---- Products tab -----------------------------------------------------------

function ProductsTab({ barberId }: { barberId: string }) {
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const { data: products, isLoading, isError } = useBarberProducts(barberId)

  function handleEdit(product: Product) {
    setEditingProduct(product)
    setShowModal(true)
  }

  function handleClose() {
    setShowModal(false)
    setEditingProduct(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#9CA3AF]">
          Gestiona los productos que ofreces a tus clientes
        </p>
        <Button
          size="sm"
          onClick={() => setShowModal(true)}
          className="bg-[#D97706] text-black hover:bg-[#B45309]"
        >
          + Agregar producto
        </Button>
      </div>

      {isLoading && <SkeletonCards />}

      {isError && (
        <p className="text-sm text-red-400" role="alert">
          Error al cargar los productos.
        </p>
      )}

      {!isLoading && products && (
        <>
          {products.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[#2E2E2E] py-12">
              <span className="text-4xl" aria-hidden>
                📦
              </span>
              <p className="text-sm text-[#9CA3AF]">
                No tienes productos registrados.
              </p>
              <Button
                size="sm"
                onClick={() => setShowModal(true)}
                className="bg-[#D97706] text-black hover:bg-[#B45309]"
              >
                Agregar primer producto
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  barberId={barberId}
                  product={product}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showModal && (
        <AddProductModal
          barberId={barberId}
          editingProduct={editingProduct}
          onClose={handleClose}
        />
      )}
    </div>
  )
}

// ---- Portfolio tab ----------------------------------------------------------

function PortfolioTab({ barberId }: { barberId: string }) {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadUrl, setUploadUrl] = useState('')
  const [uploadCaption, setUploadCaption] = useState('')
  const [uploadError, setUploadError] = useState('')

  const { data: items, isLoading, isError } = useBarberPortfolio(barberId)
  const addMutation = useAddPortfolioItem(barberId)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setUploadError('')

    if (!uploadUrl.trim()) {
      setUploadError('La URL de la imagen es obligatoria')
      return
    }

    try {
      await addMutation.mutateAsync({
        imageUrl: uploadUrl.trim(),
        caption: uploadCaption.trim() || undefined,
        order: items ? items.length : 0,
      })
      setShowUploadModal(false)
      setUploadUrl('')
      setUploadCaption('')
    } catch {
      setUploadError('Error al subir la foto. Intenta de nuevo.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#9CA3AF]">
          Muestra tu trabajo — gestiona tu galeria de fotos
        </p>
      </div>

      {isLoading && <SkeletonCards count={9} />}

      {isError && (
        <p className="text-sm text-red-400" role="alert">
          Error al cargar el portafolio.
        </p>
      )}

      {!isLoading && items !== undefined && (
        <PortfolioGrid
          barberId={barberId}
          items={items}
          onUpload={() => setShowUploadModal(true)}
        />
      )}

      {/* Upload modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowUploadModal(false)
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-modal-title"
        >
          <div className="w-full max-w-md rounded-xl border border-[#2E2E2E] bg-[#1C1C1C] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2
                id="upload-modal-title"
                className="font-display text-lg font-semibold text-white"
              >
                Subir foto al portafolio
              </h2>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-[#9CA3AF] hover:text-white"
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpload} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-white">
                  URL de la imagen
                </label>
                <input
                  type="url"
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-10 w-full rounded-md border border-[#2E2E2E] bg-[#111111] px-3 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-white">
                  Descripcion (opcional)
                </label>
                <input
                  type="text"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Fade + degradado"
                  className="h-10 w-full rounded-md border border-[#2E2E2E] bg-[#111111] px-3 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                />
              </div>

              {uploadError && (
                <p className="text-sm text-red-400" role="alert">
                  {uploadError}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  isLoading={addMutation.isPending}
                  disabled={addMutation.isPending}
                  className="bg-[#D97706] text-black hover:bg-[#B45309]"
                >
                  Subir foto
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Page -------------------------------------------------------------------

export default function CatalogoPage() {
  const [activeTab, setActiveTab] = useState<Tab>('services')

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">
          Catalogo
        </h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          Gestiona tus servicios, productos y portafolio de trabajos
        </p>
      </div>

      {/* Tabs */}
      <TabBar activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      <div role="tabpanel">
        {activeTab === 'services' && (
          <ServicesTab barberId={DEMO_BARBER_ID} />
        )}
        {activeTab === 'products' && (
          <ProductsTab barberId={DEMO_BARBER_ID} />
        )}
        {activeTab === 'portfolio' && (
          <PortfolioTab barberId={DEMO_BARBER_ID} />
        )}
      </div>
    </div>
  )
}
