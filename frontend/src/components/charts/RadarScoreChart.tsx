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

const COHORT_COLOR = "#6B7280";

interface RadarScoreChartProps {
  dimensionScores: Record<string, number>;
  cohortScores?: Record<string, number>;
  maxScore?: number;
  size?: number;
  animated?: boolean;
  showLegend?: boolean;
}

export default function RadarScoreChart({
  dimensionScores,
  cohortScores,
  maxScore = 5,
  size = 280,
  animated = true,
  showLegend = true,
}: RadarScoreChartProps) {
  const chartData = Object.entries(dimensionScores).map(([key, score]) => ({
    dimension: DIMENSION_LABELS[key] || key.replace(/_/g, " "),
    score,
    cohort: cohortScores?.[key] ?? null,
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
            name="You"
            stroke={CHART_COLORS.radar.stroke}
            fill={CHART_COLORS.radar.fill}
            strokeWidth={2}
            dot={{ r: 4, fill: CHART_COLORS.radar.stroke }}
            isAnimationActive={animated}
            animationDuration={1000}
            animationEasing="ease-out"
          />
          {cohortScores && (
            <Radar
              dataKey="cohort"
              name="Cohort Avg"
              stroke={COHORT_COLOR}
              fill={COHORT_COLOR}
              fillOpacity={0.1}
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={{ r: 3, fill: COHORT_COLOR }}
              isAnimationActive={animated}
              animationDuration={1000}
              animationEasing="ease-out"
            />
          )}
        </RadarChart>
      </ResponsiveContainer>

      {showLegend && (
        <div className="space-y-2 mt-2 px-4">
          {cohortScores && (
            <div className="flex justify-center gap-4 text-xs text-cm-muted mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: CHART_COLORS.radar.stroke }} />
                You
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 inline-block rounded border-t border-dashed" style={{ borderColor: COHORT_COLOR }} />
                Cohort Avg
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {Object.entries(dimensionScores).map(([dim, score]) => (
              <div key={dim} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: DIMENSION_COLORS[dim] || CHART_COLORS.radar.stroke }}
                  />
                  <span className="text-cm-muted">{DIMENSION_LABELS[dim] || dim}</span>
                </span>
                <span className="text-cm-text font-semibold">
                  {score}/{maxScore}
                  {cohortScores?.[dim] != null && (
                    <span className="text-cm-muted font-normal ml-1">
                      ({cohortScores[dim].toFixed(1)})
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
