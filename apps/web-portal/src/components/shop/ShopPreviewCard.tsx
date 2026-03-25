'use client'

const DEFAULT_COVER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225"><rect width="400" height="225" fill="%231a1d24"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%234B5563">Sin foto de portada</text></svg>'

interface ShopPreviewCardProps {
  name: string
  tagline: string
  accentColor: string
  logoUrl?: string | null
  coverUrl?: string | null
}

/**
 * ShopPreviewCard — live preview of how the shop looks in the public directory.
 *
 * Props:
 * - name: shop name
 * - tagline: short slogan
 * - accentColor: CSS hex color used for the header gradient overlay
 * - logoUrl: optional logo image URL (circular)
 * - coverUrl: optional cover photo URL (16:9 header)
 */
export function ShopPreviewCard({
  name,
  tagline,
  accentColor,
  logoUrl,
  coverUrl,
}: ShopPreviewCardProps) {
  const displayName = name.trim() || 'Nombre de tu barberia'
  const displayTagline = tagline.trim() || 'Tu slogan aqui'

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
      {/* Header / cover */}
      <div
        className="relative"
        style={{ aspectRatio: '16/9' }}
      >
        {/* Cover photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl ?? DEFAULT_COVER}
          alt="Foto de portada"
          className="h-full w-full object-cover"
        />

        {/* Color accent overlay — gradient from accent color */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${accentColor}CC 0%, transparent 60%)`,
          }}
          aria-hidden="true"
        />

        {/* Logo chip — bottom-left */}
        {logoUrl && (
          <div className="absolute bottom-3 left-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt="Logo de la barberia"
              className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-md"
            />
          </div>
        )}

        {/* Open badge */}
        <div className="absolute right-3 top-3">
          <span className="rounded-full bg-available px-2.5 py-0.5 text-xs font-semibold text-white shadow">
            Abierto
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-4">
        <div>
          <h3 className="font-display text-base font-bold leading-tight text-white">
            {displayName}
          </h3>
          <p className="mt-0.5 text-xs text-[#9CA3AF]">{displayTagline}</p>
        </div>

        {/* Rating row */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-[#F59E0B]">4.9</span>
          <span className="text-xs text-[#F59E0B]" aria-hidden="true">
            ★★★★★
          </span>
          <span className="text-xs text-[#6B7280]">(127 resenas)</span>
        </div>

        {/* Service badges */}
        <div className="flex flex-wrap gap-1.5">
          {['Corte', 'Barba', 'Afeitado'].map((service) => (
            <span
              key={service}
              className="rounded-full border border-border px-2.5 py-0.5 text-xs text-[#9CA3AF]"
            >
              {service}
            </span>
          ))}
        </div>

        {/* Accent color indicator */}
        <div className="mt-1 flex items-center gap-1.5">
          <div
            className="h-3 w-3 rounded-full border border-border"
            style={{ backgroundColor: accentColor }}
            aria-hidden="true"
          />
          <span className="text-xs text-[#6B7280]">{accentColor}</span>
        </div>
      </div>
    </div>
  )
}
