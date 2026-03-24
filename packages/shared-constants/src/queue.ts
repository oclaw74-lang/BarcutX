export const QUEUE_HEARTBEAT_INTERVAL_MS = 30_000
export const QUEUE_RECONNECT_BASE_DELAY_MS = 1_000
export const QUEUE_RECONNECT_MAX_DELAY_MS = 30_000
export const QUEUE_RECONNECT_MAX_ATTEMPTS = 10

// Minutes threshold to trigger "sal ahora" push
export const QUEUE_NOTIFY_AHEAD_THRESHOLD = 2

// ETA display thresholds (minutes)
export const ETA_STATUS = {
  AVAILABLE: 10,   // green — less than 10 min
  MODERATE: 30,    // amber — 10-30 min
  // above 30 = red
} as const
