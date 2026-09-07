/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '18px' }],
        sm: ['14px', { lineHeight: '22px' }],
        base: ['16px', { lineHeight: '24px', letterSpacing: '-0.25px' }],
        lg: ['18px', { lineHeight: '27px', letterSpacing: '-0.25px' }],
        xl: ['20px', { lineHeight: '30px', letterSpacing: '-0.25px' }],
        '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.25px' }],
        '3xl': ['30px', { lineHeight: '40px', letterSpacing: '-0.25px' }],
        '4xl': ['36px', { lineHeight: '45px', letterSpacing: '-0.72px' }],
        '5xl': ['48px', { lineHeight: '60px', letterSpacing: '-0.96px' }],
        '6xl': ['60px', { lineHeight: '72px', letterSpacing: '-1.2px' }],
      },
      colors: {
        gray: {
          50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 300: '#BFC4CD',
          400: '#9CA3AF', 500: '#6B7280', 600: '#4B5563', 700: '#374151',
          800: '#1F2937', 900: '#111827', 950: '#030712',
        },
        violet: {
          50: '#F1EEFF', 100: '#E6E1FF', 200: '#D2CBFF', 300: '#B7ACFF',
          400: '#9C8CFF', 500: '#8470FF', 600: '#755FF8', 700: '#5D47DE',
          800: '#4634B1', 900: '#1C1357',
        },
        green: {
          50: '#D2FFE2', 100: '#B8FCD3', 200: '#8EF5B6', 300: '#5FE997',
          400: '#3EC972', 500: '#3EC972', 600: '#34BD68', 700: '#239F52',
          800: '#166F3B', 900: '#0A3F1E',
        },
        red: {
          50: '#FFE8E8', 100: '#FFD1D1', 200: '#FFA8A8', 300: '#FF7D7D',
          400: '#FF6B6B', 500: '#FF5656', 600: '#FA4949', 700: '#E63939',
          800: '#B92A2A', 900: '#600F0F',
        },
        yellow: {
          50: '#FFF2C9', 100: '#FFE79E', 200: '#FBDB72', 300: '#F7CC4D',
          400: '#F3C33F', 500: '#F0BB33', 600: '#DFAD2B', 700: '#BC9021',
          800: '#8A6A18', 900: '#5C480F', 950: '#342809',
        },
        sky: {
          50: '#E3F3FF', 100: '#C7E7FF', 200: '#9BD5FF', 300: '#82CBFF',
          400: '#74C5FF', 500: '#67BFFF', 600: '#56B1F3', 700: '#3193DA',
          800: '#1D5F8C', 900: '#0B324F',
        },
      },
      spacing: {
        1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px',
        8: '32px', 10: '40px', 12: '48px', 16: '64px', 20: '80px',
      },
      borderRadius: {
        sm: '4px', md: '8px', lg: '12px', xl: '16px',
      },
      boxShadow: {
        hairline: '0 1px 2px 0 rgba(3,7,18,0.02)',
        card: '0 1px 1px 0 rgba(3,7,18,0.06), 0 1px 2px 0 rgba(3,7,18,0.02)',
        popover: '0 1px 3px 0 rgba(3,7,18,0.08), 0 1px 2px 0 rgba(3,7,18,0.04)',
        modal: '0 10px 25px -5px rgba(3,7,18,0.10), 0 8px 10px -6px rgba(3,7,18,0.04)',
      },
      maxWidth: {
        content: '1216px',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fade-in 0.2s ease-out forwards',
      },
    },
  },
  plugins: [],
}
