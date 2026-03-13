import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Activity,
  Award,
  Flame,
  TrendingUp,
  CheckCircle2,
  Map,
  Zap,
} from "lucide-react";
import { AVATAR_PRESETS } from "../constants/avatars";
import api from "../api/client";

interface FeedEvent {
  id: string;
  user_id: string;
  display_name: string;
  avatar_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
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

function EventIcon({ type }: { type: string }) {
  switch (type) {
    case "completed_scenario":
      return <CheckCircle2 size={16} className="text-cm-emerald" />;
    case "completed_mcq":
      return <Zap size={16} className="text-cm-amber" />;
    case "earned_badge":
      return <Award size={16} className="text-cm-amber" />;
    case "streak_milestone":
      return <Flame size={16} className="text-cm-amber" />;
    case "path_step_completed":
      return <Map size={16} className="text-cm-primary" />;
    case "path_completed":
      return <Map size={16} className="text-cm-emerald" />;
    case "level_up":
      return <TrendingUp size={16} className="text-cm-primary" />;
    default:
      return <Activity size={16} className="text-cm-muted" />;
  }
}

function eventText(event: FeedEvent): string {
  const p = event.payload;
  switch (event.event_type) {
    case "completed_scenario":
      return `completed a ${(p.category as string || "").replace(/_/g, " ")} scenario with score ${p.score}`;
    case "completed_mcq":
      return `${p.is_correct ? "aced" : "attempted"} a ${(p.category as string || "").replace(/_/g, " ")} quiz`;
    case "earned_badge":
      return `earned the "${p.name}" badge`;
    case "streak_milestone":
      return `hit a ${p.streak_days}-day streak!`;
    case "path_step_completed":
      return `completed step ${p.step_number} in ${p.path_name || "a learning path"}`;
    case "path_completed":
      return `completed the ${p.path_name || "learning"} path!`;
    case "level_up":
      return `leveled up to Lv${p.new_level} — ${p.level_title}`;
    default:
      return "did something awesome";
  }
}

function FeedItem({ event, index }: { event: FeedEvent; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-start gap-3 p-4 rounded-lg border border-cm-border bg-cm-card hover:bg-cm-card-raised transition-colors"
    >
      <Link
        to={`/profile/${event.user_id}`}
        className="w-9 h-9 rounded-full bg-cm-card-raised border border-cm-border flex items-center justify-center text-base shrink-0 hover:border-cm-primary transition-colors"
      >
        {AVATAR_PRESETS[event.avatar_id] || "👤"}
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={`/profile/${event.user_id}`}
            className="text-sm font-semibold text-cm-text hover:text-cm-primary transition-colors"
          >
            {event.display_name}
          </Link>
          <EventIcon type={event.event_type} />
          <span className="text-sm text-cm-muted">{eventText(event)}</span>
        </div>
        <span className="text-xs text-cm-muted mt-0.5 block">
          {relativeTime(event.created_at)}
        </span>
      </div>
    </motion.div>
  );
}

export default function FeedPage() {
  const { data: events, isLoading } = useQuery({
    queryKey: ["activity-feed"],
    queryFn: async () => {
      const res = await api.get("/activity/feed?limit=50");
      return res.data as FeedEvent[];
    },
    refetchInterval: 30_000,
  });

  return (
    <div className="cm-page max-w-2xl">
      <div className="flex items-center gap-3 mb-4">
        <Activity size={22} className="text-cm-primary" />
        <h2 className="cm-title">Activity Feed</h2>
      </div>

      {isLoading && (
        <div className="text-cm-primary animate-pulse text-center py-12 text-sm">
          Loading feed...
        </div>
      )}

      {events && events.length === 0 && (
        <div className="cm-surface p-8 text-center">
          <Activity size={32} className="text-cm-muted mx-auto mb-3" />
          <div className="text-cm-muted text-sm">
            No recent activity. Complete a scenario or quiz to get things started!
          </div>
        </div>
      )}

      {events && events.length > 0 && (
        <div className="space-y-2">
          {events.map((event, i) => (
            <FeedItem key={event.id} event={event} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
