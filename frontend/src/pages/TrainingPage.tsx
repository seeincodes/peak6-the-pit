import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import ScenarioCard from "../components/ScenarioCard";
import ResponseInput from "../components/ResponseInput";
import GradeReveal from "../components/GradeReveal";
import LevelUpModal from "../components/LevelUpModal";
import api from "../api/client";

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
  };

  const generateStreaming = async (params: { category: string; difficulty: string }) => {
    setDeepError(null);
    setMode("deep-streaming");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/scenarios/generate-stream", {
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
      {/* Category selection → goes straight to Deep Analysis */}
      {mode === "select" && (
        <div>
          <h2 className="cm-title mb-4">Select Scenario</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unlockedCategories.map((cat) => (
              <button
                key={`${cat.category}-${cat.difficulty}`}
                onClick={() => {
                  setSelectedCat(cat);
                  generateStreaming(cat);
                }}
                className="cm-surface-interactive p-4"
              >
                <div className="text-cm-text font-semibold text-sm">
                  {cat.category.replace(/_/g, " ").toUpperCase()}
                </div>
                <div className="text-cm-muted text-xs mt-1 capitalize">{cat.difficulty}</div>
              </button>
            ))}
          </div>
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
                  {selectedCat.category.replace(/_/g, " ").toUpperCase()} &middot;{" "}
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
            category={scenario.category}
            difficulty={scenario.difficulty}
            content={scenario.content}
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
            category={scenario.category}
            difficulty={scenario.difficulty}
            content={scenario.content}
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
