import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { TrendingUp, Target, Zap, Award, Users } from "lucide-react";
import api from "../../api/client";
import { CHART_COLORS, tooltipStyle } from "../../theme/chartTheme";
import { categoryColors, categoryDisplay, categoryShortDisplay, colors } from "../../theme/colors";
import RadarScoreChart from "./RadarScoreChart";

interface CohortData {
  score_trend: { date: string; avg_score: number; count: number }[];
  category_performance: { category: string; avg_score: number; attempts: number }[];
  dimension_averages: Record<string, number>;
}

interface PerformanceData {
  score_trend: { date: string; avg_score: number; count: number }[];
  category_performance: { category: string; avg_score: number; attempts: number }[];
  xp_trend: { date: string; xp: number }[];
  dimension_averages: Record<string, number>;
  totals: {
    total_attempts: number;
    total_xp: number;
    avg_score: number;
    best_category: string | null;
    weakest_category: string | null;
  };
  cohort?: CohortData;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="cm-surface p-4">
      <h4 className="cm-heading-sm text-cm-amber mb-3">{title}</h4>
      {children}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="cm-surface p-3 flex items-center gap-3 min-w-0">
      <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: `${color}15` }}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-cm-muted text-xs">{label}</div>
        <div className="text-cm-text font-bold text-lg truncate" title={value}>{value}</div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const COHORT_COLOR = "#6B7280";

function ScoreTrendChart({
  data,
  cohortData,
}: {
  data: PerformanceData["score_trend"];
  cohortData?: CohortData["score_trend"];
}) {
  let merged;
  if (cohortData) {
    const cohortMap = new Map(cohortData.map((d) => [d.date, d.avg_score]));
    const allDates = new Set([...data.map((d) => d.date), ...cohortData.map((d) => d.date)]);
    merged = Array.from(allDates)
      .sort()
      .map((date) => ({
        date: formatDate(date),
        avg_score: data.find((d) => d.date === date)?.avg_score ?? null,
        cohort_avg: cohortMap.get(date) ?? null,
      }));
  } else {
    merged = data.map((d) => ({ ...d, date: formatDate(d.date) }));
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={merged}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis dataKey="date" tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} />
        <YAxis domain={[0, 5]} tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <ReferenceLine y={3.5} stroke={colors.amber} strokeDasharray="4 4" label={{ value: "Mastery", fill: colors.amber, fontSize: 10 }} />
        <Line
          type="monotone"
          dataKey="avg_score"
          name="You"
          stroke={colors.primary}
          strokeWidth={2}
          dot={{ r: 3, fill: colors.primary }}
          connectNulls
          isAnimationActive
          animationDuration={800}
        />
        {cohortData && (
          <Line
            type="monotone"
            dataKey="cohort_avg"
            name="Cohort Avg"
            stroke={COHORT_COLOR}
            strokeWidth={1.5}
            strokeDasharray="6 3"
            dot={false}
            connectNulls
            isAnimationActive
            animationDuration={800}
          />
        )}
        {cohortData && <Legend wrapperStyle={{ fontSize: 11, color: colors.muted }} />}
      </LineChart>
    </ResponsiveContainer>
  );
}

