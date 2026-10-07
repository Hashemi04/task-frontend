import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', 'Tahoma', 'sans-serif'],
      },
      colors: {
        ink: '#141414',
        accent: '#F0B90B',
        panel: '#2C2E30',
        surface: '#404244',
        placeholder: '#4F5154',
        field: '#3B3D3F',
        badge: '#2F3337',
        control: '#323436',
        'control-edge': '#4A4C4F',
        edge: '#343638',
        track: '#D9D9D9',
        link: '#6EC0E0',
      },
    },
  },
} satisfies Config
