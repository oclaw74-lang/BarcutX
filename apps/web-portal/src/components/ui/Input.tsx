import { type InputHTMLAttributes, forwardRef, useId } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

/**
 * Input — form field primitive.
 *
 * Props:
 * - label: visible label text (optional)
 * - error: validation error message — renders in red below the input
 * - hint: helper text rendered below the input
 * - All standard input HTML attributes are forwarded
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`

    const describedBy = [
      error ? errorId : null,
      hint ? hintId : null,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-white"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          className={[
            'h-10 w-full rounded-md border px-3 text-sm',
            'bg-surface text-white placeholder:text-[#6B7280]',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-busy focus:ring-busy'
              : 'border-border hover:border-[#3A3D45]',
            className,
          ].join(' ')}
          {...props}
        />

        {hint && !error && (
          <p id={hintId} className="text-xs text-[#6B7280]">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} role="alert" className="text-xs text-busy">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export { Input, type InputProps }
