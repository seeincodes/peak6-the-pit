import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  Flame,
  Map,
  Activity,
  CheckCircle2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { AVATAR_PRESETS } from "../constants/avatars";
import api from "../api/client";

interface ProfileData {
  id: string;
  display_name: string;
  avatar_id: string;
  bio: string | null;
  level: number;
  level_title: string;
  xp_total: number;
  streak_days: number;
  cohort: string | null;
  badges: {
    slug: string;
    name: string;
    description: string;
    icon: string;
    awarded_at: string;
  }[];
  stats: {
    total_scenarios: number;
    avg_score: number | null;
    paths_completed: number;
  };
  recent_activity: {
    event_type: string;
    payload: Record<string, unknown>;
    created_at: string;
  }[];
  is_self: boolean;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function activityLabel(type: string, payload: Record<string, unknown>): string {
  switch (type) {
    case "completed_scenario":
      return `Completed ${(payload.category as string || "").replace(/_/g, " ")} scenario`;
    case "completed_mcq":
      return `${payload.is_correct ? "Aced" : "Attempted"} ${(payload.category as string || "").replace(/_/g, " ")} quiz`;
    case "earned_badge":
      return `Earned "${payload.name}" badge`;
    case "streak_milestone":
      return `${payload.streak_days}-day streak!`;
    case "path_step_completed":
      return `Completed path step`;
    case "path_completed":
      return `Completed ${payload.path_name || "a"} path`;
    case "level_up":
      return `Leveled up to Lv${payload.new_level}`;
    default:
      return type.replace(/_/g, " ");
  }
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case "completed_scenario":
      return <CheckCircle2 size={14} className="text-cm-emerald" />;
    case "completed_mcq":
      return <Zap size={14} className="text-cm-amber" />;
    case "earned_badge":
      return <Award size={14} className="text-cm-amber" />;
    case "streak_milestone":
      return <Flame size={14} className="text-cm-amber" />;
    case "path_step_completed":
    case "path_completed":
      return <Map size={14} className="text-cm-primary" />;
    case "level_up":
      return <TrendingUp size={14} className="text-cm-primary" />;
    default:
      return <Activity size={14} className="text-cm-muted" />;
  }
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      const res = await api.get(`/users/${userId}/profile`);
      return res.data as ProfileData;
    },
    enabled: !!userId,
  });

  if (isLoading || !profile) {
    return (
      <div className="cm-page max-w-2xl">
        <div className="text-cm-primary animate-pulse text-center py-12 text-sm">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="cm-page max-w-2xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <Link
          to="/leaderboard"
          className="flex items-center gap-1 text-cm-muted hover:text-cm-text text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </Link>

        {/* Profile header */}
        <div className="cm-surface p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-cm-card-raised border-2 border-cm-border flex items-center justify-center text-2xl">
              {AVATAR_PRESETS[profile.avatar_id] || "👤"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-cm-text">{profile.display_name}</h2>
                {profile.is_self && (
                  <Link to="/profile" className="text-xs text-cm-primary hover:underline">
                    Edit
                  </Link>
                )}
              </div>
              <div className="text-sm text-cm-muted">
                Lv{profile.level} {profile.level_title}
              </div>
              {profile.bio && (
                <p className="text-xs text-cm-muted mt-1">{profile.bio}</p>
              )}
              {profile.cohort && (
                <span className="text-xs text-cm-primary/80 mt-1 block">
                  Cohort: {profile.cohort}
                </span>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-cm-border">
            <div className="text-center">
              <div className="text-lg font-bold text-cm-text">{profile.xp_total.toLocaleString()}</div>
              <div className="text-xs text-cm-muted">XP</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-cm-text flex items-center justify-center gap-1">
                {profile.streak_days > 0 && <Flame size={14} className="text-cm-amber" />}
                {profile.streak_days}
              </div>
              <div className="text-xs text-cm-muted">Streak</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-cm-text">{profile.stats.total_scenarios}</div>
              <div className="text-xs text-cm-muted">Scenarios</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-cm-text">
                {profile.stats.avg_score ? profile.stats.avg_score.toFixed(1) : "—"}
              </div>
              <div className="text-xs text-cm-muted">Avg Score</div>
            </div>
          </div>
        </div>

        {/* Badges */}
        {profile.badges.length > 0 && (
          <div className="cm-surface p-5">
            <h3 className="text-sm font-bold text-cm-text mb-3 flex items-center gap-2">
              <Award size={16} className="text-cm-amber" /> Badges
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {profile.badges.map((badge) => (
                <div
                  key={badge.slug}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg bg-cm-card-raised/50 border border-cm-border"
                  title={badge.description}
                >
                  <span className="text-xl">{badge.icon}</span>
                  <span className="text-xs text-cm-text text-center font-medium leading-tight">
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lessons completed */}
        {profile.stats.paths_completed > 0 && (
          <div className="cm-surface p-4 flex items-center gap-3">
            <Map size={18} className="text-cm-emerald" />
            <span className="text-sm text-cm-text">
              <strong>{profile.stats.paths_completed}</strong> lesson{profile.stats.paths_completed > 1 ? "s" : ""} completed
            </span>
          </div>
        )}

        {/* Recent activity */}
        {profile.recent_activity.length > 0 && (
          <div className="cm-surface p-5">
            <h3 className="text-sm font-bold text-cm-text mb-3 flex items-center gap-2">
              <Activity size={16} className="text-cm-primary" /> Recent Activity
            </h3>
            <div className="space-y-2">
              {profile.recent_activity.map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <ActivityIcon type={a.event_type} />
                  <span className="text-cm-text flex-1">
                    {activityLabel(a.event_type, a.payload)}
                  </span>
                  <span className="text-xs text-cm-muted/60 shrink-0">
                    {relativeTime(a.created_at)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
