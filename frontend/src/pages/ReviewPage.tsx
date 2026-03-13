import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Star, Filter } from "lucide-react";
import { categoryDisplay, categoryColors } from "../theme/colors";
import RadarScoreChart from "../components/charts/RadarScoreChart";
import api from "../api/client";

interface HistoryItem {
  response_id: string;
  scenario_id: string;
  category: string;
  difficulty: string;
  title: string;
  question: string;
  conversation: { role: string; content: string }[];
  submitted_at: string;
  grade: {
    dimension_scores: Record<string, number>;
    overall_score: number;
    feedback: string;
  };
}

export default function ReviewPage() {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: items, isLoading } = useQuery<HistoryItem[]>({
    queryKey: ["response-history", categoryFilter, showLowOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryFilter) params.set("category", categoryFilter);
      if (showLowOnly) params.set("max_score", "2.5");
      params.set("limit", "30");
      return (await api.get(`/responses/history?${params}`)).data;
    },
  });

  const scoreColor = (score: number) => {
    if (score >= 4) return "text-cm-lime";
    if (score >= 3) return "text-cm-amber";
    return "text-cm-red";
  };

  return (
    <div className="cm-page max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="cm-title">Review Past Attempts</h2>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-cm-muted" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-cm-bg border border-cm-border rounded px-2 py-1 text-xs text-cm-text focus:outline-none focus:border-cm-primary/50"
          >
            <option value="">All Categories</option>
            {Object.entries(categoryDisplay).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowLowOnly(!showLowOnly)}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            showLowOnly
              ? "border-cm-red/40 bg-cm-red/10 text-cm-red"
              : "border-cm-border text-cm-muted hover:text-cm-text"
          }`}
        >
          {showLowOnly ? "Showing mistakes only" : "Show mistakes only"}
        </button>
      </div>

      {isLoading && (
        <div className="text-center text-cm-primary animate-pulse py-12">Loading history...</div>
      )}

      {items && items.length === 0 && (
        <div className="cm-surface p-8 text-center text-cm-muted">
          No completed attempts yet. Start training to build your history!
        </div>
      )}

      {/* History list */}
      <div className="space-y-2">
        <AnimatePresence>
          {items?.map((item) => {
            const expanded = expandedId === item.response_id;
            const color = categoryColors[item.category] || "#4D34EF";
            const diffLevel = item.difficulty === "beginner" ? 1 : item.difficulty === "intermediate" ? 2 : 3;

            return (
              <motion.div
                key={item.response_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="cm-surface overflow-hidden"
              >
                {/* Summary row */}
                <button
                  onClick={() => setExpandedId(expanded ? null : item.response_id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-cm-card-raised/50 transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-cm-text font-medium truncate">{item.title}</p>
                    <p className="text-xs text-cm-muted">
                      {categoryDisplay[item.category] || item.category} &middot;{" "}
                      {new Date(item.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="flex items-center gap-0.5 mr-2">
                    {[1, 2, 3].map((i) => (
                      <Star
                        key={i}
                        size={10}
                        className={i <= diffLevel ? "text-cm-amber fill-cm-amber" : "text-cm-amber/30"}
                      />
                    ))}
                  </span>
                  <span className={`font-bold text-sm min-w-[2.5rem] text-right ${scoreColor(item.grade.overall_score)}`}>
                    {item.grade.overall_score.toFixed(1)}
                  </span>
                  {expanded ? (
                    <ChevronUp size={16} className="text-cm-muted" />
                  ) : (
                    <ChevronDown size={16} className="text-cm-muted" />
                  )}
                </button>

                {/* Expanded detail */}
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-cm-border/50"
                    >
                      <div className="p-4 space-y-4">
                        {/* Question */}
                        <div>
                          <h4 className="text-xs font-semibold text-cm-muted uppercase mb-1">Question</h4>
                          <p className="text-sm text-cm-text">{item.question}</p>
                        </div>

                        {/* Conversation */}
                        <div>
                          <h4 className="text-xs font-semibold text-cm-muted uppercase mb-2">Your Responses</h4>
                          <div className="space-y-2">
                            {item.conversation.map((turn, i) => (
                              <div
                                key={i}
                                className={`text-sm p-3 rounded-md ${
                                  turn.role === "user"
                                    ? "bg-cm-primary/5 border border-cm-primary/20 text-cm-text"
                                    : "bg-cm-amber/5 border border-cm-amber/20 text-cm-text"
                                }`}
                              >
                                <span className="text-xs font-semibold text-cm-muted block mb-1">
                                  {turn.role === "user" ? "You" : "Follow-up"}
                                </span>
                                {turn.content}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Radar + Feedback */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {item.grade.dimension_scores.reasoning !== undefined && (
                            <RadarScoreChart
                              dimensionScores={item.grade.dimension_scores}
                              maxScore={5}
                              size={200}
                              animated={false}
                            />
                          )}
                          <div>
                            <h4 className="text-xs font-semibold text-cm-muted uppercase mb-1">Feedback</h4>
                            <p className="text-sm text-cm-text">{item.grade.feedback}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
