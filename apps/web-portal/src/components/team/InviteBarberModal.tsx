'use client'

import { useState, useRef, useEffect, useId } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface InviteBarberModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (email: string, message?: string) => Promise<void>
  isSubmitting?: boolean
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(value: string): string | undefined {
  if (!value.trim()) return 'El email es obligatorio'
  if (!EMAIL_REGEX.test(value)) return 'Introduce un email valido'
  return undefined
}

/**
 * InviteBarberModal — dialog to invite a barber by email.
 *
 * Props:
 * - isOpen: controls visibility
 * - onClose: callback to close the dialog
 * - onSubmit: async callback with (email, message)
 * - isSubmitting: loading state for the submit button
 */
export function InviteBarberModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: InviteBarberModalProps) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>()
  const [submitError, setSubmitError] = useState<string | undefined>()

  const titleId = useId()
  const firstInputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      firstInputRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  function handleClose() {
    setEmail('')
    setMessage('')
    setEmailError(undefined)
    setSubmitError(undefined)
    onClose()
  }

  function handleEmailChange(value: string) {
    setEmail(value)
    if (emailError) {
      setEmailError(validateEmail(value))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(undefined)

    const error = validateEmail(email)
    if (error) {
      setEmailError(error)
      return
    }

    try {
      await onSubmit(email.trim(), message.trim() || undefined)
      handleClose()
    } catch {
      setSubmitError('No se pudo enviar la invitacion. Intentalo de nuevo.')
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-md rounded-xl border border-border bg-[#1A1D23] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            id={titleId}
            className="font-display text-lg font-semibold text-white"
          >
            Invitar barbero
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#9CA3AF] transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Cerrar modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Input
            ref={firstInputRef}
            label="Email del barbero"
            type="email"
            placeholder="barbero@ejemplo.com"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            error={emailError}
            required
            autoComplete="email"
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-white" htmlFor="invite-message">
              Mensaje personalizado{' '}
              <span className="text-[#6B7280] font-normal">(opcional)</span>
            </label>
            <textarea
              id="invite-message"
              placeholder="Escribe un mensaje para el barbero..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className={[
                'w-full rounded-md border border-border px-3 py-2 text-sm',
                'bg-surface text-white placeholder:text-[#6B7280]',
                'transition-colors duration-150 resize-none',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background',
              ].join(' ')}
            />
          </div>

          {submitError && (
            <p role="alert" className="text-xs text-red-400">
              {submitError}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Enviar invitacion
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
