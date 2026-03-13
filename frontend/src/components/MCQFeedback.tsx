import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import ScoreGauge from "./charts/ScoreGauge";
import XPProgressBar from "./XPProgressBar";

interface XPBreakdown {
  base: number;
  streak_bonus: number;
  daily_first_bonus: number;
  total: number;
}

interface LevelProgress {
  current_xp: number;
  level_min_xp: number;
  level_max_xp: number;
}

interface MCQFeedbackProps {
  isCorrect: boolean;
  correctKey: string;
  chosenKey: string;
  explanation: string;
  justificationQuality: string;
  justificationNote: string;
  xpEarned: number;
  isDailyFirst?: boolean;
  onNext: () => void;
  xpBreakdown?: XPBreakdown;
  levelProgress?: LevelProgress;
  level?: number;
  streakCount?: number;
}

export default function MCQFeedback({
  isCorrect,
  correctKey,
  explanation,
  justificationQuality,
  justificationNote,
  xpEarned,
  onNext,
  xpBreakdown,
  levelProgress,
  level,
  streakCount = 0,
}: MCQFeedbackProps) {
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    nextRef.current?.focus();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-lg border border-cm-border bg-cm-card p-6"
    >
      <div className="text-center mb-4" role="status">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
          className={`inline-block text-3xl font-bold ${isCorrect ? "text-cm-emerald" : "text-cm-red"}`}
        >
          {isCorrect ? "Correct!" : "Incorrect"}
        </motion.div>
        {!isCorrect && (
          <div className="text-cm-muted text-sm mt-1">
            Correct answer: <span className="text-cm-primary font-mono">{correctKey}</span>
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        aria-live="polite"
        className="mb-4"
      >
        <div className="text-center mb-3">
          {xpBreakdown ? (
            <div className="inline-flex flex-col items-start gap-1 text-sm">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-cm-muted"
              >
                +{xpBreakdown.base} {isCorrect ? (justificationQuality === "good" ? "Correct + Strong Reasoning" : "Correct") : (justificationQuality === "good" ? "Strong Reasoning" : "Base")}
              </motion.div>
              {xpBreakdown.streak_bonus > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-cm-amber"
                >
                  +{xpBreakdown.streak_bonus} Streak Bonus ({streakCount}🔥)
                </motion.div>
              )}
              {xpBreakdown.daily_first_bonus > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-cm-amber"
                >
                  +{xpBreakdown.daily_first_bonus} Daily First 🔥
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
                className="border-t border-cm-border pt-1 mt-1 w-full"
              >
                <span className="text-cm-lime font-bold text-lg">= {xpBreakdown.total} XP</span>
              </motion.div>
            </div>
          ) : (
            <span className="text-cm-lime font-bold text-lg">+{xpEarned} XP</span>
          )}
        </div>

        {/* Level Progress Bar */}
        {levelProgress && level && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mb-3 px-2"
          >
            <XPProgressBar
              xpTotal={levelProgress.current_xp}
              levelMinXP={levelProgress.level_min_xp}
              levelMaxXP={levelProgress.level_max_xp}
              level={level}
            />
          </motion.div>
        )}

        <div className="flex justify-center mb-3">
          <ScoreGauge isCorrect={isCorrect} justificationQuality={justificationQuality} size={110} />
        </div>
        <div className="flex justify-center gap-3 text-xs">
          <span className={isCorrect ? "text-cm-emerald" : "text-cm-red"}>
            Answer: {isCorrect ? "Correct" : "Wrong"}
          </span>
          <span className="text-cm-border">|</span>
          <span className={justificationQuality === "good" ? "text-cm-emerald" : "text-cm-muted"}>
            Reasoning: {justificationQuality === "good" ? "Strong" : "Weak"}
          </span>
        </div>
      </motion.div>

      <div className="space-y-3 mb-4">
        <div className="border-t border-cm-border pt-3">
          <h4 className="text-cm-amber text-xs font-semibold mb-1">Explanation</h4>
          <p className="text-cm-muted text-sm">{explanation}</p>
        </div>

        <div className="border-t border-cm-border pt-3">
          <h4 className="text-cm-amber text-xs font-semibold mb-1">Your Reasoning</h4>
          <p className="text-cm-muted text-sm">{justificationNote}</p>
        </div>
      </div>

      <div className="text-center">
        <button
          ref={nextRef}
          onClick={onNext}
          className="cm-btn-primary-lg"
        >
          Next Question
        </button>
      </div>
    </motion.div>
  );
}
