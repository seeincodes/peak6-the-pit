import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Star, Filter, Bookmark, Trash2 } from "lucide-react";
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

interface BookmarkItem {
  scenario_id: string;
  category: string;
  difficulty: string;
  title: string;
  tag: string;
  created_at: string;
}

type Tab = "history" | "bookmarks";

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState<Tab>("history");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: items, isLoading: historyLoading } = useQuery<HistoryItem[]>({
    queryKey: ["response-history", categoryFilter, showLowOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryFilter) params.set("category", categoryFilter);
      if (showLowOnly) params.set("max_score", "2.5");
      params.set("limit", "30");
      return (await api.get(`/responses/history?${params}`)).data;
    },
    enabled: activeTab === "history",
  });

  const { data: bookmarks, isLoading: bookmarksLoading } = useQuery<BookmarkItem[]>({
    queryKey: ["bookmarks"],
    queryFn: async () => (await api.get("/bookmarks")).data,
    enabled: activeTab === "bookmarks",
  });

  const removeMutation = useMutation({
    mutationFn: async (scenarioId: string) => {
      await api.delete(`/bookmarks/${scenarioId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const scoreColor = (score: number) => {
    if (score >= 4) return "text-cm-mint";
    if (score >= 3) return "text-cm-amber";
    return "text-cm-red";
  };

  const tabs: { key: Tab; label: string; icon: typeof Bookmark }[] = [
    { key: "history", label: "History", icon: ChevronDown },
    { key: "bookmarks", label: "Bookmarks", icon: Bookmark },
  ];

  return (
    <div className="cm-page max-w-3xl space-y-6">
      <h2 className="cm-title">Review</h2>

      {/* Tabs */}
      <div className="flex gap-1 bg-cm-bg border border-cm-border rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              relative flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${activeTab === tab.key
                ? "text-cm-text"
                : "text-cm-muted hover:text-cm-text"
              }
            `}
          >
            {activeTab === tab.key && (
              <motion.div
                layoutId="review-tab-bg"
                className="absolute inset-0 bg-cm-card-raised rounded-md border border-cm-border/50"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <tab.icon size={14} />
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* History Tab */}
      {activeTab === "history" && (
        <>
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

          {historyLoading && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-6 h-6 border-2 border-cm-primary/30 border-t-cm-primary rounded-full animate-spin" />
              <span className="text-cm-muted text-sm">Loading history...</span>
            </div>
          )}

          {items && items.length === 0 && (
            <div className="cm-surface p-8 text-center text-cm-muted">
              No completed attempts yet. Start training to build your history!
            </div>
          )}

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
                            size={12}
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

                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-cm-border/50"
                        >
                          <div className="p-4 space-y-4">
                            <div>
                              <h4 className="text-xs font-semibold text-cm-muted uppercase mb-1">Question</h4>
                              <p className="text-sm text-cm-text">{item.question}</p>
                            </div>

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
        </>
      )}

      {/* Bookmarks Tab */}
      {activeTab === "bookmarks" && (
        <>
          {bookmarksLoading && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-6 h-6 border-2 border-cm-primary/30 border-t-cm-primary rounded-full animate-spin" />
              <span className="text-cm-muted text-sm">Loading bookmarks...</span>
            </div>
          )}

          {bookmarks && bookmarks.length === 0 && (
            <div className="cm-surface p-8 text-center text-cm-muted">
              No bookmarks yet. Bookmark scenarios from the grade screen to save them here.
            </div>
          )}

          <div className="space-y-2">
            {bookmarks?.map((b, i) => {
              const color = categoryColors[b.category] || "#4D34EF";
              const diffLevel = b.difficulty === "beginner" ? 1 : b.difficulty === "intermediate" ? 2 : 3;

              return (
                <motion.div
                  key={b.scenario_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="cm-surface p-4 flex items-center gap-3"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-cm-text font-medium truncate">{b.title}</p>
                    <p className="text-xs text-cm-muted">
                      {categoryDisplay[b.category] || b.category} &middot;{" "}
                      <span className="capitalize">{b.tag}</span> &middot;{" "}
                      {new Date(b.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="flex items-center gap-0.5">
                    {[1, 2, 3].map((j) => (
                      <Star
                        key={j}
                        size={12}
                        className={j <= diffLevel ? "text-cm-amber fill-cm-amber" : "text-cm-amber/30"}
                      />
                    ))}
                  </span>
                  <button
                    onClick={() => removeMutation.mutate(b.scenario_id)}
                    className="text-cm-muted hover:text-cm-red transition-colors p-1"
                    title="Remove bookmark"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
