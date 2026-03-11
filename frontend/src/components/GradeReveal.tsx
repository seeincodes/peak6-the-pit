import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, BookOpen, Loader2 } from "lucide-react";
import RadarScoreChart from "./charts/RadarScoreChart";
import api from "../api/client";

interface GradeRevealProps {
  dimensionScores: Record<string, number>;
  overallScore: number;
  feedback: string;
  xpEarned: number;
  hintsUsed?: number;
  responseId?: string;
}

export default function GradeReveal({
  dimensionScores,
  overallScore,
  feedback,
  xpEarned,
  hintsUsed = 0,
  responseId,
}: GradeRevealProps) {
  const [modelAnswer, setModelAnswer] = useState<string | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);

  const fetchModelAnswer = async () => {
    if (!responseId || modelAnswer) return;
    setLoadingModel(true);
    try {
      const res = await api.post(`/responses/${responseId}/model-answer`);
      setModelAnswer(res.data.model_answer);
    } catch {
      setModelAnswer("Failed to load model answer. Please try again.");
    } finally {
      setLoadingModel(false);
    }
  };

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
        {hintsUsed > 0 && (
          <div className="flex items-center justify-center gap-1 mt-1">
            <Lightbulb size={12} className="text-cm-amber" />
            <span className="text-cm-amber text-xs">
              {hintsUsed} hint{hintsUsed > 1 ? "s" : ""} used (−{hintsUsed * 20}% XP)
            </span>
          </div>
        )}
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

      {responseId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-4"
        >
          {!modelAnswer && (
            <button
              onClick={fetchModelAnswer}
              disabled={loadingModel}
              className="flex items-center gap-2 text-sm text-cm-primary hover:text-cm-primary/80 transition-colors disabled:opacity-50"
            >
              {loadingModel ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <BookOpen size={14} />
              )}
              {loadingModel ? "Generating model answer..." : "Show Model Answer"}
            </button>
          )}
          <AnimatePresence>
            {modelAnswer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 p-4 rounded-md border border-cm-primary/20 bg-cm-primary/5"
              >
                <h4 className="text-sm font-semibold text-cm-primary mb-2 flex items-center gap-1.5">
                  <BookOpen size={14} />
                  Model Answer (5/5)
                </h4>
                <p className="text-sm text-cm-text leading-relaxed">{modelAnswer}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
