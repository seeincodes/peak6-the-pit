import { useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { BADGE_ICONS, TIER_COLORS } from "../constants/badgeIcons";

interface BadgeCardProps {
  name: string;
  description: string;
  icon: string;
  tier: string;
  earned: boolean;
  awardedAt: string | null;
}

export default function BadgeCard({ name, description, icon, tier, earned, awardedAt }: BadgeCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const emoji = BADGE_ICONS[icon] || "🏷️";
  const tierColor = TIER_COLORS[tier] || TIER_COLORS.bronze;

  return (
    <div className="relative">
      <motion.button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl transition-all focus-ring ${
          earned
            ? "bg-cm-card-raised border-2"
            : "bg-cm-card border border-cm-border opacity-40 grayscale"
        }`}
        style={earned ? { borderColor: tierColor, boxShadow: `0 0 12px ${tierColor}30` } : {}}
        whileHover={{ scale: earned ? 1.1 : 1.02 }}
        aria-label={`${name}: ${description}${earned ? " (Earned)" : " (Locked)"}`}
      >
        {earned ? emoji : <Lock size={18} className="text-cm-muted" />}
      </motion.button>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-cm-bg border border-cm-border rounded-lg shadow-lg z-50 w-48 pointer-events-none">
          <div className="text-xs font-semibold text-cm-text">{name}</div>
          <div className="text-[11px] text-cm-muted mt-0.5">{description}</div>
          {earned && awardedAt && (
            <div className="text-[10px] text-cm-primary mt-1">
              Earned {new Date(awardedAt).toLocaleDateString()}
            </div>
          )}
          {!earned && (
            <div className="text-[10px] text-cm-amber mt-1">Not yet earned</div>
          )}
        </div>
      )}
    </div>
  );
}
