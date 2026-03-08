import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import MCQCard from "../components/MCQCard";
import MCQFeedback from "../components/MCQFeedback";
import StreakBadge from "../components/StreakBadge";
import api from "../api/client";

interface MCQData {
  id: string;
  category: string;
  difficulty: string;
  content: {
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
  xp_total: number;
  level: number;
}

type Phase = "loading" | "question" | "justify" | "feedback";

export default function QuickFirePage({
  category,
  difficulty,
  onExit,
}: {
  category: string;
  difficulty: string;
  onExit: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [currentMCQ, setCurrentMCQ] = useState<MCQData | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [justification, setJustification] = useState("");
  const [result, setResult] = useState<MCQResult | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);

  const prefetchQueue = useRef<MCQData[]>([]);
  const queryClient = useQueryClient();

  // Fetch a single MCQ
  const fetchMCQ = useCallback(async (): Promise<MCQData> => {
    const res = await api.post("/mcq/generate", { category, difficulty });
    return res.data;
  }, [category, difficulty]);

  // Prefetch next questions in background
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

  // Load first question + start prefetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const first = await fetchMCQ();
      if (!cancelled) {
        setCurrentMCQ(first);
        setPhase("question");
        setQuestionCount(1);
      }
      // Start prefetching
      prefetch();
    })();
    return () => { cancelled = true; };
  }, [fetchMCQ, prefetch]);

  const handleSelect = (key: string) => {
    setSelectedKey(key);
    setPhase("justify");
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/mcq/submit", {
        scenario_id: currentMCQ!.id,
        chosen_key: selectedKey!,
        justification,
        streak_count: streak,
      });
      return res.data as MCQResult;
    },
    onSuccess: (data) => {
      setResult(data);
      setPhase("feedback");
      setTotalXP((prev) => prev + data.xp_earned);

      if (data.is_correct) {
        setStreak((prev) => prev + 1);
      } else {
        setStreak(0);
      }

      queryClient.invalidateQueries({ queryKey: ["user"] });

      // Trigger more prefetch
      prefetch();
    },
  });

  const handleNext = () => {
    // Pull from prefetch queue or fetch fresh
    const next = prefetchQueue.current.shift();
    if (next) {
      setCurrentMCQ(next);
      setPhase("question");
    } else {
      setPhase("loading");
      fetchMCQ().then((mcq) => {
        setCurrentMCQ(mcq);
        setPhase("question");
      });
    }
    setSelectedKey(null);
    setJustification("");
    setResult(null);
    setQuestionCount((prev) => prev + 1);

    // Keep prefetching
    prefetch();
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="text-cm-muted text-sm hover:text-cm-text transition-colors"
        >
          &larr; Back
        </button>
        <div className="flex items-center gap-4">
          <StreakBadge count={streak} />
          <span className="text-cm-emerald font-bold text-sm">+{totalXP} XP</span>
          <span className="text-cm-muted text-xs">Q{questionCount}</span>
        </div>
      </div>

      {phase === "loading" && (
        <div className="text-center text-cm-cyan animate-pulse py-12">
          Generating question...
        </div>
      )}

      {(phase === "question" || phase === "justify") && currentMCQ && (
        <>
          <MCQCard
            category={currentMCQ.category}
            difficulty={currentMCQ.difficulty}
            content={currentMCQ.content}
            onSelect={handleSelect}
            disabled={phase === "justify"}
            selectedKey={selectedKey}
          />

          {phase === "justify" && (
            <div className="space-y-2">
              <label className="text-cm-amber text-sm font-semibold">
                Why did you pick {selectedKey}?
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value.slice(0, 200))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && justification.trim()) {
                    e.preventDefault();
                    submitMutation.mutate();
                  }
                }}
                placeholder="Brief justification (1-2 sentences)..."
                maxLength={200}
                rows={2}
                className="w-full bg-cm-bg border border-cm-border rounded-lg px-4 py-3 text-cm-text text-sm placeholder-cm-muted/50 focus:outline-none focus:border-cm-cyan/50 resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-cm-muted text-xs">{justification.length}/200</span>
                <button
                  onClick={() => submitMutation.mutate()}
                  disabled={!justification.trim() || submitMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-cm-cyan/20 border border-cm-cyan/50 text-cm-cyan text-sm font-bold hover:bg-cm-cyan/30 transition-all disabled:opacity-40"
                >
                  {submitMutation.isPending ? "Grading..." : "Submit"}
                </button>
              </div>
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
          onNext={handleNext}
        />
      )}
    </div>
  );
}
