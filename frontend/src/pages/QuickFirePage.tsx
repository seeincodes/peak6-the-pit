import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Timer, Zap } from "lucide-react";
import MCQCard from "../components/MCQCard";
import MCQFeedback from "../components/MCQFeedback";
import StreakBadge from "../components/StreakBadge";
import QuickFireScoreCard from "../components/QuickFireScoreCard";
import { useXPToast } from "../context/XPToastContext";
import api from "../api/client";

interface MCQData {
  id: string;
  category: string;
  difficulty: string;
  content: {
    concept_explainer?: string;
    context: string;
    question: string;
    choices: { key: string; text: string }[];
  };
}

interface MCQResult {
  is_correct: boolean;
  correct_key: string;
  explanation: string;
  justification_quality: string;
  justification_note: string;
  xp_earned: number;
  xp_breakdown?: {
    base: number;
    streak_bonus: number;
    daily_first_bonus: number;
    total: number;
  };
  xp_total: number;
  level: number;
  level_progress?: {
    current_xp: number;
    level_min_xp: number;
    level_max_xp: number;
  };
  is_daily_first?: boolean;
}

type Phase = "loading" | "question" | "justify" | "feedback" | "summary";
type TimerOption = 0 | 30 | 60;

const LIGHTNING_ROUND_COUNT = 10;

