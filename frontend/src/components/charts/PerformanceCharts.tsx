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
} from "recharts";
import { TrendingUp, Target, Zap, Award } from "lucide-react";
import api from "../../api/client";
import { CHART_COLORS, tooltipStyle } from "../../theme/chartTheme";
import { categoryColors, categoryDisplay, colors } from "../../theme/colors";
import RadarScoreChart from "./RadarScoreChart";

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
    <div className="cm-surface p-3 flex items-center gap-3">
      <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
        {icon}
      </div>
      <div>
        <div className="text-cm-muted text-xs">{label}</div>
        <div className="text-cm-text font-bold text-lg">{value}</div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ScoreTrendChart({ data }: { data: PerformanceData["score_trend"] }) {
  const formatted = data.map((d) => ({ ...d, date: formatDate(d.date) }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis dataKey="date" tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} />
        <YAxis domain={[0, 5]} tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <ReferenceLine y={3.5} stroke={colors.amber} strokeDasharray="4 4" label={{ value: "Mastery", fill: colors.amber, fontSize: 10 }} />
        <Line
          type="monotone"
          dataKey="avg_score"
          stroke={colors.primary}
          strokeWidth={2}
          dot={{ r: 3, fill: colors.primary }}
          isAnimationActive
          animationDuration={800}
        />
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
            <stop offset="5%" stopColor={colors.lime} stopOpacity={0.3} />
            <stop offset="95%" stopColor={colors.lime} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis dataKey="date" tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} />
        <YAxis tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area
          type="monotone"
          dataKey="xp"
          stroke={colors.lime}
          strokeWidth={2}
          fill="url(#xpGrad)"
          isAnimationActive
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CategoryBarChart({ data }: { data: PerformanceData["category_performance"] }) {
  const formatted = data.map((d) => ({
    ...d,
    name: categoryDisplay[d.category]?.split(" ")[0] || d.category.replace(/_/g, " "),
    fill: categoryColors[d.category] || colors.primary,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, formatted.length * 32)}>
      <BarChart data={formatted} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
        <XAxis type="number" domain={[0, 5]} tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} />
        <YAxis type="category" dataKey="name" tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} width={80} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value.toFixed(1), "Avg Score"]} />
        <ReferenceLine x={3.5} stroke={colors.amber} strokeDasharray="4 4" />
        <Bar dataKey="avg_score" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive animationDuration={800}>
          {formatted.map((entry, i) => (
            <rect key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function PerformanceCharts() {
  const [days] = useState(30);

  const { data, isLoading } = useQuery({
    queryKey: ["performance", "history", days],
    queryFn: async () => {
      const res = await api.get(`/performance/history?days=${days}`);
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
          icon={<Zap size={18} style={{ color: colors.lime }} />}
          label="Total XP"
          value={data.totals.total_xp.toLocaleString()}
          color={colors.lime}
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
          value={data.totals.best_category
            ? (categoryDisplay[data.totals.best_category]?.split(" ")[0] || data.totals.best_category)
            : "—"}
          color={colors.amber}
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.score_trend.length > 0 && (
          <ChartCard title="Score Trend">
            <ScoreTrendChart data={data.score_trend} />
          </ChartCard>
        )}
        {data.xp_trend.length > 0 && (
          <ChartCard title="XP Earned">
            <XPTimelineChart data={data.xp_trend} />
          </ChartCard>
        )}
        {data.category_performance.length > 0 && (
          <ChartCard title="Category Performance">
            <CategoryBarChart data={data.category_performance} />
          </ChartCard>
        )}
        {hasDimensions && (
          <ChartCard title="Skill Balance">
            <RadarScoreChart
              dimensionScores={data.dimension_averages}
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
