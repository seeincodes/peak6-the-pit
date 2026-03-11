import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3, Star } from "lucide-react";
import ScenarioCard from "../components/ScenarioCard";
import ResponseInput from "../components/ResponseInput";
import GradeReveal from "../components/GradeReveal";
import LevelUpModal from "../components/LevelUpModal";
import PerformanceCharts from "../components/charts/PerformanceCharts";
import api from "../api/client";
import { categoryDisplay, categoryColors } from "../theme/colors";

type Mode = "select" | "deep-streaming" | "deep-scenario" | "deep-probe" | "deep-grading" | "deep-result" | "deep-error";

interface ScenarioData {
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

interface GradeData {
  grade: {
    dimension_scores: Record<string, number>;
    overall_score: number;
    feedback: string;
  };
  xp_earned: number;
  xp_total: number;
  level: number;
  hints_used?: number;
}

export default function TrainingPage({
  unlockedCategories,
}: {
  unlockedCategories: { category: string; difficulty: string }[];
}) {
  const [mode, setMode] = useState<Mode>("select");
  const [selectedCat, setSelectedCat] = useState<{ category: string; difficulty: string } | null>(null);
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [probeQuestion, setProbeQuestion] = useState<string | null>(null);
  const [gradeData, setGradeData] = useState<GradeData | null>(null);
  const [_prevLevel, setPrevLevel] = useState<number | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [deepError, setDeepError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (answerText: string) => {
      const res = await api.post("/responses", {
        scenario_id: scenario!.id,
        answer_text: answerText,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setResponseId(data.response_id);
      setProbeQuestion(data.probe_question);
      setMode("deep-probe");
    },
  });

  const continueMutation = useMutation({
    mutationFn: async (answerText: string) => {
      const res = await api.post(`/responses/${responseId}/continue`, {
        answer_text: answerText,
        hints_used: hintsUsed,
      });
      return res.data as GradeData;
    },
    onSuccess: (data) => {
      setGradeData(data);
      setMode("deep-result");

      const userData = queryClient.getQueryData<{ level: number }>(["user"]);
      if (userData && data.level > userData.level) {
        setPrevLevel(userData.level);
        setShowLevelUp(true);
      }

      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const reset = () => {
    setMode("select");
    setSelectedCat(null);
    setScenario(null);
    setResponseId(null);
    setProbeQuestion(null);
    setGradeData(null);
    setDeepError(null);
    setHintsUsed(0);
  };

  const generateStreaming = async (params: { category: string; difficulty: string }) => {
    setDeepError(null);
    setMode("deep-streaming");

    try {
      const token = localStorage.getItem("token");
      const apiBase = import.meta.env.VITE_API_URL || "/api";
      const response = await fetch(`${apiBase}/scenarios/generate-stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const msg = response.status === 401
          ? "Session expired. Please log in again."
          : `Server error (${response.status}). Please try again.`;
        setDeepError(msg);
        setMode("deep-error");
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let gotDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));

          if (data.type === "error") {
            setDeepError(data.message || "Scenario generation failed.");
            setMode("deep-error");
            return;
          } else if (data.type === "done") {
            gotDone = true;
            setScenario({
              id: data.id,
              category: params.category,
              difficulty: params.difficulty,
              content: data.content,
            });
            setMode("deep-scenario");
            return;
          }
        }
      }

      if (!gotDone) {
        setDeepError("Scenario generation ended unexpectedly. Please try again.");
        setMode("deep-error");
      }
    } catch {
      setDeepError("Network error. Please check your connection and try again.");
      setMode("deep-error");
    }
  };

  const levelTitles: Record<number, string> = {
    1: "Initiate", 2: "Analyst", 3: "Strategist", 4: "Risk Manager",
    5: "Volatility Trader", 6: "Senior Strategist", 7: "Portfolio Lead",
    8: "Head Trader", 9: "Master Trader", 10: "Desk Head",
  };

  return (
    <div className="cm-page max-w-3xl space-y-6">
      {/* Category selection — grouped by skill with difficulty routes */}
      {mode === "select" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="cm-title">{showStats ? "My Stats" : "Select Scenario"}</h2>
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all border border-cm-border hover:border-cm-primary/40 text-cm-muted hover:text-cm-text"
            >
              <BarChart3 size={14} />
              {showStats ? "Scenarios" : "My Stats"}
            </button>
          </div>
          {showStats ? (
            <PerformanceCharts />
          ) : (
          <div className="space-y-3">
            {(() => {
              const grouped = new Map<string, string[]>();
              for (const cat of unlockedCategories) {
                const existing = grouped.get(cat.category) || [];
                existing.push(cat.difficulty);
                grouped.set(cat.category, existing);
              }
              const diffOrder = ["beginner", "intermediate", "advanced"];
              return Array.from(grouped.entries()).map(([category, difficulties]) => {
                const color = categoryColors[category] || "#4D34EF";
                const sorted = difficulties.sort((a, b) => diffOrder.indexOf(a) - diffOrder.indexOf(b));
                const startRoute = (difficulty: string) => {
                  const cat = { category, difficulty };
                  setSelectedCat(cat);
                  generateStreaming(cat);
                };

                if (sorted.length === 1) {
                  const diffLevel = sorted[0] === "beginner" ? 1 : sorted[0] === "intermediate" ? 2 : 3;
                  return (
                    <button
                      key={category}
                      onClick={() => startRoute(sorted[0])}
                      className="cm-surface-interactive p-4 w-full text-left flex items-center justify-between"
                      style={{ borderColor: `${color}40` }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-cm-text font-semibold text-sm">
                          {categoryDisplay[category] || category.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="capitalize text-cm-muted text-xs">{sorted[0]}</span>
                        <span className="flex items-center gap-0.5">
                          {[1, 2, 3].map((i) => (
                            <Star
                              key={i}
                              size={10}
                              className={i <= diffLevel ? "text-cm-amber fill-cm-amber" : "text-cm-amber/30"}
                            />
                          ))}
                        </span>
                      </div>
                    </button>
                  );
                }

                return (
                  <div key={category} className="cm-surface p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-cm-text font-semibold text-sm">
                        {categoryDisplay[category] || category.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {sorted.map((difficulty) => {
                        const diffLevel = difficulty === "beginner" ? 1 : difficulty === "intermediate" ? 2 : 3;
                        return (
                          <button
                            key={difficulty}
                            onClick={() => startRoute(difficulty)}
                            className="cm-surface-interactive px-3 py-2 flex-1 flex items-center justify-center gap-2 text-xs"
                            style={{ borderColor: `${color}40` }}
                          >
                            <span className="capitalize text-cm-text">{difficulty}</span>
                            <span className="flex items-center gap-0.5">
                              {[1, 2, 3].map((i) => (
                                <Star
                                  key={i}
                                  size={10}
                                  className={i <= diffLevel ? "text-cm-amber fill-cm-amber" : "text-cm-amber/30"}
                                />
                              ))}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
          )}
        </div>
      )}

      {/* Deep Analysis — Loading phase */}
      {mode === "deep-streaming" && (
        <div className="space-y-4">
          <button onClick={reset} className="cm-back-link">
            <ArrowLeft size={16} aria-hidden="true" /> Cancel
          </button>
          <div role="status" aria-live="polite" className="cm-surface p-6">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <motion.div
                className="w-10 h-10 rounded-full border-2 border-cm-primary/30 border-t-cm-primary"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <div className="text-cm-primary text-sm font-semibold animate-pulse">
                Generating scenario...
              </div>
              {selectedCat && (
                <div className="text-cm-muted text-xs">
                  {categoryDisplay[selectedCat.category] || selectedCat.category.replace(/_/g, " ")} &middot;{" "}
                  {selectedCat.difficulty}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Deep Analysis — Error phase */}
      {mode === "deep-error" && (
        <div className="space-y-4">
          <button onClick={reset} className="cm-back-link">
            <ArrowLeft size={16} aria-hidden="true" /> Back
          </button>
          <div className="cm-surface p-6 text-center space-y-4">
            <div className="text-cm-red text-sm font-semibold">{deepError}</div>
            {selectedCat && (
              <button
                onClick={() => generateStreaming(selectedCat)}
                className="cm-btn-primary-lg px-6 py-2"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Deep Analysis — Scenario phase */}
      {mode === "deep-scenario" && scenario && (
        <>
          <button onClick={reset} className="cm-back-link">
            <ArrowLeft size={16} aria-hidden="true" /> Back
          </button>
          <ScenarioCard
            id={scenario.id}
            category={scenario.category}
            difficulty={scenario.difficulty}
            content={scenario.content}
            onHintsUsedChange={setHintsUsed}
          />
          <ResponseInput
            onSubmit={(text) => submitMutation.mutate(text)}
            placeholder="Analyze the scenario and provide your trading thesis..."
            loading={submitMutation.isPending}
          />
        </>
      )}

      {/* Deep Analysis — Probe phase */}
      {mode === "deep-probe" && scenario && probeQuestion && (
        <>
          <ScenarioCard
            id={scenario.id}
            category={scenario.category}
            difficulty={scenario.difficulty}
            content={scenario.content}
            onHintsUsedChange={setHintsUsed}
          />
          <div className="rounded-md border border-cm-amber/30 bg-cm-amber/5 p-4">
            <h3 className="text-cm-amber font-semibold text-sm mb-2">Follow-up Question</h3>
            <p className="text-cm-text text-sm">{probeQuestion}</p>
          </div>
          <ResponseInput
            onSubmit={(text) => continueMutation.mutate(text)}
            placeholder="Elaborate on your reasoning..."
            loading={continueMutation.isPending}
          />
        </>
      )}

      {/* Deep Analysis — Result phase */}
      {mode === "deep-result" && gradeData && (
        <>
          <GradeReveal
            dimensionScores={gradeData.grade.dimension_scores}
            overallScore={gradeData.grade.overall_score}
            feedback={gradeData.grade.feedback}
            xpEarned={gradeData.xp_earned}
            hintsUsed={gradeData.hints_used ?? hintsUsed}
          />
          <div className="text-center">
            <button
              onClick={reset}
              className="cm-btn-primary-lg px-8 py-3"
            >
              Next Scenario
            </button>
          </div>
        </>
      )}

      {showLevelUp && gradeData && (
        <LevelUpModal
          show={showLevelUp}
          level={gradeData.level}
          title={levelTitles[gradeData.level] || `Level ${gradeData.level}`}
          newUnlocks={[]}
          onClose={() => setShowLevelUp(false)}
        />
      )}
    </div>
  );
}
