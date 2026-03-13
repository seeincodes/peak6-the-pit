/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "cm-bg": "#0B0B1A",
        "cm-card": "#16163a",
        "cm-card-raised": "#1e1e4a",
        "cm-border": "#2e2e5a",
        "cm-primary": "#4D34EF",
        "cm-cyan": "#4D34EF",
        "cm-lime": "#C8FB50",
        "cm-emerald": "#34D399",
        "cm-amber": "#FCD34D",
        "cm-red": "#FB7185",
        "cm-text": "#F1F1F8",
        "cm-muted": "#A0A0C0",
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
  plugins: [],
};
