import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { CHART_COLORS, tooltipStyle } from "../../theme/chartTheme";

export interface ChartData {
  chart_type: "line" | "multi_line" | "area";
  title: string;
  x_label?: string;
  y_label?: string;
  zero_line?: boolean;
  series: { name: string; key: string; color?: string }[];
  data: Record<string, number>[];
}

const SERIES_COLORS = ["#4D34EF", "#34D399", "#FB7185", "#FBBF24", "#818CF8"];

export default function InlineChart({ chart }: { chart: ChartData }) {
  const xKey = useMemo(() => {
    if (!chart.data?.length) return "x";
    const keys = Object.keys(chart.data[0]);
    const seriesKeys = chart.series.map((s) => s.key);
    return keys.find((k) => !seriesKeys.includes(k)) || keys[0];
  }, [chart]);

  if (!chart.data?.length) return null;

  const renderChart = () => {
    if (chart.chart_type === "area") {
      const seriesKey = chart.series[0]?.key || "y";
      const seriesColor = chart.series[0]?.color || SERIES_COLORS[0];
      return (
        <AreaChart data={chart.data}>
          <defs>
            <linearGradient id={`grad-${chart.title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={seriesColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={seriesColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey={xKey}
            tick={{ fill: CHART_COLORS.axis, fontSize: 10 }}
            label={chart.x_label ? { value: chart.x_label, position: "insideBottom", offset: -5, fill: CHART_COLORS.axis, fontSize: 11 } : undefined}
          />
          <YAxis
            tick={{ fill: CHART_COLORS.axis, fontSize: 10 }}
            label={chart.y_label ? { value: chart.y_label, angle: -90, position: "insideLeft", fill: CHART_COLORS.axis, fontSize: 11 } : undefined}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone"
            dataKey={seriesKey}
            stroke={seriesColor}
            strokeWidth={2}
            fill={`url(#grad-${chart.title})`}
            animationDuration={800}
          />
        </AreaChart>
      );
    }

    // line or multi_line
    return (
      <LineChart data={chart.data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis
          dataKey={xKey}
          tick={{ fill: CHART_COLORS.axis, fontSize: 10 }}
          label={chart.x_label ? { value: chart.x_label, position: "insideBottom", offset: -5, fill: CHART_COLORS.axis, fontSize: 11 } : undefined}
        />
        <YAxis
          tick={{ fill: CHART_COLORS.axis, fontSize: 10 }}
          label={chart.y_label ? { value: chart.y_label, angle: -90, position: "insideLeft", fill: CHART_COLORS.axis, fontSize: 11 } : undefined}
        />
        <Tooltip contentStyle={tooltipStyle} />
        {chart.zero_line && (
          <ReferenceLine y={0} stroke={CHART_COLORS.axis} strokeDasharray="4 4" />
        )}
        {chart.series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color || SERIES_COLORS[i % SERIES_COLORS.length]}
            strokeWidth={2}
            dot={false}
            animationDuration={800}
          />
        ))}
        {chart.series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
      </LineChart>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-3 rounded-lg border border-cm-border/10 bg-cm-bg/50 p-3"
    >
      <div className="text-xs font-semibold text-cm-muted mb-2">{chart.title}</div>
      <ResponsiveContainer width="100%" height={220}>
        {renderChart()}
      </ResponsiveContainer>
    </motion.div>
  );
}
