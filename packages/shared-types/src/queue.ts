export type QueueEntryStatus =
  | 'waiting'
  | 'called'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type QueueEntrySource = 'mobile' | 'web' | 'walk_in'

export interface QueueEntry {
  id: string
  barberShopId: string
  barberId?: string
  userId: string
  serviceId: string
  status: QueueEntryStatus
  queuePosition: number
  peopleAhead: number
  priorityScore: number
  estimatedDurationMinutes: number
  etaAtJoin: string
  currentEta: string
  joinedAt: string
  acceptedAt?: string
  startedAt?: string
  finishedAt?: string
  source: QueueEntrySource
}

export interface QueueUpdate {
  type: 'queue_update'
  shopId: string
  data: {
    queueLength: number
    yourPosition?: number
    yourEtaMinutes?: number
    entries: QueueEntryPublic[]
  }
  timestamp: string
}

export interface QueueEntryPublic {
  id: string
  position: number
  status: QueueEntryStatus
  etaMinutes: number
}
