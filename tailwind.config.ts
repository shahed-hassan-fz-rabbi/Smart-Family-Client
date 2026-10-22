import type { Config } from 'tailwindcss';

/**
 * Theme tokens are CSS variables (see src/app/globals.css) so that the whole
 * palette — and therefore every existing sf-* utility — switches automatically
 * between Light and Dark (class `dark` on <html>, set before first paint).
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sf: {
          midnight: 'rgb(var(--sf-midnight) / <alpha-value>)',
          ink: 'rgb(var(--sf-ink) / <alpha-value>)',
          charcoal: 'rgb(var(--sf-charcoal) / <alpha-value>)',
          white: 'rgb(var(--sf-white) / <alpha-value>)',
          orange: 'rgb(var(--sf-orange) / <alpha-value>)',
          'deep-orange': 'rgb(var(--sf-deep-orange) / <alpha-value>)',
          cream: 'rgb(var(--sf-cream) / <alpha-value>)',
          'light-orange': 'rgb(var(--sf-light-orange) / <alpha-value>)',
          'muted-gray': 'rgb(var(--sf-muted-gray) / <alpha-value>)',
          'border-gray': 'rgb(var(--sf-border-gray) / <alpha-value>)',
          success: 'rgb(var(--sf-success) / <alpha-value>)',
          warning: 'rgb(var(--sf-warning) / <alpha-value>)',
          error: 'rgb(var(--sf-error) / <alpha-value>)',
        },
      },
      backgroundImage: {
        // Static brand gradients — identical in both themes by design.
        'grad-dark': 'linear-gradient(120deg, #111111 0%, #262626 55%, #7C2D12 100%)',
        'grad-primary': 'linear-gradient(135deg, #C2410C 0%, #FF7A18 55%, #FDBA74 100%)',
        // Page background gradient follows the theme tokens.
        'grad-light':
          'linear-gradient(135deg, rgb(var(--sf-cream)) 0%, rgb(var(--sf-white)) 65%, rgb(var(--sf-light-orange)) 100%)',
      },
      boxShadow: {
        card: '0 1px 3px rgba(17,17,17,0.06), 0 4px 16px rgba(17,17,17,0.05)',
        'card-hover': '0 2px 6px rgba(17,17,17,0.08), 0 8px 24px rgba(194,65,12,0.10)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
