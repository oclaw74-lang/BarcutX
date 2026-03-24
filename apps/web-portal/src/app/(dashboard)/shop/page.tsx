'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useBarberShops, useUpdateBarberShop } from '@/hooks/useBarberShops'

// TODO: replace with real shop ID from auth context
const DEMO_SHOP_ID = 'demo'

interface ShopFormState {
  name: string
  description: string
  address: string
  city: string
  phone: string
  email: string
}

const EMPTY_FORM: ShopFormState = {
  name: '',
  description: '',
  address: '',
  city: '',
  phone: '',
  email: '',
}

export default function ShopPage() {
  const { data: shops, isLoading, isError } = useBarberShops()
  const shop = shops?.[0] ?? null

  const updateMutation = useUpdateBarberShop(DEMO_SHOP_ID)

  const [form, setForm] = useState<ShopFormState>(EMPTY_FORM)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (shop) {
      setForm({
        name: shop.name ?? '',
        description: shop.description ?? '',
        address: shop.address ?? '',
        city: shop.city ?? '',
        phone: shop.phone ?? '',
        email: shop.email ?? '',
      })
    }
  }, [shop])

  function handleChange(field: keyof ShopFormState, value: string) {
    setSaved(false)
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await updateMutation.mutateAsync({
        name: form.name,
        description: form.description || undefined,
        address: form.address,
        city: form.city,
        phone: form.phone || undefined,
        email: form.email || undefined,
      })
      setSaved(true)
    } catch {
      // error surfaced via updateMutation.isError
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">
          Mi Barberia
        </h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          Edita la informacion publica de tu establecimiento
        </p>
      </div>

      {isLoading && (
        <p className="text-sm text-[#9CA3AF]">Cargando datos...</p>
      )}

      {isError && (
        <p className="text-sm text-red-400">
          No se pudo cargar la informacion de la barberia.
        </p>
      )}

      {!isLoading && (
        <Card bordered>
          <CardHeader>
            <CardTitle>Informacion general</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Nombre"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  placeholder="Barberia El Clasico"
                />
                <Input
                  label="Ciudad"
                  value={form.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  required
                  placeholder="Madrid"
                />
                <Input
                  label="Direccion"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  required
                  placeholder="Calle Gran Via 42"
                />
                <Input
                  label="Telefono"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+34 600 000 000"
                  type="tel"
                />
                <Input
                  label="Email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="barberia@ejemplo.com"
                  type="email"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-white">
                  Descripcion
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  placeholder="Descripcion de tu barberia..."
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  isLoading={updateMutation.isPending}
                  disabled={updateMutation.isPending}
                >
                  Guardar cambios
                </Button>
                {saved && (
                  <span className="text-sm text-green-400">
                    Guardado correctamente
                  </span>
                )}
                {updateMutation.isError && (
                  <span className="text-sm text-red-400">
                    Error al guardar. Intentalo de nuevo.
                  </span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
