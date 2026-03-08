import { motion } from "framer-motion";

interface GradeRevealProps {
  dimensionScores: Record<string, number>;
  overallScore: number;
  feedback: string;
  xpEarned: number;
}

const dimensionLabels: Record<string, string> = {
  reasoning: "Reasoning Quality",
  terminology: "Terminology",
  trade_logic: "Trade Logic",
  risk_awareness: "Risk Awareness",
};

const dimensionColors: Record<string, string> = {
  reasoning: "#00f0ff",
  terminology: "#8b5cf6",
  trade_logic: "#10b981",
  risk_awareness: "#f59e0b",
};

export default function GradeReveal({
  dimensionScores,
  overallScore,
  feedback,
  xpEarned,
}: GradeRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-cm-border bg-cm-card/80 backdrop-blur-sm p-6"
    >
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center gap-3"
        >
          <span className="text-5xl font-bold text-cm-cyan">{overallScore.toFixed(1)}</span>
          <span className="text-cm-muted text-xl">/ 5.0</span>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center mb-6"
      >
        <span className="text-cm-emerald font-bold text-lg">+{xpEarned} XP</span>
      </motion.div>

      <div className="space-y-3 mb-6">
        {Object.entries(dimensionScores).map(([dim, score], i) => (
          <div key={dim}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-cm-muted">{dimensionLabels[dim] || dim}</span>
              <span className="text-cm-text font-semibold">{score}/5</span>
            </div>
            <div className="h-2 bg-cm-bg rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: dimensionColors[dim] || "#00f0ff" }}
                initial={{ width: 0 }}
                animate={{ width: `${(score / 5) * 100}%` }}
                transition={{ delay: 0.5 + i * 0.15, duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="border-t border-cm-border pt-4"
      >
        <h3 className="text-sm font-semibold text-cm-amber mb-2">Feedback</h3>
        <p className="text-cm-muted text-sm leading-relaxed">{feedback}</p>
      </motion.div>
    </motion.div>
  );
}
