/**
 * Programmatic token access for components that need values in JS/TS.
 * CSS custom properties are the source of truth (brand.css).
 */

export const tokens = {
  colors: {
    primary: {
      50: 'var(--color-primary-50)',
      500: 'var(--color-primary-500)',
      600: 'var(--color-primary-600)',
      700: 'var(--color-primary-700)',
    },
    neutral: {
      50: 'var(--color-neutral-50)',
      200: 'var(--color-neutral-200)',
      500: 'var(--color-neutral-500)',
      900: 'var(--color-neutral-900)',
    },
    bg: 'var(--color-bg)',
    bgSubtle: 'var(--color-bg-subtle)',
    border: 'var(--color-border)',
    success500: 'var(--color-success-500)',
    error500: 'var(--color-error-500)',
  },
  font: {
    sans: 'var(--font-family-sans)',
    mono: 'var(--font-family-mono)',
  },
  radius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
  },
} as const;

export type Tokens = typeof tokens;
