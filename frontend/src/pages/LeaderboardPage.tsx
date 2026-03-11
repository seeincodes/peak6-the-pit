import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Users, ChevronDown, ChevronRight } from "lucide-react";
import api from "../api/client";

type Tab = "all_time" | "weekly" | "teams";

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

interface TeamEntry {
  rank: number;
  cohort: string;
  team_xp: number;
  member_count: number;
  avg_xp: number;
  is_current_user_team: boolean;
  members: LeaderboardEntry[];
}

function IndividualEntry({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  return (
    <motion.div
      key={entry.user_id}
      role="listitem"
      aria-label={entry.is_current_user ? "Your ranking" : undefined}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
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
  );
}

function TeamCard({ team, index }: { team: TeamEntry; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`rounded-md border overflow-hidden transition-all ${
        team.is_current_user_team
          ? "border-cm-primary/50 bg-cm-primary/5"
          : "border-cm-border bg-cm-card/50"
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-cm-card-raised/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className={`w-8 text-center font-bold flex items-center justify-center ${
            team.rank === 1 ? "text-cm-amber text-lg" :
            team.rank === 2 ? "text-cm-muted text-lg" :
            team.rank === 3 ? "text-cm-amber/60 text-lg" :
            "text-cm-muted text-sm"
          }`}>
            {team.rank <= 3 ? (
              <Trophy
                size={18}
                className={
                  team.rank === 1 ? "text-cm-amber" :
                  team.rank === 2 ? "text-cm-muted" :
                  "text-cm-amber/60"
                }
              />
            ) : (
              <span>#{team.rank}</span>
            )}
          </span>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cm-emerald to-cm-primary flex items-center justify-center">
            <Users size={14} className="text-white" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-cm-text">
              {team.cohort}
              {team.is_current_user_team && <span className="text-cm-primary text-xs ml-2">(your team)</span>}
            </div>
            <div className="text-xs text-cm-muted">
              {team.member_count} member{team.member_count !== 1 ? "s" : ""} &middot; Avg {team.avg_xp.toLocaleString()} XP
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-cm-lime font-bold text-sm">
            {team.team_xp.toLocaleString()} XP
          </span>
          {expanded ? <ChevronDown size={16} className="text-cm-muted" /> : <ChevronRight size={16} className="text-cm-muted" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-cm-border px-4 py-2 space-y-1">
              {team.members.map((m) => (
                <div
                  key={m.user_id}
                  className={`flex items-center justify-between py-1.5 px-2 rounded text-sm ${
                    m.is_current_user ? "bg-cm-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cm-primary to-cm-emerald flex items-center justify-center text-white font-bold text-xs">
                      {m.display_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-cm-text text-sm">
                      {m.display_name}
                      {m.is_current_user && <span className="text-cm-primary text-xs ml-1">(you)</span>}
                    </span>
                    <span className="text-cm-muted text-xs">Lv{m.level}</span>
                  </div>
                  <span className="text-cm-lime text-xs font-medium">
                    {m.xp.toLocaleString()} XP
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("all_time");

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", tab],
    queryFn: async () => {
      const period = tab === "teams" ? "all_time" : tab;
      const res = await api.get(`/leaderboard?period=${period}`);
      return res.data as { period: string; entries: LeaderboardEntry[] };
    },
    enabled: tab !== "teams",
  });

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ["leaderboard-teams"],
    queryFn: async () => {
      const res = await api.get("/leaderboard/teams");
      return res.data as { entries: TeamEntry[] };
    },
    enabled: tab === "teams",
  });

  const loading = tab === "teams" ? teamsLoading : isLoading;

  return (
    <div className="cm-page max-w-2xl">
      <h2 className="cm-title mb-4">Leaderboard</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6" role="tablist">
        {(["all_time", "weekly", "teams"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={tab === t ? "cm-tab-active" : "cm-tab"}
          >
            {t === "all_time" ? "All-Time" : t === "weekly" ? "This Week" : "Teams"}
          </button>
        ))}
      </div>

      {loading && (
        <div role="status" aria-live="polite" className="text-cm-primary animate-pulse text-center py-12">Loading...</div>
      )}

      {/* Individual leaderboard */}
      {tab !== "teams" && data && (
        <div className="space-y-2" role="list">
          {data.entries.map((entry, i) => (
            <IndividualEntry key={entry.user_id} entry={entry} index={i} />
          ))}
          {data.entries.length === 0 && (
            <div className="text-center text-cm-muted py-8">
              No activity yet{tab === "weekly" ? " this week" : ""}.
            </div>
          )}
        </div>
      )}

      {/* Teams leaderboard */}
      {tab === "teams" && teamsData && (
        <div className="space-y-2" role="list">
          {teamsData.entries.map((team, i) => (
            <TeamCard key={team.cohort} team={team} index={i} />
          ))}
          {teamsData.entries.length === 0 && (
            <div className="text-center text-cm-muted py-8">
              No teams yet. Assign cohorts to users to see team rankings.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
