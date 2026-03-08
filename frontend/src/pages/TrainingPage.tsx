import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ScenarioCard from "../components/ScenarioCard";
import ResponseInput from "../components/ResponseInput";
import GradeReveal from "../components/GradeReveal";
import LevelUpModal from "../components/LevelUpModal";
import QuickFirePage from "./QuickFirePage";
import api from "../api/client";

type Mode = "select" | "pick-mode" | "quickfire" | "deep-scenario" | "deep-probe" | "deep-grading" | "deep-result";

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
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async (params: { category: string; difficulty: string }) => {
      const res = await api.post("/scenarios/generate", params);
      return res.data as ScenarioData;
    },
    onSuccess: (data) => {
      setScenario(data);
      setMode("deep-scenario");
    },
  });

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
  };

  const levelTitles: Record<number, string> = {
    1: "Initiate", 2: "Analyst", 3: "Strategist", 4: "Risk Manager",
    5: "Volatility Trader", 6: "Senior Strategist", 7: "Portfolio Lead",
    8: "Head Trader", 9: "Master Trader", 10: "Desk Head",
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Category selection */}
      {mode === "select" && (
        <div>
          <h2 className="text-2xl font-bold text-cm-text mb-4">Select Scenario</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unlockedCategories.map((cat) => (
              <button
                key={`${cat.category}-${cat.difficulty}`}
                onClick={() => {
                  setSelectedCat(cat);
                  setMode("pick-mode");
                }}
                className="p-4 rounded-xl border border-cm-border bg-cm-card hover:border-cm-cyan/50 hover:shadow-neon-cyan transition-all text-left"
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

      {/* Mode selection */}
      {mode === "pick-mode" && selectedCat && (
        <div>
          <button onClick={() => setMode("select")} className="text-cm-muted text-sm hover:text-cm-text mb-4">
            &larr; Back
          </button>
          <h2 className="text-xl font-bold text-cm-text mb-2">
            {selectedCat.category.replace(/_/g, " ").toUpperCase()}
            <span className="text-cm-muted text-sm ml-2 capitalize">{selectedCat.difficulty}</span>
          </h2>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <button
              onClick={() => setMode("quickfire")}
              className="p-6 rounded-xl border border-cm-border bg-cm-card hover:border-cm-amber/50 transition-all text-left"
            >
              <div className="text-2xl mb-2">&#x26A1;</div>
              <div className="text-cm-text font-bold">Quick Fire</div>
              <div className="text-cm-muted text-xs mt-1">MCQ + justify &bull; ~30s per Q &bull; 5-8 XP</div>
            </button>
            <button
              onClick={() => {
                generateMutation.mutate(selectedCat);
              }}
              disabled={generateMutation.isPending}
              className="p-6 rounded-xl border border-cm-border bg-cm-card hover:border-cm-cyan/50 transition-all text-left"
            >
              <div className="text-2xl mb-2">&#x1F3AF;</div>
              <div className="text-cm-text font-bold">Deep Analysis</div>
              <div className="text-cm-muted text-xs mt-1">Open-ended + probe &bull; ~3-5 min &bull; 16-40 XP</div>
            </button>
          </div>
          {generateMutation.isPending && (
            <div className="text-center text-cm-cyan mt-6 animate-pulse">
              Generating scenario...
            </div>
          )}
        </div>
      )}

      {/* Quick Fire mode */}
      {mode === "quickfire" && selectedCat && (
        <QuickFirePage
          category={selectedCat.category}
          difficulty={selectedCat.difficulty}
          onExit={reset}
        />
      )}

      {/* Deep Analysis — Scenario phase */}
      {mode === "deep-scenario" && scenario && (
        <>
          <button onClick={reset} className="text-cm-muted text-sm hover:text-cm-text">
            &larr; Back
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
          <div className="rounded-xl border border-cm-amber/30 bg-cm-amber/5 p-4">
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
              className="px-8 py-3 rounded-xl bg-cm-cyan/20 border border-cm-cyan/50 text-cm-cyan font-bold hover:bg-cm-cyan/30 transition-all"
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
