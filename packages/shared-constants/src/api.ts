export const API_VERSION = 'v1'
export const API_BASE_PATH = `/api/${API_VERSION}`

export const WS_EVENTS = {
  QUEUE_UPDATE: 'queue_update',
  SHOP_STATUS: 'shop_status',
  BARBER_STATUS: 'barber_status',
  PING: 'ping',
  PONG: 'pong',
} as const
