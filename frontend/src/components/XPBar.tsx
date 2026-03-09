import { motion } from "framer-motion";

interface XPBarProps {
  current: number;
  nextLevel: number;
  level: number;
}

export default function XPBar({ current, nextLevel, level }: XPBarProps) {
  const pct = Math.min((current / nextLevel) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <span className="text-cm-cyan font-bold text-sm">LVL {level}</span>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={nextLevel}
        aria-label={`Level ${level} progress: ${current} of ${nextLevel} XP`}
        className="relative w-48 h-2 bg-cm-card rounded-sm border border-cm-border overflow-hidden"
      >
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cm-cyan to-cm-emerald rounded-sm"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="text-cm-muted text-xs">
        {current} / {nextLevel} XP
      </span>
    </div>
  );
}
