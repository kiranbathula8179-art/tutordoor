/**
 * TutorDoor design system.
 *
 * Visual concept: "the tools of tutoring" — a chalkboard, notebook paper,
 * and a tutor's red-pen correction in the margin — instead of a generic
 * SaaS gradient. See src/styles/DESIGN.md for the full rationale.
 */
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        board: {
          DEFAULT: "#1F3A34",
          light: "#2D5147",
          dark: "#152922",
        },
        paper: {
          DEFAULT: "#F7F6F1",
          dim: "#EFEDE5",
        },
        chalk: "#FDFBF3",
        ink: {
          DEFAULT: "#1B2B26",
          soft: "#4A5A55",
          faint: "#7C8C86",
        },
        "pen-red": {
          DEFAULT: "#C23B32",
          dark: "#9E2E27",
          light: "#E8867E",
        },
        "gold-star": {
          DEFAULT: "#F4B400",
          dark: "#C99000",
          light: "#F7D774",
        },
        /* ---- V3 "Bright" (see src/styles/DESIGN_V3.md) ---- */
        primary: {
          subtle: "#EFF6FF",
          light: "#3B82F6",
          DEFAULT: "#2563EB",
          dark: "#1E40AF",
        },
        secondary: {
          subtle: "#ECFEFF",
          DEFAULT: "#06B6D4",
          dark: "#0E7490",
        },
        accent: {
          subtle: "#FFF7ED",
          DEFAULT: "#F97316",
          dark: "#C2410C",
        },
        success: { subtle: "#F0FDF4", DEFAULT: "#43A047", dark: "#2E7D32" },
        warning: { subtle: "#FFFBEB", DEFAULT: "#D97706", dark: "#B45309" },
        danger: { subtle: "#FEF2F2", DEFAULT: "#DC2626", dark: "#B91C1C" },
        info: { subtle: "#F0F9FF", DEFAULT: "#0284C7", dark: "#0369A1" },
        /* WARM ACADEMIC PREMIUM (V24): warm cream canvas replaces cool white.
           Page = warm wheat, cards = ivory, borders = warm sand. */
        canvas: "#FFFDF9",
        surface: { DEFAULT: "#F7F2E8", 2: "#F9F5EC", 3: "#EFE6D6", 4: "#E4D5BE" },
        line: "#E6D8C3",
        navy: { subtle: "#EAF0F6", DEFAULT: "#1E3A5F", dark: "#152A46" },
        brick: { subtle: "#F3E4DC", DEFAULT: "#A65A3A", dark: "#8A4A2F" },
      },
      fontFamily: {
        /* V3 (DESIGN_V3.md): Jakarta for display, Inter for everything else.
           grotesk remains only until the v2 dark surfaces are restaged. */
        display: ["\"Plus Jakarta Sans\"", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        jakarta: ["\"Plus Jakarta Sans\"", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["\"IBM Plex Mono\"", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "display-xl": ["4.5rem", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        "display-lg": ["3.25rem", { lineHeight: "1.05", letterSpacing: "-0.015em" }],
        "display-md": ["2.5rem", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
        "display-sm": ["1.875rem", { lineHeight: "1.2" }],
      },
      borderRadius: {
        card: "1.25rem",
        pill: "999px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(27,43,38,0.04), 0 8px 24px -8px rgba(27,43,38,0.12)",
        "card-hover": "0 4px 12px rgba(27,43,38,0.08), 0 16px 40px -12px rgba(27,43,38,0.18)",
        board: "0 20px 60px -20px rgba(21,41,34,0.5)",
        /* ---- V3 neutral shadow scale ---- */
        soft: "0 1px 2px 0 rgb(120 90 60 / 0.06), 0 1px 3px 0 rgb(120 90 60 / 0.09)",
        hover: "0 4px 12px -2px rgb(120 90 60 / 0.12), 0 2px 6px -2px rgb(120 90 60 / 0.07)",
        dropdown: "0 10px 24px -6px rgb(120 90 60 / 0.16), 0 4px 8px -4px rgb(120 90 60 / 0.09)",
        dialog: "0 24px 48px -12px rgb(120 90 60 / 0.22), 0 8px 16px -8px rgb(120 90 60 / 0.11)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "chalk-dust": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.5" },
        },
        /* ---- v2 organic motion ---- */
        "float-slow": {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -8px, 0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out forwards",
        "chalk-dust": "chalk-dust 6s ease-in-out infinite",
        "float-slow": "float-slow 7s ease-in-out infinite",
      },
      backgroundImage: {
        "chalk-texture":
          "radial-gradient(circle at 20% 30%, rgba(253,251,243,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(253,251,243,0.02) 0%, transparent 50%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
