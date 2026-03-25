'use client'

import { useId, useState } from 'react'

const PRESET_SWATCHES = [
  { label: 'Amber', value: '#D97706' },
  { label: 'Red', value: '#DC2626' },
  { label: 'Blue', value: '#2563EB' },
  { label: 'Green', value: '#16A34A' },
  { label: 'Purple', value: '#7C3AED' },
  { label: 'Teal', value: '#0D9488' },
]

const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
}

/**
 * ColorPicker — 6 preset swatches + free-form hex input.
 *
 * Props:
 * - value: current hex color string (e.g. "#D97706")
 * - onChange: called with the new color whenever it changes
 * - label: optional visible label
 */
export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const hexInputId = useId()
  const [hexInput, setHexInput] = useState(value)
  const [hexError, setHexError] = useState('')

  function handleSwatchClick(color: string) {
    setHexInput(color)
    setHexError('')
    onChange(color)
  }

  function handleHexChange(raw: string) {
    setHexInput(raw)

    const normalized = raw.startsWith('#') ? raw : `#${raw}`
    if (HEX_REGEX.test(normalized)) {
      setHexError('')
      onChange(normalized)
    } else {
      setHexError('Formato invalido. Usa #RRGGBB o #RGB')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-sm font-medium text-white">{label}</span>
      )}

      {/* Preset swatches */}
      <div className="flex items-center gap-2" role="radiogroup" aria-label="Colores predefinidos">
        {PRESET_SWATCHES.map((swatch) => {
          const isSelected = value.toLowerCase() === swatch.value.toLowerCase()
          return (
            <button
              key={swatch.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={swatch.label}
              title={swatch.label}
              onClick={() => handleSwatchClick(swatch.value)}
              className={[
                'h-7 w-7 rounded-full border-2 transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                isSelected
                  ? 'border-white scale-110'
                  : 'border-transparent hover:scale-105',
              ].join(' ')}
              style={{ backgroundColor: swatch.value }}
            />
          )
        })}

        {/* Live color dot for custom values */}
        <div
          className="h-7 w-7 rounded-full border-2 border-border"
          style={{ backgroundColor: HEX_REGEX.test(value) ? value : '#D97706' }}
          aria-hidden="true"
          title="Color actual"
        />
      </div>

      {/* Hex input */}
      <div className="flex flex-col gap-1">
        <label htmlFor={hexInputId} className="sr-only">
          Valor hexadecimal del color
        </label>
        <div className="flex items-center gap-2">
          <div
            className="h-9 w-9 shrink-0 rounded-md border border-border"
            style={{ backgroundColor: HEX_REGEX.test(value) ? value : '#D97706' }}
            aria-hidden="true"
          />
          <input
            id={hexInputId}
            type="text"
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            placeholder="#D97706"
            maxLength={7}
            aria-invalid={!!hexError}
            className={[
              'h-9 w-full rounded-md border px-3 font-mono text-sm',
              'bg-surface text-white placeholder:text-[#6B7280]',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background',
              hexError ? 'border-busy' : 'border-border hover:border-[#3A3D45]',
            ].join(' ')}
          />
        </div>
        {hexError && (
          <p role="alert" className="text-xs text-busy">
            {hexError}
          </p>
        )}
      </div>
    </div>
  )
}
