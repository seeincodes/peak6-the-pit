import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { categoryColors } from "../theme/colors";

interface Choice {
  key: string;
  text: string;
}

interface MCQCardProps {
  category: string;
  difficulty: string;
  content: {
    context: string;
    question: string;
    choices: Choice[];
  };
  onSelect: (key: string) => void;
  disabled: boolean;
  selectedKey: string | null;
}

export default function MCQCard({
  category,
  difficulty,
  content,
  onSelect,
  disabled,
  selectedKey,
}: MCQCardProps) {
  const color = categoryColors[category] || "#4D34EF";
  const difficultyLevel = difficulty === "beginner" ? 1 : difficulty === "intermediate" ? 2 : 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-md border border-cm-border bg-cm-card p-6 shadow-card"
    >
      <div className="flex items-center justify-between mb-4">
        <span
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

      <p className="text-cm-muted text-sm leading-relaxed mb-4">{content.context}</p>

      <div className="border-t border-cm-border pt-4 mb-4">
        <p className="text-cm-text font-medium">{content.question}</p>
      </div>

      <div className="grid gap-2" role="group" aria-label="Answer choices">
        {content.choices.map((choice) => (
          <button
            key={choice.key}
            onClick={() => onSelect(choice.key)}
            disabled={disabled}
            aria-pressed={selectedKey === choice.key}
            className={`w-full text-left p-3 rounded-md border transition-all focus-ring ${
              selectedKey === choice.key
                ? "border-cm-primary bg-cm-primary/10 text-cm-text"
                : "border-cm-border bg-cm-card hover:border-cm-primary/40 text-cm-muted hover:text-cm-text"
            } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span className="font-mono text-cm-primary mr-3">{choice.key}.</span>
            <span className="text-sm">{choice.text}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
