import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // EQB Brand Colors
        eqb: {
          wood: {
            primary: '#27201B',    // Logo primary wood
            secondary: '#382D28',  // Palette primary
            dark: '#392D28',       // Palette secondary
          },
          neutral: {
            warmWhite: '#F4F1EC',
          },
        },
        // Legacy colors (fallback)
        primary: '#382D28',
        secondary: '#392D28',
      },
      fontFamily: {
        // EQB Typography
        'logo': ['Chopard', 'serif'],
        'body': ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
