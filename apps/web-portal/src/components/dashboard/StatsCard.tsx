import { type ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  trend?: {
    value: number
    label: string
    positive: boolean
  }
}

/**
 * StatsCard — dashboard metric card with optional icon and trend indicator.
 *
 * Props:
 * - title: metric label
 * - value: primary numeric/string value
 * - description: secondary text below the value (optional)
 * - icon: any ReactNode rendered in the top-right corner (optional)
 * - trend: optional trend object with value, label, and direction
 */
function StatsCard({ title, value, description, icon, trend }: StatsCardProps) {
  return (
    <Card bordered>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-[#9CA3AF]">
            {title}
          </CardTitle>
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-white">{value}</p>
        {description && (
          <p className="mt-1 text-xs text-[#6B7280]">{description}</p>
        )}
        {trend && (
          <div
            className={[
              'mt-2 flex items-center gap-1 text-xs font-medium',
              trend.positive ? 'text-green-400' : 'text-red-400',
            ].join(' ')}
          >
            <span>{trend.positive ? '+' : '-'}{Math.abs(trend.value)}</span>
            <span className="text-[#6B7280]">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { StatsCard, type StatsCardProps }
