/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
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
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        "neon-cyan": "none",
        "neon-emerald": "none",
        "card": "0 1px 3px rgba(0, 0, 0, 0.4)",
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "4px",
        md: "4px",
        lg: "6px",
        xl: "8px",
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
  plugins: [require("@tailwindcss/typography")],
};
