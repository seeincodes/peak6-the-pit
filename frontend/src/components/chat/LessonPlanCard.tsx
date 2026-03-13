import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import type { LessonPlan } from "../../api/chat";
import FollowUpChips from "./FollowUpChips";

interface LessonPlanCardProps {
  plan: LessonPlan;
  onFollowUpClick?: (topic: string) => void;
}

export default function LessonPlanCard({
  plan,
  onFollowUpClick,
}: LessonPlanCardProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set([0]),
  );
  const [showQuestions, setShowQuestions] = useState(false);
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set());

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleHint = (index: number) => {
    setRevealedHints((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const difficultyColor =
    plan.difficulty === "beginner"
      ? "text-cm-emerald border-cm-emerald/30 bg-cm-emerald/10"
      : plan.difficulty === "intermediate"
        ? "text-cm-amber border-cm-amber/30 bg-cm-amber/10"
        : "text-cm-red border-cm-red/30 bg-cm-red/10";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={18} className="text-cm-primary" />
          <h3 className="cm-heading-sm">{plan.title}</h3>
        </div>
        <p className="cm-body text-cm-muted text-sm">{plan.overview}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className={`cm-chip text-xs ${difficultyColor}`}>
            {plan.difficulty}
          </span>
          {plan.estimated_minutes > 0 && (
            <span className="flex items-center gap-1 text-cm-muted text-xs">
              <Clock size={12} />
              {plan.estimated_minutes} min
            </span>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {plan.sections?.map((section, i) => (
          <div key={i} className="cm-surface-section rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection(i)}
              className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-white/5 transition-colors"
            >
              {expandedSections.has(i) ? (
                <ChevronDown size={16} className="text-cm-primary" />
              ) : (
                <ChevronRight size={16} className="text-cm-muted" />
              )}
              <span className="cm-label text-sm">
                {i + 1}. {section.title}
              </span>
            </button>
            <AnimatePresence>
              {expandedSections.has(i) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3">
                    <p className="cm-body text-sm whitespace-pre-wrap leading-relaxed">
                      {section.content}
                    </p>
                    {section.key_takeaways?.length > 0 && (
                      <div className="bg-cm-primary/5 border border-cm-primary/10 rounded-lg px-3 py-2">
                        <p className="cm-label text-xs text-cm-primary mb-1">
                          Key Takeaways
                        </p>
                        <ul className="space-y-1">
                          {section.key_takeaways.map((t, j) => (
                            <li
                              key={j}
                              className="cm-body text-xs flex items-start gap-2"
                            >
                              <span className="text-cm-primary mt-0.5">-</span>
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Practice Questions */}
      {plan.practice_questions?.length > 0 && (
        <div>
          <button
            onClick={() => setShowQuestions(!showQuestions)}
            className="flex items-center gap-2 text-cm-primary hover:text-cm-primary/80 transition-colors"
          >
            <HelpCircle size={16} />
            <span className="cm-label text-sm">
              Practice Questions ({plan.practice_questions.length})
            </span>
            {showQuestions ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
          <AnimatePresence>
            {showQuestions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 mt-3">
                  {plan.practice_questions.map((q, i) => (
                    <div key={i} className="cm-surface-section rounded-lg px-4 py-3">
                      <p className="cm-body text-sm font-medium">{q.question}</p>
                      <button
                        onClick={() => toggleHint(i)}
                        className="flex items-center gap-1 mt-2 text-xs text-cm-amber hover:text-cm-amber/80 transition-colors"
                      >
                        <Lightbulb size={12} />
                        {revealedHints.has(i) ? "Hide hint" : "Show hint"}
                      </button>
                      <AnimatePresence>
                        {revealedHints.has(i) && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="cm-body text-xs text-cm-muted mt-1 italic"
                          >
                            {q.hint}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Follow-up Topics */}
      {plan.follow_up_topics?.length > 0 && onFollowUpClick && (
        <FollowUpChips
          suggestions={plan.follow_up_topics}
          onSelect={onFollowUpClick}
        />
      )}
    </div>
  );
}
