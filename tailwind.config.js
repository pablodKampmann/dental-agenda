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
        'move-right': 'move-right 0.3s ease-out',     
      },
      keyframes: {
        'move-right': {
          '0%': { transform: 'translateX(0%)', opacity: 1 },
          '50%': { transform: 'translateX(2%)', opacity: .5 },
          '100%': { transform: 'translateX(5%)', opacity: 0 },
        },
      },
    },
  },
  plugins: [],
}
