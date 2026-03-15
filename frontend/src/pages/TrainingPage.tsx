import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, HelpCircle, Check } from "lucide-react";
import ScenarioCard from "../components/ScenarioCard";
import ResponseInput from "../components/ResponseInput";
import GradeReveal from "../components/GradeReveal";
import LevelUpModal from "../components/LevelUpModal";
import BadgeUnlockModal from "../components/BadgeUnlockModal";
import RecommendedSection from "../components/RecommendedSection";
import ConceptPrimer from "../components/ConceptPrimer";
import OnboardingModal from "../components/OnboardingModal";
import QuickFirePage from "./QuickFirePage";
import { useXPToast } from "../context/XPToastContext";
import api from "../api/client";
import { categoryShortDisplay, categoryColors, categorySections } from "../theme/colors";

type Mode = "select" | "path-mcq" | "deep-streaming" | "deep-scenario" | "deep-probe" | "deep-grading" | "deep-result" | "deep-error";

interface ScenarioData {
  id: string;
  category: string;
  difficulty: string;
  content: {
    title: string;
    setup: string;
    question: string;
    concept_explainer?: string;
    hints?: string[];
  };
}

interface BadgeData {
  name: string;
  description: string;
  icon: string;
  tier: string;
}

interface PathAdvancement {
  path_id: string;
  path_name: string;
  step_completed: number;
  step_title: string;
  total_steps: number;
  path_completed: boolean;
}

interface GradeData {
  grade: {
    dimension_scores: Record<string, number>;
    overall_score: number;
    feedback: string;
  };
  xp_earned: number;
  xp_breakdown?: {
    base: number;
    streak_bonus: number;
    perfect_bonus: number;
    no_hints_bonus: number;
    daily_first_bonus: number;
    hint_penalty_pct: number;
    total: number;
  };
  xp_total: number;
  level: number;
  level_progress?: {
    current_xp: number;
    level_min_xp: number;
    level_max_xp: number;
  };
  hints_used?: number;
  new_badges?: BadgeData[];
  bonuses?: {
    daily_first: boolean;
    perfect: boolean;
    no_hints: boolean;
  };
  path_advancements?: PathAdvancement[];
}

