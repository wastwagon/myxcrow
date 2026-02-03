/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        brand: {
          gold: '#d0ab63',
          maroon: '#8f2126',
          'maroon-dark': '#59191f',
          'maroon-darker': '#41151d',
          'maroon-deep': '#331518',
          'maroon-black': '#160f10',
          'maroon-charcoal': '#1f1414',
          'maroon-rust': '#3f181c',
        },
        primary: {
          DEFAULT: '#d0ab63',
          foreground: '#160f10',
          50: '#fdf8ed',
          100: '#f9ecd4',
          200: '#f2d9a8',
          300: '#e9c078',
          400: '#d0ab63',
          500: '#b89247',
          600: '#9a7639',
          700: '#7a5c30',
          800: '#654c2c',
          900: '#554028',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}

