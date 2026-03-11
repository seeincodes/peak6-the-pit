import { motion } from "framer-motion";
import { Star } from "lucide-react";
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
}

export default function ScenarioCard({ id, category, difficulty, content }: ScenarioCardProps) {
  const color = categoryColors[category] || "#4D34EF";
  const difficultyLevel = difficulty === "beginner" ? 1 : difficulty === "intermediate" ? 2 : 3;

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
    </motion.article>
  );
}
