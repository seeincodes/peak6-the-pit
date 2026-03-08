export const colors = {
  bg: "#0a0e17",
  card: "#111827",
  border: "#1e293b",
  cyan: "#00f0ff",
  emerald: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  text: "#e2e8f0",
  muted: "#64748b",
} as const;

export const categoryColors: Record<string, string> = {
  iv_analysis: "#00f0ff",
  greeks: "#8b5cf6",
  order_flow: "#f59e0b",
  macro: "#ef4444",
  term_structure: "#10b981",
  skew: "#ec4899",
  correlation: "#06b6d4",
  event_vol: "#f97316",
  tail_risk: "#dc2626",
  position_sizing: "#14b8a6",
  trade_structuring: "#a855f7",
  vol_surface: "#3b82f6",
  microstructure: "#6366f1",
  risk_management: "#eab308",
  capman_tooling: "#22d3ee",
};
