import { type HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a 1px border using the design token border color */
  bordered?: boolean
}

/**
 * Card — surface container primitive.
 *
 * Props:
 * - bordered: renders a border (default: false)
 * - All standard div HTML attributes are forwarded
 */
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ bordered = false, className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={[
          'bg-surface rounded-lg p-4',
          bordered ? 'border border-border' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </div>
    )
  },
)

Card.displayName = 'Card'

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`mb-3 ${className}`} {...props}>
      {children}
    </div>
  ),
)

CardHeader.displayName = 'CardHeader'

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className = '', children, ...props }, ref) => (
    <h3
      ref={ref}
      className={`font-display text-lg font-semibold text-white ${className}`}
      {...props}
    >
      {children}
    </h3>
  ),
)

CardTitle.displayName = 'CardTitle'

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`text-sm text-[#9CA3AF] ${className}`} {...props}>
      {children}
    </div>
  ),
)

CardContent.displayName = 'CardContent'

export { Card, CardHeader, CardTitle, CardContent, type CardProps }
