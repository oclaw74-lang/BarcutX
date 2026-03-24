/**
 * BarcutX Design Tokens — Typography
 * Primary: Inter (UI, forms, dashboards)
 * Secondary: Sora or Manrope (titles, hero, marketing)
 */
export const fontFamilies = {
  primary: 'Inter',
  secondary: 'Sora',
  fallback: 'system-ui, sans-serif',
} as const

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const
