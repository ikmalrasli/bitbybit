/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    {pattern: /^bg-(red|green|blue|yellow|pink|violet|emerald|orange)-300$/},
    {pattern: /^bg-(red|green|blue|yellow|pink|violet|emerald|orange)-400$/},
    {pattern: /^bg-(red|green|blue|yellow|pink|violet|emerald|orange)-400$/,
      variants: ['hover', 'active'],
    },
    {pattern: /^bg-(red|green|blue|yellow|pink|violet|emerald|orange)-500$/,
      variants: ['hover', 'active'],
    },
    {pattern: /^border-(red|green|blue|yellow|pink|violet|emerald|orange)-500$/},
    {pattern: /^border-(red|green|blue|yellow|pink|violet|emerald|orange)-500$/,
      variants: ['focus']
    },
    {pattern: /^ring-(red|green|blue|yellow|pink|violet|emerald|orange)-500$/,
      variants: ['focus', 'focus-within']
    },
    {pattern: /^text-(red|green|blue|yellow|pink|violet|emerald|orange)-400$/},
    {pattern: /^accent-(red|green|blue|yellow|pink|violet|emerald|orange)-400$/},
    {pattern: /^fill-(red|green|blue|yellow|pink|violet|emerald|orange)-400$/},
    {pattern: /^text-(red|green|blue|yellow|pink|violet|emerald|orange)-300$/},
    {pattern: /^accent-(red|green|blue|yellow|pink|violet|emerald|orange)-300$/},
    {pattern: /^fill-(red|green|blue|yellow|pink|violet|emerald|orange)-300$/},
  ]
}