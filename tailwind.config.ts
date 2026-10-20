import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sf: {
          midnight: '#111111',
          charcoal: '#262626',
          white: '#FFFFFF',
          orange: '#FF7A18',
          'deep-orange': '#C2410C',
          cream: '#FFF7ED',
          'light-orange': '#FFEDD5',
          'muted-gray': '#737373',
          'border-gray': '#E5E5E5',
          success: '#15803D',
          warning: '#F59E0B',
          error: '#DC2626',
        },
      },
      backgroundImage: {
        'grad-dark': 'linear-gradient(120deg, #111111 0%, #262626 55%, #7C2D12 100%)',
        'grad-primary': 'linear-gradient(135deg, #C2410C 0%, #FF7A18 55%, #FDBA74 100%)',
        'grad-light': 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 65%, #FFEDD5 100%)',
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
