import { motion } from "framer-motion";
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

const difficultyStars: Record<string, string> = {
  beginner: "\u2605\u2606\u2606",
  intermediate: "\u2605\u2605\u2606",
  advanced: "\u2605\u2605\u2605",
};

export default function MCQCard({
  category,
  difficulty,
  content,
  onSelect,
  disabled,
  selectedKey,
}: MCQCardProps) {
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

      <p className="text-cm-muted text-sm leading-relaxed mb-4">{content.context}</p>

      <div className="border-t border-cm-border pt-4 mb-4">
        <p className="text-cm-text font-medium">{content.question}</p>
      </div>

      <div className="grid gap-2">
        {content.choices.map((choice) => (
          <button
            key={choice.key}
            onClick={() => onSelect(choice.key)}
            disabled={disabled}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              selectedKey === choice.key
                ? "border-cm-cyan bg-cm-cyan/10 text-cm-text"
                : "border-cm-border bg-cm-card hover:border-cm-cyan/40 text-cm-muted hover:text-cm-text"
            } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span className="font-mono text-cm-cyan mr-3">{choice.key}.</span>
            <span className="text-sm">{choice.text}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
