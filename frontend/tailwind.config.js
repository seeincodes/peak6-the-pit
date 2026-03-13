/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "cm-bg": "rgb(var(--cm-bg) / <alpha-value>)",
        "cm-card": "rgb(var(--cm-card) / <alpha-value>)",
        "cm-card-raised": "rgb(var(--cm-card-raised) / <alpha-value>)",
        "cm-border": "rgb(var(--cm-border) / <alpha-value>)",
        "cm-primary": "rgb(var(--cm-primary) / <alpha-value>)",
        "cm-cyan": "rgb(var(--cm-primary) / <alpha-value>)",
        "cm-lime": "rgb(var(--cm-lime) / <alpha-value>)",
        "cm-emerald": "rgb(var(--cm-emerald) / <alpha-value>)",
        "cm-amber": "rgb(var(--cm-amber) / <alpha-value>)",
        "cm-red": "rgb(var(--cm-red) / <alpha-value>)",
        "cm-text": "rgb(var(--cm-text) / <alpha-value>)",
        "cm-muted": "rgb(var(--cm-muted) / <alpha-value>)",
        "cm-accent": "rgb(var(--cm-accent) / <alpha-value>)",
      },
      fontFamily: {
        sans: ['"DM Sans"', '"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        "neon-cyan": "none",
        "neon-emerald": "none",
        "card": "0 6px 18px rgba(69, 42, 11, 0.06), 0 2px 6px rgba(69, 42, 11, 0.04)",
        "card-hover": "0 10px 28px rgba(69, 42, 11, 0.1), 0 3px 10px rgba(69, 42, 11, 0.08)",
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "14px",
        md: "16px",
        lg: "20px",
        xl: "24px",
      },
      animation: {
        "score-fill": "score-fill 1s ease-out forwards",
        "xp-float": "xp-float 1.5s ease-out forwards",
      },
      keyframes: {
        "score-fill": {
          "0%": { width: "0%" },
          "100%": { width: "var(--target-width)" },
        },
        "xp-float": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-40px)" },
        },
      },
    },
  },
  plugins: [],
};
