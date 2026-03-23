import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(37 99 235)',
        secondary: 'rgb(240 240 240)',
      },
      fontFamily: {
        sans: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif',
        mono: 'var(--font-geist-mono), monospace',
      },
    },
  },
  plugins: [],
};

export default config;
