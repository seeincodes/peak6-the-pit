import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, Plus, Target } from "lucide-react";
import { AVATAR_PRESETS } from "../constants/avatars";
import api from "../api/client";

interface Mentorship {
  id: string;
  mentor_id: string;
  mentee_id: string;
  mentor_name: string;
  mentee_name: string;
  status: "pending" | "active" | "declined";
  role: "mentor" | "mentee";
  started_at?: string;
}

interface Goal {
  id: string;
  category: string;
  target_mastery: number;
  current_mastery?: number;
}

const CATEGORIES = [
  { value: "iv_analysis", label: "IV Analysis" },
  { value: "greeks", label: "Greeks" },
  { value: "order_flow", label: "Order Flow" },
  { value: "macro", label: "Macro" },
  { value: "term_structure", label: "Term Structure" },
  { value: "skew", label: "IV Skew" },
  { value: "position_sizing", label: "Position Sizing" },
  { value: "trade_structuring", label: "Trade Structuring" },
  { value: "risk_management", label: "Risk Management" },
];

function MenteeCard({ mentorship }: { mentorship: Mentorship }) {
  const queryClient = useQueryClient();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalCategory, setGoalCategory] = useState("");
  const [goalTargetMastery, setGoalTargetMastery] = useState(50);

  const { data: goals, isLoading: loadingGoals } = useQuery({
    queryKey: ["mentorship-goals", mentorship.id],
    queryFn: async () => {
      const res = await api.get(`/mentorships/${mentorship.id}/goals`);
      return res.data as Goal[];
    },
  });

  const nudgeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/mentorships/${mentorship.id}/nudge`);
      return res.data;
    },
  });

  const addGoalMutation = useMutation({
    mutationFn: async ({
      category,
      target_mastery,
    }: {
      category: string;
      target_mastery: number;
    }) => {
      const res = await api.post(`/mentorships/${mentorship.id}/goals`, {
        category,
        target_mastery,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mentorship-goals", mentorship.id],
      });
      setShowGoalForm(false);
      setGoalCategory("");
      setGoalTargetMastery(50);
    },
  });

  const handleAddGoal = () => {
    if (!goalCategory) return;
    addGoalMutation.mutate({
      category: goalCategory,
      target_mastery: goalTargetMastery,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="cm-surface rounded-lg p-5 space-y-4"
    >
      {/* Mentee header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cm-card-raised border border-cm-border flex items-center justify-center text-xl shrink-0">
            {AVATAR_PRESETS["default"]}
          </div>
          <div>
            <p className="text-sm font-semibold text-cm-text">
              {mentorship.mentee_name}
            </p>
            <p className="text-xs text-cm-muted">
              {mentorship.started_at
                ? `Since ${new Date(mentorship.started_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
                : "Active mentee"}
            </p>
          </div>
        </div>
        <button
          onClick={() => nudgeMutation.mutate()}
          disabled={nudgeMutation.isPending || nudgeMutation.isSuccess}
          className="flex items-center gap-1.5 cm-btn text-xs px-3 py-1.5 text-cm-muted hover:text-cm-text"
          title="Send a nudge to your mentee"
        >
          <Bell size={14} />
          {nudgeMutation.isSuccess ? "Nudged!" : "Nudge"}
        </button>
      </div>

      {/* Goals */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-cm-muted uppercase tracking-widest">
            Goals
          </p>
          <button
            onClick={() => setShowGoalForm((v) => !v)}
            className="flex items-center gap-1 text-xs text-cm-primary hover:text-cm-primary/80 transition-colors"
          >
            <Plus size={14} />
            Add Goal
          </button>
        </div>

        {loadingGoals && (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse h-3 bg-cm-border rounded w-2/3"
              />
            ))}
          </div>
        )}

        {!loadingGoals && (!goals || goals.length === 0) && (
          <p className="text-xs text-cm-muted/60 italic">
            No goals set yet. Add one below.
          </p>
        )}

        {!loadingGoals && goals && goals.length > 0 && (
          <div className="space-y-2">
            {goals.map((goal) => {
              const pct = Math.min(
                ((goal.current_mastery || 0) / goal.target_mastery) * 100,
                100
              );
              const categoryLabel =
                CATEGORIES.find((c) => c.value === goal.category)?.label ||
                goal.category;
              return (
                <div key={goal.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-cm-text">
                      <Target size={12} className="text-cm-primary" />
                      {categoryLabel}
                    </span>
                    <span className="text-cm-muted">
                      {goal.current_mastery || 0}/{goal.target_mastery}%
                    </span>
                  </div>
                  <div className="relative w-full h-1.5 bg-cm-bg rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-cm-primary to-cm-emerald rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add goal form */}
        {showGoalForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-cm-border space-y-3"
          >
            <div>
              <label className="cm-label mb-1.5 block text-xs">Category</label>
              <select
                className="cm-input text-sm"
                value={goalCategory}
                onChange={(e) => setGoalCategory(e.target.value)}
              >
                <option value="">Select a category...</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="cm-label mb-1.5 block text-xs">
                Target Mastery: {goalTargetMastery}%
              </label>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={goalTargetMastery}
                onChange={(e) => setGoalTargetMastery(Number(e.target.value))}
                className="w-full accent-cm-primary"
              />
              <div className="flex justify-between text-[10px] text-cm-muted mt-0.5">
                <span>10%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddGoal}
                disabled={!goalCategory || addGoalMutation.isPending}
                className="cm-btn-primary text-xs px-4 py-1.5 flex-1"
              >
                {addGoalMutation.isPending ? "Adding..." : "Add Goal"}
              </button>
              <button
                onClick={() => setShowGoalForm(false)}
                className="cm-btn text-xs px-4 py-1.5 text-cm-muted hover:text-cm-text"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function MentorDashboardPage() {
  const { data: mentorships, isLoading } = useQuery({
    queryKey: ["mentorships"],
    queryFn: async () => {
      const res = await api.get("/mentorships");
      return res.data as Mentorship[];
    },
  });

  const activeMentees =
    mentorships?.filter(
      (m) => m.role === "mentor" && m.status === "active"
    ) ?? [];

  return (
    <div className="cm-page max-w-3xl">
      <h2 className="cm-title mb-2">Mentor Dashboard</h2>
      <p className="text-sm text-cm-muted mb-6">
        Track your mentees' progress and keep them on track.
      </p>

      {isLoading && (
        <div role="status" aria-live="polite" className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse cm-surface rounded-lg p-5 space-y-3"
            >
              <div className="h-4 bg-cm-border rounded w-1/3" />
              <div className="h-3 bg-cm-border rounded w-1/2" />
              <div className="h-3 bg-cm-border rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && activeMentees.length === 0 && (
        <div className="text-cm-muted text-center py-12 cm-surface rounded-lg">
          You have no active mentees yet.
        </div>
      )}

      {!isLoading && activeMentees.length > 0 && (
        <div className="space-y-4">
          {activeMentees.map((m) => (
            <MenteeCard key={m.id} mentorship={m} />
          ))}
        </div>
      )}
    </div>
  );
}
