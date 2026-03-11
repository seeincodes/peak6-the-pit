import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bookmark, Trash2, Star } from "lucide-react";
import { categoryDisplay, categoryColors } from "../theme/colors";
import api from "../api/client";

interface BookmarkItem {
  scenario_id: string;
  category: string;
  difficulty: string;
  title: string;
  tag: string;
  created_at: string;
}

export default function BookmarksPage() {
  const queryClient = useQueryClient();

  const { data: bookmarks, isLoading } = useQuery<BookmarkItem[]>({
    queryKey: ["bookmarks"],
    queryFn: async () => (await api.get("/bookmarks")).data,
  });

  const removeMutation = useMutation({
    mutationFn: async (scenarioId: string) => {
      await api.delete(`/bookmarks/${scenarioId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  return (
    <div className="cm-page max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Bookmark size={20} className="text-cm-amber" />
        <h2 className="cm-title">Bookmarked Scenarios</h2>
      </div>

      {isLoading && (
        <div className="text-center text-cm-primary animate-pulse py-12">Loading bookmarks...</div>
      )}

      {bookmarks && bookmarks.length === 0 && (
        <div className="cm-surface p-8 text-center text-cm-muted">
          No bookmarks yet. Bookmark scenarios from the grade screen to save them here.
        </div>
      )}

      <div className="space-y-2">
        {bookmarks?.map((b, i) => {
          const color = categoryColors[b.category] || "#4D34EF";
          const diffLevel = b.difficulty === "beginner" ? 1 : b.difficulty === "intermediate" ? 2 : 3;

          return (
            <motion.div
              key={b.scenario_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="cm-surface p-4 flex items-center gap-3"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-cm-text font-medium truncate">{b.title}</p>
                <p className="text-xs text-cm-muted">
                  {categoryDisplay[b.category] || b.category} &middot;{" "}
                  <span className="capitalize">{b.tag}</span> &middot;{" "}
                  {new Date(b.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className="flex items-center gap-0.5">
                {[1, 2, 3].map((j) => (
                  <Star
                    key={j}
                    size={10}
                    className={j <= diffLevel ? "text-cm-amber fill-cm-amber" : "text-cm-amber/30"}
                  />
                ))}
              </span>
              <button
                onClick={() => removeMutation.mutate(b.scenario_id)}
                className="text-cm-muted hover:text-cm-red transition-colors p-1"
                title="Remove bookmark"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
