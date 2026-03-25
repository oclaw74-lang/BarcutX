'use client'

import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ColorPicker } from '@/components/shop/ColorPicker'
import { ImageUploadZone } from '@/components/shop/ImageUploadZone'
import { ShopPreviewCard } from '@/components/shop/ShopPreviewCard'
import { HoursEditor } from '@/components/shop/HoursEditor'
import {
  useUpdateBranding,
  useUpdateHours,
  useUploadGalleryPhoto,
  useDeleteGalleryPhoto,
  type ShopBranding,
  type WeekHours,
} from '@/hooks/useShopSettings'

// ─── Constants ───────────────────────────────────────────────────────────────

// TODO: replace with real owner shop ID from auth context
const DEMO_SHOP_ID = 'demo'

const MAX_GALLERY = 10

const SLUG_REGEX = /^[a-z0-9-]*$/

const DEFAULT_HOURS: WeekHours = {
  monday: { open: true, openTime: '09:00', closeTime: '20:00' },
  tuesday: { open: true, openTime: '09:00', closeTime: '20:00' },
  wednesday: { open: true, openTime: '09:00', closeTime: '20:00' },
  thursday: { open: true, openTime: '09:00', closeTime: '20:00' },
  friday: { open: true, openTime: '09:00', closeTime: '20:00' },
  saturday: { open: true, openTime: '10:00', closeTime: '18:00' },
  sunday: { open: false, openTime: '10:00', closeTime: '16:00' },
}

const DEFAULT_BRANDING: ShopBranding = {
  name: '',
  slug: '',
  tagline: '',
  accentColor: '#D97706',
  instagramUrl: '',
  whatsapp: '',
  logoUrl: null,
  coverUrl: null,
  galleryUrls: [],
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type TabId = 'identity' | 'images' | 'hours'

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'identity', label: 'Identidad' },
  { id: 'images', label: 'Imagenes' },
  { id: 'hours', label: 'Horarios' },
]

// ─── Slug helpers ─────────────────────────────────────────────────────────────

function validateSlug(slug: string): string {
  if (!slug) return ''
  if (!SLUG_REGEX.test(slug)) {
    return 'Solo letras minusculas, numeros y guiones'
  }
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return 'No puede empezar ni terminar con guion'
  }
  return ''
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface TabButtonProps {
  id: TabId
  label: string
  isActive: boolean
  onClick: (id: TabId) => void
}

