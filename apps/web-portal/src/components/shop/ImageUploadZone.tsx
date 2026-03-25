'use client'

import { useId, useRef, useState, type DragEvent, type ChangeEvent } from 'react'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml']
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB

interface ImageUploadZoneProps {
  previewUrl?: string | null
  shape?: 'circle' | 'rectangle'
  aspectRatio?: '1/1' | '16/9'
  label?: string
  hint?: string
  onFileSelected: (file: File) => void
}

/**
 * ImageUploadZone — drag & drop or click-to-upload image input.
 *
 * Props:
 * - previewUrl: current image URL to display as preview
 * - shape: 'circle' (logo) | 'rectangle' (cover/gallery), default 'rectangle'
 * - aspectRatio: CSS aspect-ratio string, default '16/9'
 * - label: accessible label text
 * - hint: helper text shown below the zone
 * - onFileSelected: called with the validated File object
 */
export function ImageUploadZone({
  previewUrl,
  shape = 'rectangle',
  aspectRatio = '16/9',
  label,
  hint,
  onFileSelected,
}: ImageUploadZoneProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')

  function validateAndEmit(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Solo se aceptan PNG, JPG o SVG')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('El archivo supera el limite de 2 MB')
      return
    }
    setError('')
    onFileSelected(file)
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) validateAndEmit(file)
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) validateAndEmit(file)
  }

  const isCircle = shape === 'circle'

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-sm font-medium text-white">{label}</span>
      )}

      <div
        role="button"
        tabIndex={0}
        aria-label={label ?? 'Zona de subida de imagen'}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        className={[
          'group relative flex cursor-pointer items-center justify-center overflow-hidden',
          'border-2 border-dashed transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          isCircle ? 'rounded-full' : 'rounded-lg',
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-border bg-surface hover:border-primary/60 hover:bg-surface/80',
        ].join(' ')}
        style={{
          aspectRatio: isCircle ? '1/1' : aspectRatio,
          width: isCircle ? '96px' : '100%',
        }}
      >
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Vista previa"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="text-xs font-medium text-white">Cambiar</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 px-4 py-3 text-center">
            <svg
              className="h-6 w-6 text-[#6B7280]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 16l4-4 4 4 4-6 4 6M3 20h18"
              />
            </svg>
            <span className="text-xs text-[#9CA3AF]">
              {isDragging ? 'Suelta aqui' : 'Arrastra o haz clic'}
            </span>
          </div>
        )}
      </div>

      {hint && !error && (
        <p className="text-xs text-[#6B7280]">{hint}</p>
      )}

      {error && (
        <p role="alert" className="text-xs text-busy">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="sr-only"
        onChange={handleInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}
