import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, BookOpen, Loader2, Bookmark, BookmarkCheck, Flame, Sparkles, Shield } from "lucide-react";
import RadarScoreChart from "./charts/RadarScoreChart";
import XPProgressBar from "./XPProgressBar";
import StarBurst from "./StarBurst";
import api from "../api/client";

interface XPBreakdown {
  base: number;
  streak_bonus: number;
  perfect_bonus: number;
  no_hints_bonus: number;
  daily_first_bonus: number;
  hint_penalty_pct: number;
  total: number;
}

interface LevelProgress {
  current_xp: number;
  level_min_xp: number;
  level_max_xp: number;
}

interface GradeRevealProps {
  dimensionScores: Record<string, number>;
  overallScore: number;
  feedback: string;
  xpEarned: number;
  hintsUsed?: number;
  responseId?: string;
  scenarioId?: string;
  bonuses?: {
    daily_first: boolean;
    perfect: boolean;
    no_hints: boolean;
  };
  xpBreakdown?: XPBreakdown;
  levelProgress?: LevelProgress;
  level?: number;
}

function scoreColor(score: number): string {
  if (score < 2.0) return "text-cm-red";
  if (score < 3.5) return "text-cm-amber";
  if (score < 4.5) return "text-cm-emerald";
  return "text-cm-mint";
}

function scoreLabel(score: number): string {
  if (score < 2.0) return "Needs Work";
  if (score < 3.5) return "Good";
  if (score < 4.5) return "Excellent";
  return "Perfect";
}

export default function GradeReveal({
  dimensionScores,
  overallScore,
  feedback,
  xpEarned,
  hintsUsed = 0,
  responseId,
  scenarioId,
  bonuses,
  xpBreakdown,
  levelProgress,
  level,
}: GradeRevealProps) {
  const [modelAnswer, setModelAnswer] = useState<string | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const toggleBookmark = async () => {
    if (!scenarioId) return;
    try {
      if (bookmarked) {
        await api.delete(`/bookmarks/${scenarioId}`);
        setBookmarked(false);
      } else {
        await api.post("/bookmarks", { scenario_id: scenarioId, tag: "reference" });
        setBookmarked(true);
      }
    } catch { /* ignore */ }
  };

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

  const isPerfect = overallScore >= 4.5;

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
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="relative inline-flex items-center gap-3"
          aria-label={`Overall score: ${overallScore.toFixed(1)} out of 5`}
        >
          <span className={`text-6xl font-black tracking-tight ${scoreColor(overallScore)}`}>
            {overallScore.toFixed(1)}
          </span>
          <span className="text-cm-muted text-lg">/ 5.0</span>
          {isPerfect && <StarBurst count={5} />}
        </motion.div>
        <div className={`text-sm font-semibold mt-1 ${scoreColor(overallScore)}`}>
          {scoreLabel(overallScore)}
        </div>
      </div>

      {/* XP Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        role="status"
        className="text-center mb-4"
      >
        {xpBreakdown ? (
          <div className="inline-flex flex-col items-start gap-1 text-sm">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-cm-muted"
            >
              +{xpBreakdown.base} base
            </motion.div>
            {xpBreakdown.streak_bonus > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="text-cm-amber"
              >
                +{xpBreakdown.streak_bonus} Streak Bonus 🔥
              </motion.div>
            )}
            {xpBreakdown.perfect_bonus > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-cm-primary"
              >
                +{xpBreakdown.perfect_bonus} Perfect Score!
              </motion.div>
            )}
            {xpBreakdown.no_hints_bonus > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 }}
                className="text-cm-emerald"
              >
                +{xpBreakdown.no_hints_bonus} No Hints
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
            {xpBreakdown.hint_penalty_pct > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 }}
                className="text-cm-red/80"
              >
                -{xpBreakdown.hint_penalty_pct}% Hint Penalty
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
              className="border-t border-cm-border pt-1 mt-1 w-full"
            >
              <span className="text-cm-mint font-bold text-lg">= {xpBreakdown.total} XP</span>
            </motion.div>
          </div>
        ) : (
          <>
            <span className="text-cm-mint font-bold text-lg">+{xpEarned} XP</span>
            {(bonuses?.daily_first || bonuses?.perfect || bonuses?.no_hints) && (
              <div className="flex items-center justify-center gap-3 mt-1.5">
                {bonuses.daily_first && (
                  <span className="flex items-center gap-1 text-xs text-cm-amber">
                    <Flame size={12} /> Daily First
                  </span>
                )}
                {bonuses.perfect && (
                  <span className="flex items-center gap-1 text-xs text-cm-primary">
                    <Sparkles size={12} /> Perfect
                  </span>
                )}
                {bonuses.no_hints && (
                  <span className="flex items-center gap-1 text-xs text-cm-emerald">
                    <Shield size={12} /> No Hints
                  </span>
                )}
              </div>
            )}
          </>
        )}
        {hintsUsed > 0 && !xpBreakdown && (
          <div className="flex items-center justify-center gap-1 mt-1">
            <Lightbulb size={12} className="text-cm-amber" />
            <span className="text-cm-amber text-xs">
              {hintsUsed} hint{hintsUsed > 1 ? "s" : ""} used ({"\u2212"}{hintsUsed * 20}% XP)
            </span>
          </div>
        )}
      </motion.div>

      {/* Level Progress Bar */}
      {levelProgress && level && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mb-4 px-4"
        >
          <XPProgressBar
            xpTotal={levelProgress.current_xp}
            levelMinXP={levelProgress.level_min_xp}
            levelMaxXP={levelProgress.level_max_xp}
            level={level}
          />
        </motion.div>
      )}

      <RadarScoreChart dimensionScores={dimensionScores} maxScore={5} size={280} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="cm-divider pt-4"
      >
        <h3 className="cm-heading-sm text-cm-amber mb-2">Feedback</h3>
        <p className="cm-body">{feedback}</p>
      </motion.div>

      {responseId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="mt-4 flex items-center gap-4"
        >
          {scenarioId && (
            <button
              onClick={toggleBookmark}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                bookmarked ? "text-cm-amber" : "text-cm-muted hover:text-cm-amber"
              }`}
            >
              {bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
              {bookmarked ? "Bookmarked" : "Bookmark"}
            </button>
          )}
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
