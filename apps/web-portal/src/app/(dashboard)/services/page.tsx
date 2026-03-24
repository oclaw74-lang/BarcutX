'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/Table'
import {
  useServices,
  useCreateService,
  useUpdateService,
  type CreateServicePayload,
} from '@/hooks/useServices'
import type { Service, ServiceCategory } from '@barcutx/shared-types'

// TODO: replace with real shop ID from auth context
const DEMO_SHOP_ID = 'demo'

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

const EMPTY_SERVICE_FORM: ServiceFormState = {
  name: '',
  description: '',
  price: '',
  durationMinutes: '',
  category: 'haircut',
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

/**
 * ServiceToggleButton — isolated so each row owns its own mutation instance.
 */
function ServiceToggleButton({
  shopId,
  service,
}: {
  shopId: string
  service: Service
}) {
  const updateMutation = useUpdateService(shopId, service.id)

  async function handleToggle() {
    try {
      await updateMutation.mutateAsync({ isActive: !service.isActive })
    } catch {
      // error is accessible via updateMutation.isError if needed
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      isLoading={updateMutation.isPending}
      onClick={handleToggle}
    >
      {service.isActive ? 'Desactivar' : 'Activar'}
    </Button>
  )
}

interface AddServiceFormProps {
  shopId: string
  onClose: () => void
}

function AddServiceForm({ shopId, onClose }: AddServiceFormProps) {
  const createMutation = useCreateService(shopId)
  const [form, setForm] = useState<ServiceFormState>(EMPTY_SERVICE_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof ServiceFormState, string>>>({})

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const payload: CreateServicePayload = {
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

  function handleChange(field: keyof ServiceFormState, value: string) {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card bordered className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Nuevo servicio</CardTitle>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-white"
            aria-label="Cerrar formulario"
          >
            x
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nombre"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
              placeholder="Corte clasico"
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-white">Categoria</label>
              <select
                value={form.category}
                onChange={(e) =>
                  handleChange('category', e.target.value as ServiceCategory)
                }
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Precio (EUR)"
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
              error={errors.price}
              placeholder="15"
              type="number"
              min="0"
              step="0.5"
            />
            <Input
              label="Duracion (min)"
              value={form.durationMinutes}
              onChange={(e) => handleChange('durationMinutes', e.target.value)}
              error={errors.durationMinutes}
              placeholder="30"
              type="number"
              min="1"
            />
            <Input
              label="Descripcion (opcional)"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descripcion del servicio"
              className="sm:col-span-2"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              disabled={createMutation.isPending}
            >
              Crear servicio
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            {createMutation.isError && (
              <span className="text-sm text-red-400">
                Error al crear el servicio.
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function ServicesPage() {
  const { data: services, isLoading, isError } = useServices(DEMO_SHOP_ID)
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Servicios
          </h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            Gestiona el catalogo de servicios de tu barberia
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : 'Agregar servicio'}
        </Button>
      </div>

      {showForm && (
        <AddServiceForm
          shopId={DEMO_SHOP_ID}
          onClose={() => setShowForm(false)}
        />
      )}

      {isLoading && (
        <p className="text-sm text-[#9CA3AF]">Cargando servicios...</p>
      )}

      {isError && (
        <p className="text-sm text-red-400">Error al cargar los servicios.</p>
      )}

      {!isLoading && services && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Nombre</TableHeader>
              <TableHeader>Categoria</TableHeader>
              <TableHeader>Precio</TableHeader>
              <TableHeader>Duracion</TableHeader>
              <TableHeader>Estado</TableHeader>
              <TableHeader>Acciones</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.length === 0 && (
              <TableRow>
                <TableCell
                  className="text-center text-[#9CA3AF]"
                  colSpan={6}
                >
                  No hay servicios registrados.
                </TableCell>
              </TableRow>
            )}
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell className="text-[#9CA3AF]">
                  {CATEGORY_LABELS[service.category]}
                </TableCell>
                <TableCell>{formatPrice(service.price)}</TableCell>
                <TableCell>{service.durationMinutes} min</TableCell>
                <TableCell>
                  <Badge variant={service.isActive ? 'success' : 'muted'}>
                    {service.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ServiceToggleButton
                    shopId={DEMO_SHOP_ID}
                    service={service}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
