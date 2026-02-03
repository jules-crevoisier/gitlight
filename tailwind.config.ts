import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: 'var(--bg)',
        'background-muted': 'var(--bg-muted)',
        foreground: 'var(--text)',
        'foreground-muted': 'var(--text-muted)',
        border: 'var(--border)',
      },
    },
  },
  plugins: [],
}

export default config
