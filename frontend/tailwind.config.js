/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "cm-bg": "#0f0f1a",
        "cm-card": "#1a1a2e",
        "cm-border": "#2a2a4a",
        "cm-primary": "#6C5CE7",
        "cm-cyan": "#6C5CE7",
        "cm-emerald": "#00C9A7",
        "cm-amber": "#FBBF24",
        "cm-red": "#FF6B6B",
        "cm-text": "#E8E8F0",
        "cm-muted": "#9494B8",
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        "neon-cyan": "none",
        "neon-emerald": "none",
        "card": "0 2px 8px rgba(0, 0, 0, 0.3)",
        "card-hover": "0 4px 16px rgba(0, 0, 0, 0.4)",
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
