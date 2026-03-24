import type { Config } from 'tailwindcss'
import { colors, fontFamilies, fontSizes, spacing, borderRadius } from '@barcutx/design-tokens'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        premium: colors.premium,
        background: colors.background,
        surface: colors.surface,
        border: colors.border,
        available: colors.available,
        moderate: colors.moderate,
        busy: colors.busy,
      },
      fontFamily: {
        sans: [fontFamilies.primary, fontFamilies.fallback],
        display: [fontFamilies.secondary, fontFamilies.fallback],
      },
      borderRadius: {
        sm: `${borderRadius.sm}px`,
        md: `${borderRadius.md}px`,
        lg: `${borderRadius.lg}px`,
        xl: `${borderRadius.xl}px`,
      },
    },
  },
  plugins: [],
}

export default config
