import { motion } from "framer-motion";

interface XPProgressBarProps {
  xpTotal: number;
  levelMinXP: number;
  levelMaxXP: number;
  level: number;
  animated?: boolean;
  glowWhenClose?: boolean;
}

export default function XPProgressBar({
  xpTotal,
  levelMinXP,
  levelMaxXP,
  level,
  animated = true,
  glowWhenClose = true,
}: XPProgressBarProps) {
  const range = levelMaxXP - levelMinXP;
  const progress = range > 0 ? Math.min((xpTotal - levelMinXP) / range, 1) : 1;
  const pct = Math.max(0, progress * 100);
  const isClose = glowWhenClose && pct >= 80;
  const isMaxLevel = levelMinXP === levelMaxXP;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-cm-muted">
          Lv{level}
        </span>
        <span className="text-[11px] text-cm-muted">
          {isMaxLevel ? "MAX" : `${xpTotal - levelMinXP}/${range} XP`}
        </span>
        <span className="text-[11px] font-semibold text-cm-muted">
          Lv{level + 1}
        </span>
      </div>
      <div className="relative w-full h-2 bg-cm-bg rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cm-primary to-cm-emerald rounded-full"
          initial={animated ? { width: 0 } : { width: `${pct}%` }}
          animate={{
            width: `${pct}%`,
            ...(isClose
              ? { opacity: [1, 0.7, 1] }
              : {}),
          }}
          transition={{
            width: { duration: animated ? 1.5 : 0, ease: "easeOut" },
            opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
          }}
          style={isClose ? { boxShadow: "0 0 8px rgba(77, 52, 239, 0.5)" } : {}}
        />
      </div>
    </div>
  );
}
