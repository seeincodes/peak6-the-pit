import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Lightbulb } from "lucide-react";
import { categoryColors, categoryDisplay } from "../theme/colors";
import MarketChart from "./charts/MarketChart";

interface ScenarioCardProps {
  id: string;
  category: string;
  difficulty: string;
  content: {
    title: string;
    setup: string;
    question: string;
    hints?: string[];
  };
  onHintsUsedChange?: (count: number) => void;
}

export default function ScenarioCard({ id, category, difficulty, content, onHintsUsedChange }: ScenarioCardProps) {
  const color = categoryColors[category] || "#4D34EF";
  const difficultyLevel = difficulty === "beginner" ? 1 : difficulty === "intermediate" ? 2 : 3;
  const [revealedHints, setRevealedHints] = useState(0);

  const hints = content.hints || [];
  const hasHints = hints.length > 0;
  const allRevealed = revealedHints >= hints.length;

  const revealNext = () => {
    const next = revealedHints + 1;
    setRevealedHints(next);
    onHintsUsedChange?.(next);
  };

  return (
    <motion.article
      aria-label="Scenario"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="cm-surface-raised p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <span
          aria-label={`Category: ${categoryDisplay[category] || category.replace(/_/g, " ")}`}
          className="cm-chip"
          style={{ color, borderColor: `${color}66`, backgroundColor: `${color}15` }}
        >
          {categoryDisplay[category] || category.replace(/_/g, " ")}
        </span>
        <span className="flex items-center gap-0.5" aria-label={`Difficulty: ${difficulty}`}>
          {[1, 2, 3].map((i) => (
            <Star
              key={i}
              size={14}
              className={i <= difficultyLevel ? "text-cm-amber fill-cm-amber" : "text-cm-amber/30"}
              aria-hidden="true"
            />
          ))}
        </span>
      </div>

      <h2 className="cm-subtitle mb-3">{content.title}</h2>
      <p className="cm-body mb-4">{content.setup}</p>

      <MarketChart scenarioId={id} category={category} height={160} className="mb-4" />

      <div className="cm-divider pt-4">
        <p className="text-cm-text font-medium">{content.question}</p>
      </div>

      {hasHints && (
        <div className="mt-4">
          <AnimatePresence>
            {Array.from({ length: revealedHints }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 mb-2 px-3 py-2 rounded-md border border-cm-amber/20 bg-cm-amber/5"
              >
                <Lightbulb size={14} className="text-cm-amber mt-0.5 flex-shrink-0" />
                <p className="text-sm text-cm-text">{hints[i]}</p>
              </motion.div>
            ))}
          </AnimatePresence>

          {!allRevealed && (
            <button
              onClick={revealNext}
              className="flex items-center gap-1.5 text-xs text-cm-amber hover:text-cm-amber/80 transition-colors mt-1"
            >
              <Lightbulb size={12} />
              Show hint ({revealedHints + 1}/{hints.length})
              <span className="text-cm-muted">— costs 20% XP per hint</span>
            </button>
          )}
        </div>
      )}
    </motion.article>
  );
}
