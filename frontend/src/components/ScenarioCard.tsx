import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { categoryColors } from "../theme/colors";

interface ScenarioCardProps {
  category: string;
  difficulty: string;
  content: {
    title: string;
    setup: string;
    question: string;
    hints?: string[];
  };
}

export default function ScenarioCard({ category, difficulty, content }: ScenarioCardProps) {
  const color = categoryColors[category] || "#4D34EF";
  const difficultyLevel = difficulty === "beginner" ? 1 : difficulty === "intermediate" ? 2 : 3;

  return (
    <motion.article
      aria-label="Scenario"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-md border border-cm-border bg-cm-card p-6 shadow-card"
    >
      <div className="flex items-center justify-between mb-4">
        <span
          aria-label={`Category: ${category.replace(/_/g, " ")}`}
          className="px-3 py-1 rounded-md text-xs font-semibold border"
          style={{ color, borderColor: `${color}66`, backgroundColor: `${color}15` }}
        >
          {category.replace(/_/g, " ").toUpperCase()}
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

      <h2 className="text-xl font-bold text-cm-text mb-3">{content.title}</h2>
      <p className="text-cm-muted text-sm leading-relaxed mb-4">{content.setup}</p>

      <div className="border-t border-cm-border pt-4">
        <p className="text-cm-text font-medium">{content.question}</p>
      </div>
    </motion.article>
  );
}
