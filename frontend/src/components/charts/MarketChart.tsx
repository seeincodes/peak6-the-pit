import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CATEGORY_CHART_TYPE, CHART_COLORS, tooltipStyle } from "../../theme/chartTheme";
import { categoryColors } from "../../theme/colors";
import {
  generateLineData,
  generateAreaData,
  generateCandleData,
  generateHeatmapData,
  type HeatmapCell,
} from "./marketDataGenerators";

interface MarketChartProps {
  scenarioId: string;
  category: string;
  height?: number;
  className?: string;
}

function HeatmapGrid({ data }: { data: HeatmapCell[] }) {
  const expiries = ["1W", "1M", "3M", "6M"];
  const strikes = ["90", "95", "100", "105", "110"];
  const ivValues = data.map((d) => d.iv);
  const minIV = Math.min(...ivValues);
  const maxIV = Math.max(...ivValues);

  function getColor(iv: number): string {
    const t = (iv - minIV) / (maxIV - minIV || 1);
    if (t < 0.33) return `rgba(52, 211, 153, ${0.3 + t * 1.5})`; // emerald
    if (t < 0.66) return `rgba(252, 211, 77, ${0.3 + (t - 0.33) * 1.5})`; // amber
    return `rgba(251, 113, 133, ${0.3 + (t - 0.66) * 1.5})`; // red
  }

  return (
    <div className="w-full">
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `40px repeat(${strikes.length}, 1fr)` }}>
        <div />
        {strikes.map((s) => (
          <div key={s} className="text-[9px] text-cm-muted text-center">{s}</div>
        ))}
        {expiries.map((expiry) => (
          <>
            <div key={`label-${expiry}`} className="text-[9px] text-cm-muted flex items-center">
              {expiry}
            </div>
            {strikes.map((strike) => {
              const cell = data.find((d) => d.strike === strike && d.expiry === expiry);
              return (
                <div
                  key={`${expiry}-${strike}`}
                  className="aspect-square rounded-sm flex items-center justify-center text-[9px] text-cm-text font-mono"
                  style={{ backgroundColor: cell ? getColor(cell.iv) : CHART_COLORS.grid }}
                  title={`Strike ${strike}, Expiry ${expiry}: IV ${cell?.iv}%`}
                >
                  {cell?.iv.toFixed(0)}
                </div>
              );
            })}
          </>
        ))}
      </div>
      <div className="flex justify-between mt-1 px-10">
        <span className="text-[8px] text-cm-muted">Strike</span>
      </div>
    </div>
  );
}

export default function MarketChart({
  scenarioId,
  category,
  height = 180,
  className = "",
}: MarketChartProps) {
  const chartType = CATEGORY_CHART_TYPE[category] || "line";
  const color = categoryColors[category] || "#4D34EF";

  const data = useMemo(() => {
    switch (chartType) {
      case "line":
        return generateLineData(scenarioId);
      case "area":
        return generateAreaData(scenarioId);
      case "candle":
        return generateCandleData(scenarioId);
      case "heatmap":
        return generateHeatmapData(scenarioId);
    }
  }, [scenarioId, chartType]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className={`rounded-lg border border-cm-border/10 bg-cm-bg/50 p-3 ${className}`}
    >
      {chartType === "heatmap" ? (
        <div>
          <div className="text-[10px] text-cm-muted mb-2 font-semibold">Vol Surface (IV %)</div>
          <HeatmapGrid data={data as HeatmapCell[]} />
        </div>
      ) : chartType === "candle" ? (
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis dataKey="time" tick={{ fill: CHART_COLORS.axis, fontSize: 9 }} interval="preserveStartEnd" />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="close" fill={`${color}80`} radius={[2, 2, 0, 0]} barSize={6} />
            <Line
              type="monotone"
              dataKey="high"
              stroke={`${color}40`}
              dot={false}
              strokeWidth={1}
              strokeDasharray="2 2"
            />
            <Line
              type="monotone"
              dataKey="low"
              stroke={`${color}40`}
              dot={false}
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          </ComposedChart>
        </ResponsiveContainer>
      ) : chartType === "area" ? (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad-${scenarioId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis dataKey="time" tick={{ fill: CHART_COLORS.axis, fontSize: 9 }} interval="preserveStartEnd" />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${scenarioId})`}
              isAnimationActive
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis dataKey="time" tick={{ fill: CHART_COLORS.axis, fontSize: 9 }} interval="preserveStartEnd" />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2}
              dot={false}
              isAnimationActive
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      <div className="text-right mt-1">
        <span className="text-[9px] text-cm-muted/60">Market Context (Simulated)</span>
      </div>
    </motion.div>
  );
}
