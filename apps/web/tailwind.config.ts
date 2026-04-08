import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─── DA Apparels Luxury Palette ────────────────────────────────────────
      colors: {
        // Primary — deep charcoal blacks
        obsidian: {
          DEFAULT: "#0A0A0A",
          50: "#F5F5F5",
          100: "#E8E8E8",
          200: "#C8C8C8",
          300: "#A8A8A8",
          400: "#787878",
          500: "#484848",
          600: "#282828",
          700: "#181818",
          800: "#101010",
          900: "#0A0A0A",
        },
        // Accent — signature gold
        gold: {
          DEFAULT: "#C9A94A",
          light: "#E8C96D",
          muted: "#9E8038",
          pale: "#F5E9C8",
        },
        // Neutral surface
        ivory: {
          DEFAULT: "#FAF8F3",
          warm: "#F5F0E8",
        },
        // Brand teal — matches the actual DA's Apparel logo
        teal: {
          DEFAULT: "#1a4a3a",
          light: "#2a6a54",
          muted: "#4a7a6a",
          pale: "#e8f4f0",
        },
        // Semantic
        error: "#B91C1C",
        success: "#166534",
      },

      // ─── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        serif: ["'Cormorant Garamond'", "Georgia", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        display: ["'Cormorant'", "Georgia", "serif"],
      },

      // ─── Spacing / Sizing ──────────────────────────────────────────────────
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },

      // ─── Animation ────────────────────────────────────────────────────────
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
        "shimmer": "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
