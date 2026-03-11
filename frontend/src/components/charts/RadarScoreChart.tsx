import { motion } from "framer-motion";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, DIMENSION_LABELS, DIMENSION_COLORS } from "../../theme/chartTheme";

interface RadarScoreChartProps {
  dimensionScores: Record<string, number>;
  maxScore?: number;
  size?: number;
  animated?: boolean;
  showLegend?: boolean;
}

export default function RadarScoreChart({
  dimensionScores,
  maxScore = 5,
  size = 280,
  animated = true,
  showLegend = true,
}: RadarScoreChartProps) {
  const chartData = Object.entries(dimensionScores).map(([key, score]) => ({
    dimension: DIMENSION_LABELS[key] || key.replace(/_/g, " "),
    score,
    fullMark: maxScore,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <ResponsiveContainer width="100%" height={size}>
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke={CHART_COLORS.grid} />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
          />
          <PolarRadiusAxis
            domain={[0, maxScore]}
            tick={false}
            axisLine={false}
          />
          <Radar
            dataKey="score"
            stroke={CHART_COLORS.radar.stroke}
            fill={CHART_COLORS.radar.fill}
            strokeWidth={2}
            dot={{ r: 4, fill: CHART_COLORS.radar.stroke }}
            isAnimationActive={animated}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        </RadarChart>
      </ResponsiveContainer>

      {showLegend && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 px-4">
          {Object.entries(dimensionScores).map(([dim, score]) => (
            <div key={dim} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: DIMENSION_COLORS[dim] || CHART_COLORS.radar.stroke }}
                />
                <span className="text-cm-muted">{DIMENSION_LABELS[dim] || dim}</span>
              </span>
              <span className="text-cm-text font-semibold">{score}/{maxScore}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