function XPTimelineChart({ data }: { data: PerformanceData["xp_trend"] }) {
  const formatted = data.map((d) => ({ ...d, date: formatDate(d.date) }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formatted}>
        <defs>
          <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.mint} stopOpacity={0.3} />
            <stop offset="95%" stopColor={colors.mint} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis dataKey="date" tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} />
        <YAxis tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area
          type="monotone"
          dataKey="xp"
          stroke={colors.mint}
          strokeWidth={2}
          fill="url(#xpGrad)"
          isAnimationActive
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CategoryBarChart({
  data,
  cohortData,
}: {
  data: PerformanceData["category_performance"];
  cohortData?: CohortData["category_performance"];
}) {
  const cohortMap = cohortData
    ? new Map(cohortData.map((d) => [d.category, d.avg_score]))
    : null;

  const formatted = data.map((d) => ({
    ...d,
    name: categoryDisplay[d.category]?.split(" ")[0] || d.category.replace(/_/g, " "),
    fill: categoryColors[d.category] || colors.primary,
    cohort_avg: cohortMap?.get(d.category) ?? null,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, formatted.length * 32)}>
      <BarChart data={formatted} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
        <XAxis type="number" domain={[0, 5]} tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} />
        <YAxis type="category" dataKey="name" tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} width={80} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [value.toFixed(1), name === "cohort_avg" ? "Cohort Avg" : "Your Score"]} />
        <ReferenceLine x={3.5} stroke={colors.amber} strokeDasharray="4 4" />
        <Bar dataKey="avg_score" name="Your Score" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive animationDuration={800}>
          {formatted.map((entry, i) => (
            <rect key={i} fill={entry.fill} />
          ))}
        </Bar>
        {cohortMap && (
          <Bar dataKey="cohort_avg" name="Cohort Avg" radius={[0, 4, 4, 0]} barSize={8} fill={COHORT_COLOR} fillOpacity={0.5} isAnimationActive animationDuration={800} />
        )}
        {cohortMap && <Legend wrapperStyle={{ fontSize: 11, color: colors.muted }} />}
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function PerformanceCharts() {
  const [days] = useState(30);
  const [showCohort, setShowCohort] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["performance", "history", days, showCohort],
    queryFn: async () => {
      const params = new URLSearchParams({ days: String(days) });
      if (showCohort) params.set("include_cohort", "true");
      const res = await api.get(`/performance/history?${params}`);
      return res.data as PerformanceData;
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-cm-primary text-sm animate-pulse">Loading performance data...</div>
      </div>
    );
  }

  if (!data || data.totals.total_attempts === 0) {
    return (
      <div className="cm-surface p-8 text-center">
        <div className="text-cm-muted text-sm">No performance data yet. Complete some scenarios to see your stats!</div>
      </div>
    );
  }

  const hasDimensions = Object.keys(data.dimension_averages).length > 0;
  const cohort = data.cohort;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Target size={18} style={{ color: colors.primary }} />}
          label="Avg Score"
          value={data.totals.avg_score.toFixed(1)}
          color={colors.primary}
        />
        <StatCard
          icon={<Zap size={18} style={{ color: colors.mint }} />}
          label="Total XP"
          value={data.totals.total_xp.toLocaleString()}
          color={colors.mint}
        />
        <StatCard
          icon={<TrendingUp size={18} style={{ color: colors.emerald }} />}
          label="Attempts"
          value={String(data.totals.total_attempts)}
          color={colors.emerald}
        />
        <StatCard
          icon={<Award size={18} style={{ color: colors.amber }} />}
          label="Best Category"
          value={(() => {
            if (!data.totals.best_category) return "—";
            const name = categoryShortDisplay[data.totals.best_category] || data.totals.best_category;
            if (name.length <= 8) return name;
            const words = name.split(" ");
            if (words.length > 1) return words[0];
            return name.slice(0, 6) + ".";
          })()}
          color={colors.amber}
        />
      </div>

      {/* Cohort toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCohort((prev) => !prev)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            showCohort
              ? "bg-cm-primary/15 text-cm-primary border border-cm-primary/30"
              : "bg-cm-card-raised text-cm-muted border border-cm-border hover:text-cm-text"
          }`}
        >
          <Users size={14} />
          {showCohort ? "Cohort Avg On" : "Show Cohort Avg"}
        </button>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.score_trend.length > 0 && (
          <ChartCard title="Score Trend">
            <ScoreTrendChart
              data={data.score_trend}
              cohortData={cohort?.score_trend}
            />
          </ChartCard>
        )}
        {data.xp_trend.length > 0 && (
          <ChartCard title="XP Earned">
            <XPTimelineChart data={data.xp_trend} />
          </ChartCard>
        )}
        {data.category_performance.length > 0 && (
          <ChartCard title="Category Performance">
            <CategoryBarChart
              data={data.category_performance}
              cohortData={cohort?.category_performance}
            />
          </ChartCard>
        )}
        {hasDimensions && (
          <ChartCard title="Skill Balance">
            <RadarScoreChart
              dimensionScores={data.dimension_averages}
              cohortScores={cohort?.dimension_averages}
              maxScore={5}
              size={240}
              showLegend
            />
          </ChartCard>
        )}
      </div>
    </motion.div>
  );
}
