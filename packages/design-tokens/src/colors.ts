/**
 * BarcutX Design Tokens — Colors
 * Brand: dark premium theme, Burnt Orange accent
 */
export const colors = {
  // Brand
  primary: '#E56A2E',       // Burnt Orange — buttons, CTA, brand highlights
  premium: '#C87B3C',       // Copper Accent — membership, premium badges

  // Backgrounds
  background: '#0F1115',    // Graphite Black — main app background
  surface: '#171A21',       // Charcoal Panel — cards, lists, containers

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',

  // Status / ETA
  available: '#1DBF73',     // green — short wait (< 10 min)
  moderate: '#F2B544',      // amber — medium wait (10-30 min)
  busy: '#D9534F',          // red — long wait (> 30 min)

  // UI
  border: '#2A2D35',
  overlay: 'rgba(0,0,0,0.6)',

  // White shades
  white: '#FFFFFF',
  white10: 'rgba(255,255,255,0.1)',
  white20: 'rgba(255,255,255,0.2)',
} as const

export type ColorToken = keyof typeof colors
