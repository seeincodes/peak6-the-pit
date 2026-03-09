import { useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface MCQFeedbackProps {
  isCorrect: boolean;
  correctKey: string;
  chosenKey: string;
  explanation: string;
  justificationQuality: string;
  justificationNote: string;
  xpEarned: number;
  onNext: () => void;
}

export default function MCQFeedback({
  isCorrect,
  correctKey,
  explanation,
  justificationQuality,
  justificationNote,
  xpEarned,
  onNext,
}: MCQFeedbackProps) {
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    nextRef.current?.focus();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-md border border-cm-border bg-cm-card p-6"
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
          <span className="text-cm-lime font-bold text-lg">+{xpEarned} XP</span>
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
          className="px-6 py-2 rounded bg-cm-primary text-white font-bold hover:bg-cm-primary/90 transition-all focus-ring"
        >
          Next Question
        </button>
      </div>
    </motion.div>
  );
}
