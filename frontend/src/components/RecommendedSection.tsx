import { useQuery } from "@tanstack/react-query";
import { Sparkles, Star } from "lucide-react";
import api from "../api/client";
import { categoryDisplay, categoryColors } from "../theme/colors";

interface Recommendation {
  category: string;
  difficulty: string;
  weakness_score: number;
  reason: string;
}

export default function RecommendedSection({
  onSelect,
}: {
  onSelect: (category: string, difficulty: string) => void;
}) {
  const { data: recs } = useQuery<Recommendation[]>({
    queryKey: ["recommendations"],
    queryFn: async () => (await api.get("/scenarios/recommended?limit=3")).data,
    staleTime: 60_000,
  });

  if (!recs || recs.length === 0) return null;

  return (
    <div className="cm-surface p-4">
      <h3 className="text-xs font-semibold text-cm-muted uppercase tracking-wider flex items-center gap-1.5 mb-3">
        <Sparkles size={12} className="text-cm-amber" />
        Recommended for You
      </h3>
      <div className="space-y-2">
        {recs.map((rec) => {
          const color = categoryColors[rec.category] || "#4D34EF";
          const diffLevel = rec.difficulty === "beginner" ? 1 : rec.difficulty === "intermediate" ? 2 : 3;
          return (
            <button
              key={`${rec.category}-${rec.difficulty}`}
              onClick={() => onSelect(rec.category, rec.difficulty)}
              className="cm-surface-interactive p-3 w-full text-left flex items-center justify-between"
              style={{ borderColor: `${color}40` }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="min-w-0">
                  <span className="text-cm-text font-semibold text-sm block">
                    {categoryDisplay[rec.category] || rec.category.replace(/_/g, " ")}
                  </span>
                  <span className="text-[11px] text-cm-muted">{rec.reason}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="capitalize text-cm-muted text-xs">{rec.difficulty}</span>
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
        })}
      </div>
    </div>
  );
}
