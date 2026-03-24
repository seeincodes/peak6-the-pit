import { motion } from "framer-motion";
import { AVATAR_PRESETS } from "../constants/avatars";

interface EventLeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  score: number;
  scenarios_completed: number;
  level: number;
  avatar_id?: string;
}

interface EventLeaderboardProps {
  entries: EventLeaderboardEntry[];
  currentUserId?: string;
}

function rankIcon(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export default function EventLeaderboard({ entries, currentUserId }: EventLeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="text-cm-muted text-center py-6 text-sm">
        No participants yet.
      </div>
    );
  }

  return (
    <div className="space-y-2" role="list">
      {entries.map((entry, i) => {
        const isCurrentUser = entry.user_id === currentUserId;
        const avatar = AVATAR_PRESETS[entry.avatar_id || "default"] || "👤";
        return (
          <motion.div
            key={entry.user_id}
            role="listitem"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
              isCurrentUser
                ? "bg-cm-primary/10 border border-cm-primary/30"
                : "bg-cm-card/50 border-cm-border"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-8 text-center font-bold text-sm ${
                  entry.rank <= 3 ? "text-lg" : "text-cm-muted"
                }`}
                aria-label={`Rank ${entry.rank}`}
              >
                {rankIcon(entry.rank)}
              </span>
              <div className="w-8 h-8 rounded-full bg-cm-card-raised border border-cm-border flex items-center justify-center text-base">
                {avatar}
              </div>
              <div>
                <div className="text-sm font-semibold text-cm-text">
                  {entry.display_name}
                  {isCurrentUser && (
                    <span className="text-cm-primary text-xs ml-2">(you)</span>
                  )}
                </div>
                <div className="text-xs text-cm-muted">
                  Lv{entry.level} &middot; {entry.scenarios_completed} scenario{entry.scenarios_completed !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <span className="text-cm-primary font-bold text-sm">
              {entry.score.toLocaleString()} pts
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
