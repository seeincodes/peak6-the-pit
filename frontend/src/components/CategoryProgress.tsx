import { useQuery } from "@tanstack/react-query";
import { categoryDisplay, categoryColors } from "../theme/colors";
import api from "../api/client";

interface CategoryStat {
  category: string;
  avg_score: number;
  attempts: number;
}

export default function CategoryProgress() {
  const { data: stats } = useQuery<CategoryStat[]>({
    queryKey: ["category-summary"],
    queryFn: async () => (await api.get("/performance/category-summary")).data,
    staleTime: 60_000,
  });

  if (!stats || stats.length === 0) return null;

  return (
    <div className="cm-surface p-4 mb-4">
      <h3 className="text-xs font-semibold text-cm-muted uppercase tracking-wider mb-3">
        Category Progress
      </h3>
      <div className="space-y-2">
        {stats.map((s) => {
          const color = categoryColors[s.category] || "#4D34EF";
          const pct = Math.min((s.avg_score / 5) * 100, 100);
          return (
            <div key={s.category} className="flex items-center gap-3">
              <span className="text-xs text-cm-text w-28 truncate">
                {categoryDisplay[s.category] || s.category.replace(/_/g, " ")}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-cm-primary/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <span className="text-xs text-cm-muted w-16 text-right">
                {s.avg_score}/5 ({s.attempts})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
