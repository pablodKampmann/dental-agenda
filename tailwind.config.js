/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'slide-down': 'slide-down 0.3s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
      },
      keyframes: {
        'slide-down': {
          '0%': { opacity: '1', transform: 'translateY(-100%)' },
          '25%': { opacity: '1', transform: 'translateY(-75%)' },
          '50%': { opacity: '1', transform: 'translateY(-50%)' },
          '75%': { opacity: '1', transform: 'translateY(-25%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '1', transform: 'translateY(0%)' },
          '25%': { opacity: '1', transform: 'translateY(-25%)' },
          '50%': { opacity: '1', transform: 'translateY(-50%)' },
          '75%': { opacity: '1', transform: 'translateY(-75%)' },
          '100%': { opacity: '1', transform: 'translateY(-100%)' },
        },
      },
    },
  },
  plugins: [],
}
