import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface StreakBadgeProps {
  count: number;
}

export default function StreakBadge({ count }: StreakBadgeProps) {
  if (count === 0) return null;

  const multiplier = count >= 4 ? "2x" : count >= 2 ? "1.5x" : "1x";

  return (
    <motion.div
      key={count}
      initial={{ scale: 1.3 }}
      animate={{ scale: 1 }}
      aria-label={`${count} question streak, ${multiplier} XP multiplier`}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-cm-amber/15 border border-cm-amber/40"
    >
      <Flame size={14} className="text-cm-amber" aria-hidden="true" />
      <span className="text-cm-amber text-sm font-bold">{count}</span>
      <span className="text-cm-amber/70 text-xs">streak</span>
      <span className="text-cm-amber text-xs font-bold ml-1">{multiplier}</span>
    </motion.div>
  );
}
