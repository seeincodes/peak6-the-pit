import { useQuery } from "@tanstack/react-query";
import { ArrowUp, ArrowDown, X } from "lucide-react";
import { useState } from "react";
import api from "../api/client";
import { categoryDisplay } from "../theme/colors";

interface Suggestion {
  category: string;
  current_difficulty: string;
  suggested_difficulty: string;
  direction: "promote" | "demote";
  reason: string;
}

export default function DifficultySuggestion({
  onAccept,
}: {
  onAccept: (category: string, difficulty: string) => void;
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { data: suggestions } = useQuery<Suggestion[]>({
    queryKey: ["difficulty-suggestions"],
    queryFn: async () => (await api.get("/scenarios/difficulty-suggestions")).data,
    staleTime: 120_000,
  });

  if (!suggestions || suggestions.length === 0) return null;

  const visible = suggestions.filter(
    (s) => !dismissed.has(`${s.category}-${s.current_difficulty}`)
  );
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((s) => {
        const key = `${s.category}-${s.current_difficulty}`;
        const isPromote = s.direction === "promote";
        const name = categoryDisplay[s.category] || s.category.replace(/_/g, " ");
        return (
          <div
            key={key}
            className={`flex items-center gap-3 p-3 rounded-md border text-sm ${
              isPromote
                ? "border-cm-emerald/30 bg-cm-emerald/5"
                : "border-cm-amber/30 bg-cm-amber/5"
            }`}
          >
            {isPromote ? (
              <ArrowUp size={16} className="text-cm-emerald flex-shrink-0" />
            ) : (
              <ArrowDown size={16} className="text-cm-amber flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-cm-text font-medium">{name}</span>
              <span className="text-cm-muted">
                {" "}&mdash; try{" "}
                <span className="capitalize font-medium">
                  {s.suggested_difficulty}
                </span>
              </span>
              <p className="text-[11px] text-cm-muted mt-0.5">{s.reason}</p>
            </div>
            <button
              onClick={() => onAccept(s.category, s.suggested_difficulty)}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex-shrink-0 ${
                isPromote
                  ? "bg-cm-emerald/15 text-cm-emerald hover:bg-cm-emerald/25"
                  : "bg-cm-amber/15 text-cm-amber hover:bg-cm-amber/25"
              }`}
            >
              Go
            </button>
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(key))}
              className="text-cm-muted hover:text-cm-text transition-colors p-0.5 flex-shrink-0"
              aria-label="Dismiss suggestion"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
