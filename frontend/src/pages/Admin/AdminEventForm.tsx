import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "../../api/client";

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
  { value: "fundamentals", label: "Fundamentals" },
];

const DIFFICULTIES = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export function AdminEventForm() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxScenarios, setMaxScenarios] = useState<string>("");
  const [xpMultiplier, setXpMultiplier] = useState<string>("1.5");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (value: string) => {
    setSelectedCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  const toggleDifficulty = (value: string) => {
    setSelectedDifficulties((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    );
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const multiplier = parseFloat(xpMultiplier) || 1.5;

      // Build scenario_pool as cross-product of categories × difficulties
      const scenario_pool: { category: string; difficulty: string }[] = [];
      for (const category of selectedCategories) {
        for (const difficulty of selectedDifficulties) {
          scenario_pool.push({ category, difficulty });
        }
      }

      const payload = {
        title,
        description,
        theme,
        start_date: startDate,
        end_date: endDate,
        ...(maxScenarios ? { max_scenarios: parseInt(maxScenarios, 10) } : {}),
        scenario_pool,
        scoring_config: {
          xp_multiplier: multiplier,
          dimension_weights: {
            reasoning: 0.3,
            terminology: 0.2,
            trade_logic: 0.3,
            risk_awareness: 0.2,
          },
          completion_bonus: 50,
          perfect_score_bonus: 100,
        },
      };

      const res = await api.post("/events", payload);
      return res.data;
    },
    onSuccess: () => {
      navigate("/admin/dashboard");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to create event.";
      setError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Title is required.");
    if (!startDate || !endDate) return setError("Start and end dates are required.");
    if (selectedCategories.length === 0) return setError("Select at least one category.");
    if (selectedDifficulties.length === 0) return setError("Select at least one difficulty.");
    createMutation.mutate();
  };

  return (
    <div className="cm-page max-w-2xl">
      <h2 className="cm-title mb-6">Create Event</h2>

      <form onSubmit={handleSubmit} className="cm-surface rounded-lg p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="cm-label mb-1.5 block">Title</label>
          <input
            className="cm-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="cm-label mb-1.5 block">Description</label>
          <textarea
            className="cm-input min-h-[80px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the event"
          />
        </div>

        {/* Theme */}
        <div>
          <label className="cm-label mb-1.5 block">Theme</label>
          <input
            className="cm-input"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g. Volatility Week, Earnings Season"
          />
        </div>

        {/* Date range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="cm-label mb-1.5 block">Start Date</label>
            <input
              type="datetime-local"
              className="cm-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="cm-label mb-1.5 block">End Date</label>
            <input
              type="datetime-local"
              className="cm-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Max scenarios */}
        <div>
          <label className="cm-label mb-1.5 block">Max Scenarios (optional)</label>
          <input
            type="number"
            className="cm-input"
            value={maxScenarios}
            onChange={(e) => setMaxScenarios(e.target.value)}
            min={1}
            placeholder="Leave blank for unlimited"
          />
        </div>

        {/* XP Multiplier */}
        <div>
          <label className="cm-label mb-1.5 block">XP Multiplier</label>
          <input
            type="number"
            className="cm-input"
            value={xpMultiplier}
            onChange={(e) => setXpMultiplier(e.target.value)}
            min={0.1}
            step={0.1}
          />
        </div>

        {/* Categories */}
        <div>
          <label className="cm-label mb-2 block">Categories</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => toggleCategory(cat.value)}
                className={
                  selectedCategories.includes(cat.value)
                    ? "cm-tab-active text-xs"
                    : "cm-tab text-xs"
                }
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulties */}
        <div>
          <label className="cm-label mb-2 block">Difficulties</label>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff.value}
                type="button"
                onClick={() => toggleDifficulty(diff.value)}
                className={
                  selectedDifficulties.includes(diff.value)
                    ? "cm-tab-active text-xs"
                    : "cm-tab text-xs"
                }
              >
                {diff.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="cm-btn-primary"
          >
            {createMutation.isPending ? "Creating..." : "Create Event"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="cm-tab"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
