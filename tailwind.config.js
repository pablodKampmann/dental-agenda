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
        'move-from-right': 'move-from-right 0.3s ease-out',
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
        'move-from-right': {
          '0%': { opacity: '1', transform: 'translateX(50%)' },
          '10%': { opacity: '1', transform: 'translateX(35%)' },
          '20%': { opacity: '1', transform: 'translateX(20%)' },
          '30%': { opacity: '1', transform: 'translateX(5%)' },
          '40%': { opacity: '1', transform: 'translateX(0%)' },
          '50%': { opacity: '1', transform: 'translateX(-10%)' },
          '60%': { opacity: '1', transform: 'translateX(-5%)' },
          '70%': { opacity: '1', transform: 'translateX(0%)' },
          '80%': { opacity: '1', transform: 'translateX(10%)' },
          '90%': { opacity: '1', transform: 'translateX(5%)' },
          '100%': { opacity: '1', transform: 'translateX(0%)' },
        },
      },
    },
  },
  plugins: [],
}
