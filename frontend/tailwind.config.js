/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Christian-inspired color palette
        sacred: {
          50: '#faf8f5',
          100: '#f5f1ea',
          200: '#e8dfd0',
          300: '#d9c9b0',
          400: '#c4ab88',
          500: '#b08d60',
          600: '#967544',
          700: '#6d5436',
          800: '#4a3825',
          900: '#2d2217',
        },
        divine: {
          50: '#f0f4f8',
          100: '#e1e9f1',
          200: '#c3d4e3',
          300: '#97b4cf',
          400: '#6691b8',
          500: '#4a739e',
          600: '#3d5d82',
          700: '#2f4766',
          800: '#233549',
          900: '#16202d',
        },
        grace: {
          50: '#fdfcfb',
          100: '#fbf7f2',
          200: '#f6ede1',
          300: '#ede2d0',
          400: '#dccfb8',
          500: '#c6b79d',
          600: '#a8937a',
          700: '#7d6d5a',
          800: '#55493d',
          900: '#322b24',
        },
        heaven: {
          50: '#f5f7fa',
          100: '#ebeef4',
          200: '#d7dfe9',
          300: '#b8c5d7',
          400: '#93a5bf',
          500: '#7486a3',
          600: '#5d6d89',
          700: '#4a5670',
          800: '#3a4255',
          900: '#252d3a',
        },
      },
      fontFamily: {
        serif: ['Crimson Text', 'Georgia', 'serif'],
        display: ['Cinzel', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'sacred-gradient': 'linear-gradient(135deg, #f5f1ea 0%, #e8dfd0 50%, #d9c9b0 100%)',
        'divine-gradient': 'linear-gradient(135deg, #e1e9f1 0%, #c3d4e3 50%, #97b4cf 100%)',
        'heaven-radial': 'radial-gradient(ellipse at top, #ebeef4, #f5f7fa)',
      },
      boxShadow: {
        'sacred': '0 4px 20px rgba(176, 141, 96, 0.15)',
        'divine': '0 8px 30px rgba(74, 115, 158, 0.2)',
        'soft': '0 2px 15px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}
