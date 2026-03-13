import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, BookOpen, HelpCircle, Check, Sparkles, BookText } from "lucide-react";
import ScenarioCard from "../components/ScenarioCard";
import ResponseInput from "../components/ResponseInput";
import GradeReveal from "../components/GradeReveal";
import LevelUpModal from "../components/LevelUpModal";
import BadgeUnlockModal from "../components/BadgeUnlockModal";
import CategoryProgress from "../components/CategoryProgress";
import RecommendedSection from "../components/RecommendedSection";
import DifficultySuggestion from "../components/DifficultySuggestion";
import ConceptPrimer from "../components/ConceptPrimer";
import OnboardingModal from "../components/OnboardingModal";
import GlossaryPanel from "../components/GlossaryPanel";
import QuickFirePage from "./QuickFirePage";
import { useXPToast } from "../context/XPToastContext";
import api from "../api/client";
import { categoryDisplay, categoryColors, categoryDescriptions, categoryGroups } from "../theme/colors";

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
  const [pendingPrimerStart, setPendingPrimerStart] = useState<{ category: string; difficulty: string } | null>(null);
  const [showGlossary, setShowGlossary] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const queryClient = useQueryClient();

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
        setMode("path-mcq");
      } else {
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
        setMode("path-mcq");
      } else {
        generateStreaming(cat, step_description);
      }
    } catch {
      // Path completed or error — go back to paths page
      navigate("/paths");
    } finally {
      setLoadingNextStep(false);
    }
  };

  const startCategoryRoute = (category: string, difficulty: string) => {
    const cat = { category, difficulty };
    setSelectedCat(cat);
    const primerSeenKey = `primer_seen_${category}`;
    const primerSeen = localStorage.getItem(primerSeenKey) === "1";

    if (!primerSeen) {
      setPendingPrimerStart(cat);
      setPrimerCategory(category);
      return;
    }

    generateStreaming(cat);
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
    "Building your custom market scenario...",
    "Mapping volatility regime context...",
    "Checking strike-by-strike skew pressure...",
    "Scanning chain structure for tradeable edges...",
    "Stress-testing risk under alternate paths...",
    "Drafting a follow-up that tests your thesis...",
    "Translating desk context into clear prompts...",
    "Finalizing feedback rubric for this scenario...",
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
          <div className="flex items-center justify-between mb-4 gap-3">
            <div>
              <h2 className="cm-title">Choose Your Practice Track</h2>
              <p className="cm-label mt-1">Start with a primer, then test yourself with scenario grading.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGlossary(true)}
                className="cm-btn-secondary px-3 py-2 inline-flex items-center gap-2"
                aria-label="Open glossary"
                title="Glossary"
              >
                <BookText size={14} />
                <span className="hidden sm:inline">Glossary</span>
              </button>
              <button
                onClick={() => setShowOnboarding(true)}
                className="cm-btn-ghost p-2"
                aria-label="Show guided tour"
                title="How it works"
              >
                <HelpCircle size={18} />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <RecommendedSection
              onSelect={(category, difficulty) => {
                startCategoryRoute(category, difficulty);
              }}
            />
            <DifficultySuggestion
              onAccept={(category, difficulty) => {
                startCategoryRoute(category, difficulty);
              }}
            />
            <CategoryProgress />
            {(() => {
              const categoryToDiffs = new Map<string, string[]>();
              for (const cat of unlockedCategories) {
                const existing = categoryToDiffs.get(cat.category) || [];
                existing.push(cat.difficulty);
                categoryToDiffs.set(cat.category, existing);
              }

              const diffOrder = ["beginner", "intermediate", "advanced"];

              return categoryGroups
                .map((group) => {
                  const entries = group.categories
                    .map((category) => ({
                      category,
                      difficulties: (categoryToDiffs.get(category) || []).sort(
                        (a, b) => diffOrder.indexOf(a) - diffOrder.indexOf(b),
                      ),
                    }))
                    .filter((entry) => entry.difficulties.length > 0);

                  if (entries.length === 0) return null;

                  return (
                    <section key={group.id} className="cm-surface p-4 sm:p-5">
                      <div className="mb-4">
                        <h3 className="text-cm-text font-bold text-base">{group.title}</h3>
                        <p className="text-cm-muted text-sm mt-1">{group.description}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {entries.map(({ category, difficulties }) => {
                          const color = categoryColors[category] || "#4D34EF";
                          return (
                            <article key={category} className="cm-surface-section p-3.5">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-cm-text font-semibold text-sm flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                    {categoryDisplay[category] || category.replace(/_/g, " ")}
                                  </p>
                                  <p className="text-cm-muted text-xs mt-1">
                                    {categoryDescriptions[category] || "Practice this category with adaptive difficulty."}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setPrimerCategory(category)}
                                  className="cm-btn-ghost p-1.5"
                                  aria-label={`Learn ${categoryDisplay[category] || category} concepts`}
                                  title="Learn First"
                                >
                                  <BookOpen size={14} />
                                </button>
                              </div>
                              <div className="mt-3 flex items-center gap-2 flex-wrap">
                                {difficulties.map((difficulty) => {
                                  const diffLevel = difficulty === "beginner" ? 1 : difficulty === "intermediate" ? 2 : 3;
                                  return (
                                    <button
                                      key={difficulty}
                                      onClick={() => startCategoryRoute(category, difficulty)}
                                      className="cm-surface-interactive px-3 py-2 text-xs inline-flex items-center gap-2"
                                      style={{ borderColor: `${color}66` }}
                                    >
                                      <span className="capitalize text-cm-text font-semibold">{difficulty}</span>
                                      <span className="flex items-center gap-0.5">
                                        {[1, 2, 3].map((i) => (
                                          <Star
                                            key={i}
                                            size={10}
                                            className={i <= diffLevel ? "text-cm-amber fill-cm-amber" : "text-cm-muted"}
                                          />
                                        ))}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
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
                className="w-10 h-10 rounded-full border-2 border-cm-border border-t-cm-primary"
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
                  {categoryDisplay[selectedCat.category] || selectedCat.category.replace(/_/g, " ")} &middot;{" "}
                  {selectedCat.difficulty}
                </div>
              )}
              <div className="inline-flex items-center gap-2 text-cm-muted text-xs">
                <Sparkles size={12} className="text-cm-primary" />
                Reviewing context before assessment
              </div>
              <button onClick={() => setShowGlossary(true)} className="cm-btn-ghost text-xs px-2 py-1">
                Open glossary while loading
              </button>
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

      {/* Learning Path — MCQ step */}
      {mode === "path-mcq" && selectedCat && (
        <QuickFirePage
          category={selectedCat.category}
          difficulty={selectedCat.difficulty}
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
          <ScenarioCard
            id={scenario.id}
            category={scenario.category}
            difficulty={scenario.difficulty}
            content={scenario.content}
            onHintsUsedChange={setHintsUsed}
          />
          <div className="cm-surface-section p-4">
            <h3 className="text-cm-primary font-semibold text-sm mb-2">Follow-up Question</h3>
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
                      {adv.path_completed ? "Path Completed!" : "Path Step Complete!"}
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
                  className="cm-btn-primary-lg px-8 py-3"
                >
                  {loadingNextStep ? "Loading..." : "Next Path Step"}
                </button>
                <button
                  onClick={() => navigate("/paths")}
                  className="text-cm-muted hover:text-cm-text text-sm transition-colors"
                >
                  Back to Paths
                </button>
              </>
            ) : (
              <button
                onClick={reset}
                className="cm-btn-primary-lg px-8 py-3"
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

      <GlossaryPanel open={showGlossary} onClose={() => setShowGlossary(false)} />

      {primerCategory && (
        <ConceptPrimer
          category={primerCategory}
          onClose={() => {
            setPrimerCategory(null);
            setPendingPrimerStart(null);
          }}
          onStart={
            pendingPrimerStart
              ? () => {
                  localStorage.setItem(`primer_seen_${pendingPrimerStart.category}`, "1");
                  const cat = pendingPrimerStart;
                  setPrimerCategory(null);
                  setPendingPrimerStart(null);
                  generateStreaming(cat);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
