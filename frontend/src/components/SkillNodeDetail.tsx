import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { X, Play } from "lucide-react";

interface SkillNode {
  id: string;
  category: string;
  display_name: string;
  description: string;
  tier: number;
  prerequisites: string[];
  position_x: number;
  position_y: number;
}

interface MasteryData {
  category: string;
  mastery_level: number;
  peak_mastery: number;
  scenarios_completed: number;
  avg_score?: number;
}

interface SkillNodeDetailProps {
  node: SkillNode;
  mastery: MasteryData | null;
  onClose: () => void;
}

const TIER_LABELS = ["Foundational", "Intermediate", "Advanced", "Expert"];
const TIER_COLORS = ["#94a3b8", "#38bdf8", "#a78bfa", "#fbbf24"];

function MasteryRing({ pct, color }: { pct: number; color: string }) {
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference * (1 - Math.min(pct / 100, 1));

  return (
    <svg width={104} height={104} className="shrink-0">
      <circle cx={52} cy={52} r={r} fill="none" stroke="#1e293b" strokeWidth={8} />
      <circle
        cx={52}
        cy={52}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 52 52)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x={52} y={52} textAnchor="middle" dominantBaseline="middle" fontSize={16} fontWeight="bold" fill="#e2e8f0">
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

export default function SkillNodeDetail({ node, mastery, onClose }: SkillNodeDetailProps) {
  const navigate = useNavigate();
  const tierColor = TIER_COLORS[Math.min(node.tier, TIER_COLORS.length - 1)];
  const tierLabel = TIER_LABELS[Math.min(node.tier, TIER_LABELS.length - 1)];
  const masteryLevel = mastery?.mastery_level ?? 0;

  const status =
    masteryLevel >= 70
      ? "Mastered"
      : mastery && mastery.scenarios_completed > 0
      ? "In Progress"
      : "Not Started";

  const statusColor =
    masteryLevel >= 70 ? "#fbbf24" : mastery && mastery.scenarios_completed > 0 ? tierColor : "#475569";

  return (
    <motion.div
      className="absolute top-0 right-0 h-full w-80 bg-cm-card border-l border-cm-border shadow-2xl flex flex-col z-20"
      initial={{ x: 320 }}
      animate={{ x: 0 }}
      exit={{ x: 320 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-cm-border">
        <div className="flex-1 min-w-0 pr-3">
          <div
            className="text-[10px] font-semibold uppercase tracking-widest mb-1"
            style={{ color: tierColor }}
          >
            Tier {node.tier + 1} · {tierLabel}
          </div>
          <h2 className="text-base font-bold text-cm-text leading-snug">{node.display_name}</h2>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-cm-muted hover:text-cm-text hover:bg-cm-card-raised transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Mastery ring + stats */}
        <div className="flex items-center gap-4">
          <MasteryRing pct={masteryLevel} color={masteryLevel >= 70 ? "#fbbf24" : tierColor} />
          <div className="space-y-1.5">
            <div>
              <div className="text-[11px] text-cm-muted uppercase tracking-wide">Status</div>
              <div className="text-sm font-semibold" style={{ color: statusColor }}>
                {status}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-cm-muted uppercase tracking-wide">Sessions</div>
              <div className="text-sm font-semibold text-cm-text">
                {mastery?.scenarios_completed ?? 0}
              </div>
            </div>
            {mastery?.avg_score != null && (
              <div>
                <div className="text-[11px] text-cm-muted uppercase tracking-wide">Avg Score</div>
                <div className="text-sm font-semibold text-cm-text">
                  {Math.round(mastery.avg_score)}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Peak mastery */}
        {mastery && mastery.peak_mastery > 0 && (
          <div className="cm-surface p-3 rounded-lg">
            <div className="text-[11px] text-cm-muted uppercase tracking-wide mb-1">Peak Mastery</div>
            <div className="text-sm font-semibold text-cm-text">{Math.round(mastery.peak_mastery)}%</div>
          </div>
        )}

        {/* Description */}
        <div>
          <div className="text-[11px] text-cm-muted uppercase tracking-wide mb-1.5">About</div>
          <p className="text-sm text-cm-text/80 leading-relaxed">{node.description}</p>
        </div>

        {/* Prerequisites */}
        {node.prerequisites.length > 0 && (
          <div>
            <div className="text-[11px] text-cm-muted uppercase tracking-wide mb-2">Prerequisites</div>
            <div className="flex flex-wrap gap-1.5">
              {node.prerequisites.map((p) => (
                <span key={p} className="cm-chip text-xs">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-cm-border">
        <button
          className="cm-btn-primary w-full flex items-center justify-center gap-2"
          onClick={() => navigate(`/?category=${node.category}`)}
        >
          <Play size={15} />
          Start Training
        </button>
      </div>
    </motion.div>
  );
}
