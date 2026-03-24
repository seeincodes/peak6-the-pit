import { colors } from "./colors";

export const CHART_COLORS = {
  grid: "rgba(16, 185, 129, 0.1)",
  axis: colors.muted,
  tooltip: {
    bg: colors.card,
    border: "rgba(16, 185, 129, 0.15)",
    text: colors.text,
  },
  radar: {
    fill: "rgba(16, 185, 129, 0.18)",
    stroke: colors.primary,
  },
} as const;

export const DIMENSION_LABELS: Record<string, string> = {
  reasoning: "Reasoning",
  terminology: "Terminology",
  trade_logic: "Trade Logic",
  risk_awareness: "Risk Awareness",
};

export const DIMENSION_COLORS: Record<string, string> = {
  reasoning: "#4ade80",
  terminology: "#38bdf8",
  trade_logic: "#a78bfa",
  risk_awareness: "#fbbf24",
};

export const CATEGORY_CHART_TYPE: Record<string, "line" | "candle" | "area" | "heatmap"> = {
  iv_analysis: "area",
  realized_vol: "line",
  greeks: "area",
  order_flow: "candle",
  macro: "line",
  term_structure: "line",
  skew: "area",
  correlation: "heatmap",
  event_vol: "candle",
  tail_risk: "area",
  position_sizing: "line",
  trade_structuring: "candle",
  vol_surface: "heatmap",
  microstructure: "candle",
  risk_management: "area",
  technical_analysis: "candle",
  sentiment: "line",
  fundamentals: "line",
  fixed_income: "line",
  seasonality: "area",
  exotic_structures: "heatmap",
  commodities: "candle",
  crypto: "candle",
  geopolitical: "line",
  alt_data: "area",
  portfolio_mgmt: "line",
  pit_tooling: "line",
};

/** Seeded PRNG for deterministic chart data from scenario IDs */
export function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}

export const tooltipStyle = {
  backgroundColor: CHART_COLORS.tooltip.bg,
  border: `1px solid ${CHART_COLORS.tooltip.border}`,
  borderRadius: 6,
  color: CHART_COLORS.tooltip.text,
  fontSize: 12,
};
