import { motion } from "framer-motion";
import { Target, Zap, Trophy } from "lucide-react";

interface QuickFireScoreCardProps {
  correct: number;
  total: number;
  totalXP: number;
  goodJustifications: number;
  onPlayAgain: () => void;
  onExit: () => void;
}

export default function QuickFireScoreCard({
  correct,
  total,
  totalXP,
  goodJustifications,
  onPlayAgain,
  onExit,
}: QuickFireScoreCardProps) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="cm-surface p-8 text-center space-y-6"
    >
      <div>
        <Trophy size={40} className="mx-auto text-cm-amber mb-2" />
        <h2 className="text-2xl font-bold text-cm-text">Round Complete!</h2>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 rounded-lg bg-cm-card-raised border border-cm-border">
          <Target size={18} className="mx-auto text-cm-primary mb-1" />
          <p className="text-2xl font-bold text-cm-text">{accuracy}%</p>
          <p className="text-xs text-cm-muted">Accuracy</p>
        </div>
        <div className="p-3 rounded-lg bg-cm-card-raised border border-cm-border">
          <Zap size={18} className="mx-auto text-cm-lime mb-1" />
          <p className="text-2xl font-bold text-cm-lime">+{totalXP}</p>
          <p className="text-xs text-cm-muted">XP Earned</p>
        </div>
        <div className="p-3 rounded-lg bg-cm-card-raised border border-cm-border">
          <span className="block text-lg mb-1">🧠</span>
          <p className="text-2xl font-bold text-cm-text">{goodJustifications}/{total}</p>
          <p className="text-xs text-cm-muted">Good Reasoning</p>
        </div>
      </div>

      <p className="text-sm text-cm-muted">
        {correct}/{total} correct answers
      </p>

      <div className="flex gap-3 justify-center">
        <button onClick={onPlayAgain} className="cm-btn-primary-lg px-6 py-2">
          Play Again
        </button>
        <button
          onClick={onExit}
          className="cm-btn-secondary"
        >
          Exit
        </button>
      </div>
    </motion.div>
  );
}