function TabButton({ id, label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => onClick(id)}
      className={[
        'px-4 py-2.5 text-sm font-medium transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        isActive
          ? 'border-b-2 border-primary text-white'
          : 'text-[#9CA3AF] hover:text-white',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

// ─── Identity tab ─────────────────────────────────────────────────────────────

interface IdentityTabProps {
  branding: ShopBranding
  onChange: (patch: Partial<ShopBranding>) => void
  onSave: () => void
  isSaving: boolean
  saveError: string
  slugError: string
}

function IdentityTab({
  branding,
  onChange,
  onSave,
  isSaving,
  saveError,
  slugError,
}: IdentityTabProps) {
  return (
    <div className="flex flex-col gap-5">
      <Input
        label="Nombre de la barberia"
        placeholder="Barberia El Maestro"
        value={branding.name}
        onChange={(e) => onChange({ name: e.target.value })}
      />

      <div className="flex flex-col gap-1">
        <Input
          label="Slug (URL publica)"
          placeholder="barberia-el-maestro"
          value={branding.slug}
          onChange={(e) => onChange({ slug: e.target.value.toLowerCase() })}
          error={slugError}
          hint={
            branding.slug && !slugError
              ? `Tu URL: barcutx.com/b/${branding.slug}`
              : 'Solo letras minusculas, numeros y guiones'
          }
        />
      </div>

      <Input
        label="Tagline / slogan"
        placeholder="Tu mejor corte, siempre."
        value={branding.tagline}
        onChange={(e) => onChange({ tagline: e.target.value })}
      />

      <ColorPicker
        label="Color principal"
        value={branding.accentColor}
        onChange={(color) => onChange({ accentColor: color })}
      />

      <div className="flex flex-col gap-1">
        <Input
          label="Instagram"
          placeholder="https://instagram.com/tubarberia"
          type="url"
          value={branding.instagramUrl}
          onChange={(e) => onChange({ instagramUrl: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Input
          label="WhatsApp"
          placeholder="+34 600 000 000"
          type="tel"
          value={branding.whatsapp}
          onChange={(e) => onChange({ whatsapp: e.target.value })}
        />
      </div>

      {saveError && (
        <p role="alert" className="text-sm text-busy">
          {saveError}
        </p>
      )}

      <div className="flex justify-end">
        <Button
          variant="primary"
          isLoading={isSaving}
          onClick={onSave}
          disabled={!!slugError}
        >
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}

// ─── Images tab ───────────────────────────────────────────────────────────────

interface ImagesTabProps {
  branding: ShopBranding
  onLogoSelected: (file: File) => void
  onCoverSelected: (file: File) => void
  onGalleryAdd: (file: File) => void
  onGalleryRemove: (url: string) => void
  pendingGallery: File[]
  onPendingRemove: (index: number) => void
  isSaving: boolean
  onSave: () => void
  saveError: string
}

function ImagesTab({
  branding,
  onLogoSelected,
  onCoverSelected,
  onGalleryAdd,
  onGalleryRemove,
  pendingGallery,
  onPendingRemove,
  isSaving,
  onSave,
  saveError,
}: ImagesTabProps) {
  const totalGallery = branding.galleryUrls.length + pendingGallery.length
  const canAddMore = totalGallery < MAX_GALLERY

  return (
    <div className="flex flex-col gap-6">
      {/* Logo */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-white">Logo</span>
        <div className="flex items-center gap-4">
          <ImageUploadZone
            previewUrl={branding.logoUrl}
            shape="circle"
            label="Logo circular"
            hint="PNG, JPG o SVG — max 2 MB"
            onFileSelected={onLogoSelected}
          />
          <p className="text-xs text-[#6B7280]">
            Aparece en la esquina de la foto de portada.
            <br />
            Recomendado: 256×256 px, fondo transparente.
          </p>
        </div>
      </div>

      {/* Cover */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-white">Foto de portada</span>
        <ImageUploadZone
          previewUrl={branding.coverUrl}
          shape="rectangle"
          aspectRatio="16/9"
          label="Foto de portada 16:9"
          hint="PNG o JPG — max 2 MB — recomendado 1280×720 px"
          onFileSelected={onCoverSelected}
        />
      </div>

      {/* Gallery */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-white">
          Galeria ({totalGallery}/{MAX_GALLERY})
        </span>

        <div className="grid grid-cols-3 gap-2">
          {/* Uploaded photos */}
          {branding.galleryUrls.map((url) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Foto de galeria"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => onGalleryRemove(url)}
                aria-label="Eliminar foto"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-busy"
              >
                <span aria-hidden="true" className="text-xs leading-none">✕</span>
              </button>
            </div>
          ))}

          {/* Pending (local preview before save) */}
          {pendingGallery.map((file, index) => (
            <div key={`pending-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border border-primary/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(file)}
                alt="Foto pendiente"
                className="h-full w-full object-cover opacity-70"
              />
              <button
                type="button"
                onClick={() => onPendingRemove(index)}
                aria-label="Quitar foto pendiente"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-busy"
              >
                <span aria-hidden="true" className="text-xs leading-none">✕</span>
              </button>
              <span className="absolute bottom-1 left-1 rounded bg-primary/80 px-1 py-0.5 text-[10px] text-white">
                Pendiente
              </span>
            </div>
          ))}

          {/* Add slot */}
          {canAddMore && (
            <ImageUploadZone
              shape="rectangle"
              aspectRatio="1/1"
              label="Agregar foto"
              onFileSelected={onGalleryAdd}
            />
          )}
        </div>

        <p className="text-xs text-[#6B7280]">
          Las fotos se suben al hacer clic en &quot;Guardar&quot;.
        </p>
      </div>

      {saveError && (
        <p role="alert" className="text-sm text-busy">
          {saveError}
        </p>
      )}

      <div className="flex justify-end">
        <Button variant="primary" isLoading={isSaving} onClick={onSave}>
          Guardar
        </Button>
      </div>
    </div>
  )
}

// ─── Hours tab ────────────────────────────────────────────────────────────────

interface HoursTabProps {
  hours: WeekHours
  onChange: (updated: WeekHours) => void
  onSave: () => void
  isSaving: boolean
  saveError: string
}

function HoursTab({ hours, onChange, onSave, isSaving, saveError }: HoursTabProps) {
  return (
    <div className="flex flex-col gap-5">
      <HoursEditor value={hours} onChange={onChange} />

      {saveError && (
        <p role="alert" className="text-sm text-busy">
          {saveError}
        </p>
      )}

      <div className="flex justify-end">
        <Button variant="primary" isLoading={isSaving} onClick={onSave}>
          Guardar horarios
        </Button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BarberiaPage() {
  const [activeTab, setActiveTab] = useState<TabId>('identity')

  // Local form state — no API call per keystroke
  const [branding, setBranding] = useState<ShopBranding>(DEFAULT_BRANDING)
  const [hours, setHours] = useState<WeekHours>(DEFAULT_HOURS)

  // Pending gallery files (uploaded on save)
  const [pendingGallery, setPendingGallery] = useState<File[]>([])

  // Per-action error messages
  const [brandingError, setBrandingError] = useState('')
  const [imagesError, setImagesError] = useState('')
  const [hoursError, setHoursError] = useState('')

  // API mutations
  const updateBranding = useUpdateBranding(DEMO_SHOP_ID)
  const updateHours = useUpdateHours(DEMO_SHOP_ID)
  const uploadPhoto = useUploadGalleryPhoto(DEMO_SHOP_ID)
  const deletePhoto = useDeleteGalleryPhoto(DEMO_SHOP_ID)

  // Slug validation (derived)
  const slugError = validateSlug(branding.slug)

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleBrandingChange = useCallback(
    (patch: Partial<ShopBranding>) => {
      setBranding((prev) => ({ ...prev, ...patch }))
    },
    [],
  )

  async function handleSaveBranding() {
    if (slugError) return
    setBrandingError('')
    try {
      await updateBranding.mutateAsync({
        name: branding.name,
        slug: branding.slug,
        tagline: branding.tagline,
        accentColor: branding.accentColor,
        instagramUrl: branding.instagramUrl,
        whatsapp: branding.whatsapp,
      })
    } catch (err) {
      setBrandingError(
        err instanceof Error ? err.message : 'Error al guardar. Intenta de nuevo.',
      )
    }
  }

  async function handleLogoSelected(file: File) {
    try {
      const { url } = await uploadPhoto.mutateAsync({ file, type: 'logo' })
      setBranding((prev) => ({ ...prev, logoUrl: url }))
    } catch {
      setImagesError('Error al subir el logo.')
    }
  }

  async function handleCoverSelected(file: File) {
    try {
      const { url } = await uploadPhoto.mutateAsync({ file, type: 'cover' })
      setBranding((prev) => ({ ...prev, coverUrl: url }))
    } catch {
      setImagesError('Error al subir la portada.')
    }
  }

  function handleGalleryAdd(file: File) {
    if (branding.galleryUrls.length + pendingGallery.length >= MAX_GALLERY) return
    setPendingGallery((prev) => [...prev, file])
  }

  async function handleGalleryRemove(url: string) {
    try {
      await deletePhoto.mutateAsync({ url })
      setBranding((prev) => ({
        ...prev,
        galleryUrls: prev.galleryUrls.filter((u) => u !== url),
      }))
    } catch {
      setImagesError('Error al eliminar la foto.')
    }
  }

  function handlePendingRemove(index: number) {
    setPendingGallery((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSaveImages() {
    setImagesError('')
    try {
      // Upload pending gallery photos sequentially
      const newUrls: string[] = []
      for (const file of pendingGallery) {
        const { url } = await uploadPhoto.mutateAsync({ file, type: 'gallery' })
        newUrls.push(url)
      }
      setBranding((prev) => ({
        ...prev,
        galleryUrls: [...prev.galleryUrls, ...newUrls],
      }))
      setPendingGallery([])
    } catch {
      setImagesError('Error al subir una o mas fotos. Intenta de nuevo.')
    }
  }

  async function handleSaveHours() {
    setHoursError('')
    try {
      await updateHours.mutateAsync({ hours })
    } catch (err) {
      setHoursError(
        err instanceof Error ? err.message : 'Error al guardar horarios.',
      )
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">
          Configuracion de barberia
        </h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          Personaliza como se ve tu barberia para los clientes
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">
        {/* Left: form (2/3) */}
        <div className="flex-1 min-w-0">
          {/* Tab bar */}
          <div
            role="tablist"
            aria-label="Secciones de configuracion"
            className="flex border-b border-border"
          >
            {TABS.map((tab) => (
              <TabButton
                key={tab.id}
                id={tab.id}
                label={tab.label}
                isActive={activeTab === tab.id}
                onClick={setActiveTab}
              />
            ))}
          </div>

          {/* Tab panels */}
          <div
            role="tabpanel"
            aria-label={TABS.find((t) => t.id === activeTab)?.label}
            className="pt-5"
          >
            {activeTab === 'identity' && (
              <IdentityTab
                branding={branding}
                onChange={handleBrandingChange}
                onSave={handleSaveBranding}
                isSaving={updateBranding.isPending}
                saveError={brandingError}
                slugError={slugError}
              />
            )}

            {activeTab === 'images' && (
              <ImagesTab
                branding={branding}
                onLogoSelected={handleLogoSelected}
                onCoverSelected={handleCoverSelected}
                onGalleryAdd={handleGalleryAdd}
                onGalleryRemove={handleGalleryRemove}
                pendingGallery={pendingGallery}
                onPendingRemove={handlePendingRemove}
                isSaving={uploadPhoto.isPending}
                onSave={handleSaveImages}
                saveError={imagesError}
              />
            )}

            {activeTab === 'hours' && (
              <HoursTab
                hours={hours}
                onChange={setHours}
                onSave={handleSaveHours}
                isSaving={updateHours.isPending}
                saveError={hoursError}
              />
            )}
          </div>
        </div>

        {/* Right: live preview (1/3) */}
        <div className="w-80 shrink-0 sticky top-6">
          <p className="mb-3 text-center text-xs text-[#6B7280]">
            Asi veran tu barberia los clientes
          </p>
          <ShopPreviewCard
            name={branding.name}
            tagline={branding.tagline}
            accentColor={branding.accentColor}
            logoUrl={branding.logoUrl}
            coverUrl={branding.coverUrl}
          />
        </div>
      </div>
    </div>
  )
}
