import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import api from "../api/client";

type Period = "all_time" | "weekly";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  xp: number;
  level: number;
  level_title: string;
  streak_days: number;
  is_current_user: boolean;
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("all_time");

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", period],
    queryFn: async () => {
      const res = await api.get(`/leaderboard?period=${period}`);
      return res.data as { period: string; entries: LeaderboardEntry[] };
    },
  });

  return (
    <div className="cm-page max-w-2xl">
      <h2 className="cm-title mb-4">Leaderboard</h2>

      {/* Period tabs */}
      <div className="flex gap-2 mb-6" role="tablist">
        {(["all_time", "weekly"] as Period[]).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={period === p}
            onClick={() => setPeriod(p)}
            className={period === p ? "cm-tab-active" : "cm-tab"}
          >
            {p === "all_time" ? "All-Time" : "This Week"}
          </button>
        ))}
      </div>

      {isLoading && (
        <div role="status" aria-live="polite" className="text-cm-primary animate-pulse text-center py-12">Loading...</div>
      )}

      {data && (
        <div className="space-y-2" role="list">
          {data.entries.map((entry, i) => (
            <motion.div
              key={entry.user_id}
              role="listitem"
              aria-label={entry.is_current_user ? "Your ranking" : undefined}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center justify-between p-4 rounded-md border transition-all ${
                entry.is_current_user
                  ? "border-cm-primary/50 bg-cm-primary/5"
                  : "border-cm-border bg-cm-card/50"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-8 text-center font-bold flex items-center justify-center ${
                  entry.rank === 1 ? "text-cm-amber text-lg" :
                  entry.rank === 2 ? "text-cm-muted text-lg" :
                  entry.rank === 3 ? "text-cm-amber/60 text-lg" :
                  "text-cm-muted text-sm"
                }`}>
                  {entry.rank <= 3 ? (
                    <Trophy
                      size={18}
                      className={
                        entry.rank === 1 ? "text-cm-amber" :
                        entry.rank === 2 ? "text-cm-muted" :
                        "text-cm-amber/60"
                      }
                      aria-label={`Rank ${entry.rank}`}
                    />
                  ) : (
                    <span aria-label={`Rank ${entry.rank}`}>#{entry.rank}</span>
                  )}
                </span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cm-primary to-cm-emerald flex items-center justify-center text-white font-bold text-sm">
                  {entry.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-cm-text">
                    {entry.display_name}
                    {entry.is_current_user && <span className="text-cm-primary text-xs ml-2">(you)</span>}
                  </div>
                  <div className="text-xs text-cm-muted">
                    Lv{entry.level} {entry.level_title}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {entry.streak_days > 0 && (
                  <span className="text-cm-amber text-xs">{entry.streak_days}d</span>
                )}
                <span className="text-cm-lime font-bold text-sm">
                  {entry.xp.toLocaleString()} XP
                </span>
              </div>
            </motion.div>
          ))}

          {data.entries.length === 0 && (
            <div className="text-center text-cm-muted py-8">
              No activity yet{period === "weekly" ? " this week" : ""}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
