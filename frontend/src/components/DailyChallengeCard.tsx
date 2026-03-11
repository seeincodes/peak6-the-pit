import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Check, X } from "lucide-react";
import api from "../api/client";

interface Challenge {
  id: string;
  type: string;
  description: string;
  target: number;
  progress: number;
  bonus_xp: number;
  completed: boolean;
}

export default function DailyChallengeCard({
  dismissible = false,
  onDismiss,
  compact = false,
}: {
  dismissible?: boolean;
  onDismiss?: () => void;
  compact?: boolean;
}) {
  const { data: challenges } = useQuery<Challenge[]>({
    queryKey: ["daily-challenges"],
    queryFn: async () => (await api.get("/challenges/today")).data,
    staleTime: 30_000,
  });

  if (!challenges || challenges.length === 0) return null;

  const completedCount = challenges.filter((c) => c.completed).length;

  if (compact) {
    return (
      <div className="space-y-1.5">
        {challenges.map((c) => (
            <div
              key={c.id}
              className={`flex items-center gap-2 text-[11px] ${
                c.completed ? "text-cm-lime" : "text-cm-muted"
              }`}
            >
              {c.completed ? (
                <Check size={10} className="flex-shrink-0" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full border border-cm-border flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0 truncate">
                {c.completed ? <span className="line-through">{c.description}</span> : c.description}
              </div>
              {!c.completed && (
                <span className="text-cm-amber font-semibold flex-shrink-0">
                  {c.progress}/{c.target}
                </span>
              )}
            </div>
          ))}
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        className="cm-surface p-4 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-cm-muted uppercase tracking-wider flex items-center gap-1.5">
            <Target size={12} />
            Daily Challenges
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-cm-muted">
              {completedCount}/{challenges.length} done
            </span>
            {dismissible && onDismiss && (
              <button
                onClick={onDismiss}
                className="text-cm-muted hover:text-cm-text transition-colors p-0.5 -mr-1"
                aria-label="Dismiss daily challenges"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {challenges.map((c) => {
            const pct = Math.min((c.progress / c.target) * 100, 100);
            return (
              <motion.div
                key={c.id}
                className={`flex items-center gap-3 p-2 rounded-md border transition-colors ${
                  c.completed
                    ? "border-cm-lime/30 bg-cm-lime/5"
                    : "border-cm-border/30"
                }`}
              >
                {c.completed ? (
                  <Check size={14} className="text-cm-lime flex-shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-cm-border flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${c.completed ? "text-cm-lime line-through" : "text-cm-text"}`}>
                    {c.description}
                  </p>
                  {!c.completed && (
                    <div className="mt-1 h-1 rounded-full bg-cm-border/40 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cm-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
                <span className="text-xs text-cm-amber font-semibold flex-shrink-0">
                  +{c.bonus_xp}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
