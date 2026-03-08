/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "cm-bg": "#0a0e17",
        "cm-card": "#111827",
        "cm-border": "#1e293b",
        "cm-cyan": "#00f0ff",
        "cm-emerald": "#10b981",
        "cm-amber": "#f59e0b",
        "cm-red": "#ef4444",
        "cm-text": "#e2e8f0",
        "cm-muted": "#64748b",
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        "neon-cyan": "0 0 15px rgba(0, 240, 255, 0.3)",
        "neon-emerald": "0 0 15px rgba(16, 185, 129, 0.3)",
      },
      animation: {
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
        "score-fill": "score-fill 1s ease-out forwards",
        "xp-float": "xp-float 1.5s ease-out forwards",
      },
      keyframes: {
        "pulse-neon": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(0, 240, 255, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(0, 240, 255, 0.6)" },
        },
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
