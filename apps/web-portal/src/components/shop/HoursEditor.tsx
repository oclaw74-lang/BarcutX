'use client'

import type { WeekHours, DayHours } from '@/hooks/useShopSettings'

const DAY_LABELS: Record<keyof WeekHours, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miercoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sabado',
  sunday: 'Domingo',
}

const DAY_KEYS: Array<keyof WeekHours> = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

interface HoursEditorProps {
  value: WeekHours
  onChange: (updated: WeekHours) => void
}

/**
 * HoursEditor — weekly schedule editor.
 * Each day has an open/closed toggle and, when open, two time inputs.
 *
 * Props:
 * - value: full WeekHours object
 * - onChange: called with the updated WeekHours whenever any field changes
 */
export function HoursEditor({ value, onChange }: HoursEditorProps) {
  function updateDay(day: keyof WeekHours, patch: Partial<DayHours>) {
    onChange({ ...value, [day]: { ...value[day], ...patch } })
  }

  return (
    <div className="flex flex-col gap-3">
      {DAY_KEYS.map((day) => {
        const hours = value[day]
        const label = DAY_LABELS[day]

        return (
          <div
            key={day}
            className="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3"
          >
            {/* Toggle */}
            <label className="relative inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                role="switch"
                aria-checked={hours.open}
                checked={hours.open}
                onChange={(e) => updateDay(day, { open: e.target.checked })}
                className="sr-only"
                aria-label={`${label} abierto`}
              />
              <div
                className={[
                  'h-5 w-9 rounded-full border transition-colors duration-200',
                  hours.open
                    ? 'border-primary bg-primary'
                    : 'border-border bg-[#2A2D35]',
                ].join(' ')}
              >
                <div
                  className={[
                    'h-4 w-4 translate-y-[1px] rounded-full bg-white shadow transition-transform duration-200',
                    hours.open ? 'translate-x-4' : 'translate-x-0.5',
                  ].join(' ')}
                />
              </div>
            </label>

            {/* Day label */}
            <span className="w-20 text-sm font-medium text-white shrink-0">
              {label}
            </span>

            {/* Time inputs */}
            {hours.open ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="time"
                  value={hours.openTime}
                  onChange={(e) => updateDay(day, { openTime: e.target.value })}
                  aria-label={`${label} apertura`}
                  className="h-8 rounded-md border border-border bg-background px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-xs text-[#6B7280]">hasta</span>
                <input
                  type="time"
                  value={hours.closeTime}
                  onChange={(e) => updateDay(day, { closeTime: e.target.value })}
                  aria-label={`${label} cierre`}
                  className="h-8 rounded-md border border-border bg-background px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ) : (
              <span className="text-xs text-[#6B7280]" aria-live="polite">
                Cerrado
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
