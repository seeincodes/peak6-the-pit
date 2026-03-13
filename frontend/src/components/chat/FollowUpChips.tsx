import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface FollowUpChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export default function FollowUpChips({
  suggestions,
  onSelect,
}: FollowUpChipsProps) {
  if (!suggestions.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {suggestions.map((s, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelect(s)}
          className="cm-chip text-xs flex items-center gap-1 text-cm-primary border-cm-primary/30 bg-cm-primary/5 hover:bg-cm-primary/15 transition-colors cursor-pointer"
        >
          {s}
          <ArrowRight size={10} />
        </motion.button>
      ))}
    </div>
  );
}
