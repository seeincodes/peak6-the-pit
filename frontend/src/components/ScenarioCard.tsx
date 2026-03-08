import { motion } from "framer-motion";
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

const difficultyStars: Record<string, string> = {
  beginner: "★☆☆",
  intermediate: "★★☆",
  advanced: "★★★",
};

export default function ScenarioCard({ category, difficulty, content }: ScenarioCardProps) {
  const color = categoryColors[category] || "#00f0ff";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-cm-border bg-cm-card/80 backdrop-blur-sm p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <span
          className="px-3 py-1 rounded-full text-xs font-semibold border"
          style={{ color, borderColor: `${color}66`, backgroundColor: `${color}15` }}
        >
          {category.replace(/_/g, " ").toUpperCase()}
        </span>
        <span className="text-cm-amber text-sm">{difficultyStars[difficulty]}</span>
      </div>

      <h2 className="text-xl font-bold text-cm-text mb-3">{content.title}</h2>
      <p className="text-cm-muted text-sm leading-relaxed mb-4">{content.setup}</p>

      <div className="border-t border-cm-border pt-4">
        <p className="text-cm-text font-medium">{content.question}</p>
      </div>
    </motion.div>
  );
}
