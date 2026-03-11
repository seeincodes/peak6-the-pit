import { motion } from "framer-motion";
import RadarScoreChart from "./charts/RadarScoreChart";

interface GradeRevealProps {
  dimensionScores: Record<string, number>;
  overallScore: number;
  feedback: string;
  xpEarned: number;
}

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
      className="cm-surface p-6"
    >
      <div className="text-center mb-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center gap-3"
          aria-label={`Overall score: ${overallScore.toFixed(1)} out of 5`}
        >
          <span className="text-5xl font-bold text-cm-primary">{overallScore.toFixed(1)}</span>
          <span className="text-cm-muted text-xl">/ 5.0</span>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        role="status"
        className="text-center mb-4"
      >
        <span className="text-cm-lime font-bold text-lg">+{xpEarned} XP</span>
      </motion.div>

      <RadarScoreChart dimensionScores={dimensionScores} maxScore={5} size={280} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="cm-divider pt-4"
      >
        <h3 className="cm-heading-sm text-cm-amber mb-2">Feedback</h3>
        <p className="cm-body">{feedback}</p>
      </motion.div>
    </motion.div>
  );
}
