import { ETA_STATUS } from '@barcutx/shared-constants'

export type EtaLevel = 'available' | 'moderate' | 'busy'

export function getEtaLevel(etaMinutes: number): EtaLevel {
  if (etaMinutes <= ETA_STATUS.AVAILABLE) return 'available'
  if (etaMinutes <= ETA_STATUS.MODERATE) return 'moderate'
  return 'busy'
}

export function formatEtaRange(etaMinutes: number, varianceMinutes = 5): string {
  const low = Math.max(0, etaMinutes - varianceMinutes)
  const high = etaMinutes + varianceMinutes
  if (low === 0) return `< ${high} min`
  return `${low}-${high} min`
}