export default function TrainingPage({
  unlockedCategories,
  hasOnboarded = true,
}: {
  unlockedCategories: { category: string; difficulty: string }[];
  hasOnboarded?: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const autoStarted = useRef(false);
  const { showXPToast } = useXPToast();

  const [showOnboarding, setShowOnboarding] = useState(!hasOnboarded);
  const [mode, setMode] = useState<Mode>("select");
  const [selectedCat, setSelectedCat] = useState<{ category: string; difficulty: string } | null>(null);
  const [activePathId, setActivePathId] = useState<string | null>(null);
  const [activePathLearningObjective, setActivePathLearningObjective] = useState<string | null>(null);
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [probeQuestion, setProbeQuestion] = useState<string | null>(null);
  const [gradeData, setGradeData] = useState<GradeData | null>(null);
  const [_prevLevel, setPrevLevel] = useState<number | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<BadgeData[]>([]);
  const [deepError, setDeepError] = useState<string | null>(null);
  const [primerCategory, setPrimerCategory] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const queryClient = useQueryClient();

  const { data: categoryStats } = useQuery<{ category: string; avg_score: number; attempts: number }[]>({
    queryKey: ["category-summary"],
    queryFn: async () => (await api.get("/performance/category-summary")).data,
    staleTime: 60_000,
  });

  const { data: effectiveDifficulties } = useQuery<Record<string, string>>({
    queryKey: ["effective-difficulties"],
    queryFn: async () => (await api.get("/scenarios/effective-difficulties")).data,
    staleTime: 30_000,
  });

  // Auto-start scenario or MCQ when navigated from a learning path
  useEffect(() => {
    const state = location.state as {
      category?: string; difficulty?: string; fromPath?: string;
      learningObjective?: string; stepType?: string;
    } | null;
    if (state?.category && state?.difficulty && state?.fromPath && !autoStarted.current) {
      autoStarted.current = true;
      setActivePathId(state.fromPath);
      const cat = { category: state.category, difficulty: state.difficulty };
      setSelectedCat(cat);
      if (state.stepType === "mcq") {
        setActivePathLearningObjective(state.learningObjective || null);
        setMode("path-mcq");
      } else {
        setActivePathLearningObjective(null);
        generateStreaming(cat, state.learningObjective);
      }
      // Clear location state to prevent re-trigger on remount
      window.history.replaceState({}, "");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      showXPToast(data.xp_earned);

      const userData = queryClient.getQueryData<{ level: number }>(["user"]);
      if (userData && data.level > userData.level) {
        setPrevLevel(userData.level);
        setShowLevelUp(true);
      }

      if (data.new_badges && data.new_badges.length > 0) {
        setEarnedBadges(data.new_badges);
        setShowBadges(true);
      }

      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["paths"] });
      queryClient.invalidateQueries({ queryKey: ["path-detail"] });
      queryClient.invalidateQueries({ queryKey: ["effective-difficulties"] });
      queryClient.invalidateQueries({ queryKey: ["category-summary"] });
      queryClient.invalidateQueries({ queryKey: ["daily-challenges"] });
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
    setEarnedBadges([]);
    setActivePathId(null);
    setActivePathLearningObjective(null);
  };

  const [loadingNextStep, setLoadingNextStep] = useState(false);

  const startNextPathStep = async () => {
    if (!activePathId) return;
    setLoadingNextStep(true);
    try {
      const res = await api.post(`/paths/${activePathId}/start-step`);
      const { category, difficulty, step_description, step_type, path_id } = res.data;
      // Reset scenario state for next step
      setScenario(null);
      setResponseId(null);
      setProbeQuestion(null);
      setGradeData(null);
      setDeepError(null);
      setHintsUsed(0);
      setEarnedBadges([]);
      setActivePathId(path_id);
      const cat = { category, difficulty };
      setSelectedCat(cat);
      if (step_type === "mcq") {
        setActivePathLearningObjective(step_description || null);
        setMode("path-mcq");
      } else {
        setActivePathLearningObjective(null);
        generateStreaming(cat, step_description);
      }
    } catch {
      // Path completed or error — go back to paths page
      navigate("/paths");
    } finally {
      setLoadingNextStep(false);
    }
  };

  const generateStreaming = async (params: { category: string; difficulty: string }, learningObjective?: string) => {
    setDeepError(null);
    setMode("deep-streaming");

    try {
      const token = localStorage.getItem("token");
      const apiBase = import.meta.env.VITE_API_URL || "/api";
      const body: Record<string, string> = { ...params };
      if (learningObjective) {
        body.learning_objective = learningObjective;
      }
      const response = await fetch(`${apiBase}/scenarios/generate-stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
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

  const loadingMessages = [
    "Pulling market data...",
    "Calculating implied volatility...",
    "Analyzing the options chain...",
    "Scanning for mispricings...",
    "Modeling risk scenarios...",
    "Checking Greeks exposure...",
    "Evaluating skew surface...",
    "Running Monte Carlo sims...",
    "Stress-testing the book...",
    "Reviewing term structure...",
    "Pricing exotic payoffs...",
    "Assessing tail risk...",
  ];

  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    if (mode !== "deep-streaming") return;
    setLoadingMsgIdx(Math.floor(Math.random() * loadingMessages.length));
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length);
    }, 2750);
    return () => clearInterval(interval);
  }, [mode]);

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
            <h2 className="cm-title">Select Scenario</h2>
            <button
              onClick={() => setShowOnboarding(true)}
              className="text-cm-muted hover:text-cm-primary transition-colors p-1"
              aria-label="Show guided tour"
              title="How it works"
            >
              <HelpCircle size={18} />
            </button>
          </div>
          <div className="space-y-3">
            <RecommendedSection
              onSelect={(category, difficulty) => {
                const cat = { category, difficulty };
                setSelectedCat(cat);
                generateStreaming(cat);
              }}
            />
            {(() => {
              const grouped = new Map<string, string[]>();
              for (const cat of unlockedCategories) {
                const existing = grouped.get(cat.category) || [];
                existing.push(cat.difficulty);
                grouped.set(cat.category, existing);
              }
              const diffOrder = ["beginner", "intermediate", "advanced"];
              const statsMap = new Map(
                (categoryStats || []).map((s) => [s.category, s])
              );
              const radius = 16;
              const circumference = 2 * Math.PI * radius;

              return categorySections
                .map((section) => {
                  const sectionCats = section.categories.filter((c) => grouped.has(c));
                  if (sectionCats.length === 0) return null;
                  return (
                    <div key={section.label}>
                      <h3 className="text-[10px] font-semibold text-cm-muted/60 uppercase tracking-widest mb-2">
                        {section.label}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {sectionCats.map((category) => {
                          const difficulties = grouped.get(category)!;
                          const color = categoryColors[category] || "#4D34EF";
                          const sorted = difficulties.sort((a, b) => diffOrder.indexOf(a) - diffOrder.indexOf(b));
                          const adaptiveDifficulty = effectiveDifficulties?.[category] || sorted[0];
                          const stat = statsMap.get(category);
                          const pct = stat ? Math.round((stat.avg_score / 5) * 100) : 0;
                          const label = !stat || stat.attempts === 0
                            ? "New"
                            : stat.avg_score >= 3.5
                              ? "Mastery"
                              : stat.avg_score >= 2.5
                                ? "Proficient"
                                : "Developing";
                          const strokeDash = circumference * (pct / 100);

                          return (
                            <button
                              key={category}
                              onClick={() => {
                                const cat = { category, difficulty: adaptiveDifficulty };
                                setSelectedCat(cat);
                                generateStreaming(cat);
                              }}
                              className="cm-surface-interactive p-3 text-left flex items-center gap-3"
                              style={{ borderColor: `${color}40` }}
                            >
                              {/* Progress ring */}
                              <div className="relative w-10 h-10 flex-shrink-0">
                                <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
                                  <circle cx="20" cy="20" r={radius} fill="none" stroke="currentColor" className="text-cm-bg" strokeWidth="3" />
                                  <circle cx="20" cy="20" r={radius} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${strokeDash} ${circumference}`} className="transition-all duration-500" />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-cm-text">
                                  {stat && stat.attempts > 0 ? stat.avg_score.toFixed(1) : "—"}
                                </span>
                              </div>

                              {/* Text content */}
                              <div className="flex-1 min-w-0">
                                <span className="text-cm-text font-semibold text-sm leading-tight block truncate">
                                  {categoryShortDisplay[category] || category.replace(/_/g, " ")}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`text-[10px] font-medium capitalize px-1.5 py-0.5 rounded ${
                                    adaptiveDifficulty === "advanced" ? "bg-cm-red/15 text-cm-red" :
                                    adaptiveDifficulty === "intermediate" ? "bg-cm-amber/15 text-cm-amber" :
                                    "bg-cm-primary/15 text-cm-primary"
                                  }`}>
                                    {adaptiveDifficulty}
                                  </span>
                                  <span className={`text-[11px] font-medium ${
                                    label === "Mastery" ? "text-cm-emerald" :
                                    label === "Proficient" ? "text-cm-amber" :
                                    label === "Developing" ? "text-cm-primary" :
                                    "text-cm-muted"
                                  }`}>
                                    {label}
                                  </span>
                                  {stat && stat.attempts > 0 && (
                                    <span className="text-[10px] text-cm-muted">
                                      · {stat.attempts} done
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Learn */}
                              <button
                                onClick={(e) => { e.stopPropagation(); setPrimerCategory(category); }}
                                className="flex-shrink-0 text-cm-muted hover:text-cm-primary transition-colors p-1"
                                aria-label={`Learn ${categoryShortDisplay[category] || category} concepts`}
                              >
                                <BookOpen size={14} />
                              </button>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
                .filter(Boolean);
            })()}
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
              <div className="h-5 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={loadingMsgIdx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-cm-primary text-sm font-semibold"
                  >
                    {loadingMessages[loadingMsgIdx]}
                  </motion.div>
                </AnimatePresence>
              </div>
              {selectedCat && (
                <div className="text-cm-muted text-xs">
                  {categoryShortDisplay[selectedCat.category] || selectedCat.category.replace(/_/g, " ")} &middot;{" "}
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
                className="cm-btn-primary"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Learning Path — MCQ step */}
      {mode === "path-mcq" && selectedCat && (
        <QuickFirePage
          category={selectedCat.category}
          difficulty={selectedCat.difficulty}
          learningObjective={activePathLearningObjective ?? undefined}
          requireJustification={false}
          onExit={() => {
            queryClient.invalidateQueries({ queryKey: ["paths"] });
            queryClient.invalidateQueries({ queryKey: ["path-detail"] });
            if (activePathId) {
              startNextPathStep();
            } else {
              reset();
            }
          }}
        />
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
          <div className="cm-surface p-4 flex items-start gap-3">
            <span
              className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
              style={{ backgroundColor: categoryColors[scenario.category] || "#4D34EF" }}
            />
            <div className="min-w-0">
              <p className="text-cm-text font-semibold text-sm">{scenario.content.title}</p>
              <p className="text-cm-muted text-xs mt-0.5 line-clamp-2">{scenario.content.question}</p>
            </div>
          </div>
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
            xpBreakdown={gradeData.xp_breakdown}
            levelProgress={gradeData.level_progress}
            level={gradeData.level}
            hintsUsed={gradeData.hints_used ?? hintsUsed}
            responseId={responseId ?? undefined}
            scenarioId={scenario?.id}
            bonuses={gradeData.bonuses}
          />
          {gradeData.path_advancements && gradeData.path_advancements.length > 0 && (
            <div className="space-y-2">
              {gradeData.path_advancements.map((adv) => (
                <motion.div
                  key={adv.path_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`cm-surface p-4 flex items-center gap-3 ${
                    adv.path_completed ? "border-cm-emerald/40" : "border-cm-primary/30"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    adv.path_completed ? "bg-cm-emerald/15" : "bg-cm-primary/15"
                  }`}>
                    <Check size={16} className={adv.path_completed ? "text-cm-emerald" : "text-cm-primary"} />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${adv.path_completed ? "text-cm-emerald" : "text-cm-primary"}`}>
                      {adv.path_completed ? "Lesson Completed!" : "Lesson Step Complete!"}
                    </p>
                    <p className="text-cm-muted text-xs">
                      {adv.step_title} in {adv.path_name}
                      {!adv.path_completed && ` — Step ${adv.step_completed}/${adv.total_steps}`}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          <div className="text-center flex items-center justify-center gap-3">
            {activePathId ? (
              <>
                <button
                  onClick={startNextPathStep}
                  disabled={loadingNextStep}
                  className="cm-btn-primary-lg"
                >
                  {loadingNextStep ? "Loading..." : "Next Lesson Step"}
                </button>
                <button
                  onClick={() => navigate("/paths")}
                  className="text-cm-muted hover:text-cm-text text-sm transition-colors"
                >
                  Back to Lessons
                </button>
              </>
            ) : (
              <button
                onClick={reset}
                className="cm-btn-primary-lg"
              >
                Next Scenario
              </button>
            )}
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

      <BadgeUnlockModal
        show={showBadges}
        badges={earnedBadges}
        onClose={() => setShowBadges(false)}
      />

      <OnboardingModal
        show={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />

      {primerCategory && (
        <ConceptPrimer
          category={primerCategory}
          onClose={() => setPrimerCategory(null)}
        />
      )}
    </div>
  );
}
