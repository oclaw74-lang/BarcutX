export const SUPPORTED_CURRENCIES = ['usd', 'eur', 'mxn', 'cop', 'ars'] as const
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

export const DEFAULT_CURRENCY: SupportedCurrency = 'usd'

// Platform fee percentage charged on each transaction
export const PLATFORM_FEE_PERCENT = 7