export default function QuickFirePage({
  category,
  difficulty,
  learningObjective,
  onExit,
  initialMCQ,
  requireJustification = true,
}: {
  category: string;
  difficulty: string;
  learningObjective?: string;
  onExit: () => void;
  initialMCQ?: MCQData | null;
  requireJustification?: boolean;
}) {
  const { showXPToast } = useXPToast();
  const [phase, setPhase] = useState<Phase>(initialMCQ ? "question" : "loading");
  const [currentMCQ, setCurrentMCQ] = useState<MCQData | null>(initialMCQ ?? null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [justification, setJustification] = useState("");
  const [pasteBlocked, setPasteBlocked] = useState(false);
  const [result, setResult] = useState<MCQResult | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [questionCount, setQuestionCount] = useState(initialMCQ ? 1 : 0);

  // Timer state
  const [timerOption, setTimerOption] = useState<TimerOption>(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lightning round tracking
  const [lightningMode, setLightningMode] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [goodJustCount, setGoodJustCount] = useState(0);

  const prefetchQueue = useRef<MCQData[]>([]);
  const queryClient = useQueryClient();

  // Advance to next question helper
  const advanceToNext = useCallback(() => {
    const next = prefetchQueue.current.shift();
    if (next) {
      setCurrentMCQ(next);
      setPhase("question");
    } else {
      setPhase("loading");
      fetchMCQRef.current().then((mcq) => {
        setCurrentMCQ(mcq);
        setPhase("question");
      });
    }
    setSelectedKey(null);
    setJustification("");
    setResult(null);
    setQuestionCount((prev) => prev + 1);
  }, []);

  // Timer logic
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timerOption === 0 || phase !== "question") return;

    setTimeLeft(timerOption);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerOption, phase, currentMCQ?.id]);

  // Handle timer expiry separately to avoid stale closures
  useEffect(() => {
    if (timerOption > 0 && timeLeft === 0 && phase === "question" && currentMCQ) {
      setStreak(0);
      if (lightningMode && questionCount >= LIGHTNING_ROUND_COUNT) {
        setPhase("summary");
      } else {
        advanceToNext();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const fetchMCQ = useCallback(async (): Promise<MCQData> => {
    const payload: Record<string, string> = { category, difficulty };
    if (learningObjective) {
      payload.learning_objective = learningObjective;
    }
    const res = await api.post("/mcq/generate", payload);
    return res.data;
  }, [category, difficulty, learningObjective]);

  // Stable ref for fetchMCQ to use in advanceToNext
  const fetchMCQRef = useRef(fetchMCQ);
  fetchMCQRef.current = fetchMCQ;

  const prefetch = useCallback(async () => {
    while (prefetchQueue.current.length < 2) {
      try {
        const mcq = await fetchMCQ();
        prefetchQueue.current.push(mcq);
      } catch {
        break;
      }
    }
  }, [fetchMCQ]);

  useEffect(() => {
    if (initialMCQ) {
      setCurrentMCQ(initialMCQ);
      setPhase("question");
      setQuestionCount(1);
      prefetch();
      return;
    }
    let cancelled = false;
    (async () => {
      const first = await fetchMCQ();
      if (!cancelled) {
        setCurrentMCQ(first);
        setPhase("question");
        setQuestionCount(1);
      }
      prefetch();
    })();
    return () => { cancelled = true; };
  }, [initialMCQ, fetchMCQ, prefetch]);

  const handleSelect = (key: string) => {
    setSelectedKey(key);
    if (timerRef.current) clearInterval(timerRef.current);
    if (requireJustification) {
      setPhase("justify");
      return;
    }
    submitMutation.mutate({ chosenKey: key, justificationText: "", pathMode: true });
  };

  const submitMutation = useMutation({
    mutationFn: async ({
      chosenKey,
      justificationText,
      pathMode,
    }: {
      chosenKey: string;
      justificationText: string;
      pathMode: boolean;
    }) => {
      const res = await api.post("/mcq/submit", {
        scenario_id: currentMCQ!.id,
        chosen_key: chosenKey,
        justification: justificationText,
        path_mode: pathMode,
        streak_count: streak,
      });
      return res.data as MCQResult;
    },
    onSuccess: (data) => {
      setResult(data);
      setPhase("feedback");
      setTotalXP((prev) => prev + data.xp_earned);
      showXPToast(data.xp_earned);

      if (data.is_correct) {
        setStreak((prev) => prev + 1);
        setCorrectCount((prev) => prev + 1);
      } else {
        setStreak(0);
      }

      if (data.justification_quality === "good") {
        setGoodJustCount((prev) => prev + 1);
      }

      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["daily-challenges"] });
      prefetch();
    },
  });

  const handleNext = () => {
    if (lightningMode && questionCount >= LIGHTNING_ROUND_COUNT) {
      setPhase("summary");
      return;
    }
    advanceToNext();
    prefetch();
  };

  const resetRound = () => {
    setTotalXP(0);
    setCorrectCount(0);
    setGoodJustCount(0);
    setStreak(0);
    setSelectedKey(null);
    setJustification("");
    setResult(null);
    setQuestionCount(0);
    advanceToNext();
  };

  const toggleLightning = () => {
    setLightningMode((prev) => !prev);
    resetRound();
  };

  const timerPct = timerOption > 0 ? (timeLeft / timerOption) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="text-cm-muted text-sm hover:text-cm-text transition-colors focus-ring flex items-center gap-1"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back
        </button>
        <div className="flex items-center gap-3" aria-live="polite">
          {/* Timer toggle */}
          <div className="flex items-center gap-1">
            <Timer size={12} className="text-cm-muted" />
            {([0, 30, 60] as TimerOption[]).map((opt) => (
              <button
                key={opt}
                onClick={() => setTimerOption(opt)}
                className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                  timerOption === opt
                    ? "bg-cm-primary/20 text-cm-primary font-semibold"
                    : "text-cm-muted hover:text-cm-text"
                }`}
              >
                {opt === 0 ? "Off" : `${opt}s`}
              </button>
            ))}
          </div>

          {/* Lightning round toggle */}
          <button
            onClick={toggleLightning}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
              lightningMode
                ? "bg-cm-amber/20 text-cm-amber font-semibold"
                : "text-cm-muted hover:text-cm-text"
            }`}
          >
            <Zap size={12} />
            {lightningMode ? `${questionCount}/${LIGHTNING_ROUND_COUNT}` : "Lightning"}
          </button>

          <StreakBadge count={streak} />
          <span className="text-cm-mint font-bold text-sm">+{totalXP} XP</span>
          <span className="text-cm-muted text-xs">Q{questionCount}</span>
        </div>
      </div>

      {/* Timer bar */}
      {timerOption > 0 && phase === "question" && (
        <div className="h-1 rounded-full bg-cm-primary/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{
              width: `${timerPct}%`,
              backgroundColor: timeLeft <= 5 ? "#EF4444" : timeLeft <= 10 ? "#F59E0B" : "#4D34EF",
            }}
          />
        </div>
      )}

      {phase === "summary" && (
        <QuickFireScoreCard
          correct={correctCount}
          total={LIGHTNING_ROUND_COUNT}
          totalXP={totalXP}
          goodJustifications={goodJustCount}
          onPlayAgain={resetRound}
          onExit={onExit}
        />
      )}

      {phase === "loading" && (
        <div role="status" aria-live="polite" className="text-center text-cm-primary animate-pulse py-12">
          Generating question...
        </div>
      )}

      {(phase === "question" || phase === "justify") && currentMCQ && (
        <>
          <MCQCard
            id={currentMCQ.id}
            category={currentMCQ.category}
            difficulty={currentMCQ.difficulty}
            content={currentMCQ.content}
            onSelect={handleSelect}
            disabled={phase === "justify" || submitMutation.isPending}
            selectedKey={selectedKey}
          />

          {requireJustification && phase === "justify" && (
            <div className="space-y-2">
              <label htmlFor="justification" className="text-cm-amber text-sm font-semibold">
                Why did you pick {selectedKey}?
              </label>
              <textarea
                id="justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value.slice(0, 200))}
                onPaste={(e) => {
                  e.preventDefault();
                  setPasteBlocked(true);
                  setTimeout(() => setPasteBlocked(false), 2500);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && justification.trim()) {
                    e.preventDefault();
                    submitMutation.mutate({
                      chosenKey: selectedKey!,
                      justificationText: justification.trim(),
                      pathMode: false,
                    });
                  }
                }}
                disabled={submitMutation.isPending}
                placeholder="Brief justification (1-2 sentences)..."
                maxLength={200}
                rows={2}
                className={`w-full bg-cm-bg border border-cm-border/10 rounded px-4 py-3 text-cm-text text-sm placeholder-cm-muted/50 focus:outline-none focus:border-cm-primary/50 resize-none transition-opacity ${submitMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              {pasteBlocked && (
                <div className="text-cm-red text-xs mt-1 animate-pulse">
                  Paste is disabled — please type your own reasoning.
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-cm-muted text-xs" aria-live="off">{justification.length}/200</span>
                <button
                  onClick={() =>
                    submitMutation.mutate({
                      chosenKey: selectedKey!,
                      justificationText: justification.trim(),
                      pathMode: false,
                    })
                  }
                  disabled={!justification.trim() || submitMutation.isPending}
                  className="px-4 py-2 rounded bg-cm-primary text-cm-bg text-sm font-bold hover:bg-cm-primary/90 transition-all disabled:opacity-40 focus-ring"
                >
                  {submitMutation.isPending ? "Grading..." : "Submit"}
                </button>
              </div>

              {submitMutation.isPending && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-cm-primary/5 border border-cm-primary/20 animate-pulse">
                  <div className="w-5 h-5 border-2 border-cm-primary/30 border-t-cm-primary rounded-full animate-spin" />
                  <span className="text-sm text-cm-primary">AI is reviewing your reasoning...</span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {phase === "feedback" && result && (
        <MCQFeedback
          isCorrect={result.is_correct}
          correctKey={result.correct_key}
          chosenKey={selectedKey!}
          explanation={result.explanation}
          justificationQuality={result.justification_quality}
          justificationNote={result.justification_note}
          xpEarned={result.xp_earned}
          xpBreakdown={result.xp_breakdown}
          levelProgress={result.level_progress}
          level={result.level}
          streakCount={streak}
          isDailyFirst={result.is_daily_first}
          onNext={handleNext}
        />
      )}
    </div>
  );
}
