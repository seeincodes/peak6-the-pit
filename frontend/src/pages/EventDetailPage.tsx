import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Trophy, Zap } from "lucide-react";
import api from "../api/client";
import EventLeaderboard from "../components/EventLeaderboard";

interface MarketEvent {
  id: string;
  title: string;
  description: string;
  theme: string;
  status: "active" | "upcoming" | "completed";
  start_date: string;
  end_date: string;
  max_scenarios?: number;
  is_joined?: boolean;
  scoring_config?: {
    xp_multiplier?: number;
  };
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  score: number;
  scenarios_completed: number;
  level: number;
  avatar_id?: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusColor(status: string): string {
  if (status === "active") return "bg-cm-emerald/20 text-cm-emerald";
  if (status === "upcoming") return "bg-cm-primary/20 text-cm-primary";
  return "bg-cm-muted/20 text-cm-muted";
}

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const res = await api.get(`/events/${eventId}`);
      return res.data as MarketEvent;
    },
    enabled: !!eventId,
  });

  const { data: leaderboard, isLoading: lbLoading } = useQuery({
    queryKey: ["event-leaderboard", eventId],
    queryFn: async () => {
      const res = await api.get(`/events/${eventId}/leaderboard`);
      return res.data as { entries: LeaderboardEntry[]; current_user_id?: string };
    },
    enabled: !!eventId,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/events/${eventId}/join`, {});
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-leaderboard", eventId] });
    },
  });

  if (eventLoading) {
    return (
      <div className="cm-page max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-cm-border rounded w-1/2" />
          <div className="h-4 bg-cm-border rounded w-3/4" />
          <div className="h-4 bg-cm-border rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="cm-page max-w-2xl">
        <p className="text-cm-muted">Event not found.</p>
      </div>
    );
  }

  const canJoin = event.status === "active" && !event.is_joined;

  return (
    <div className="cm-page max-w-2xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="cm-surface rounded-lg p-6 space-y-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="cm-title">{event.title}</h2>
            <p className="text-sm text-cm-muted mt-1">{event.description}</p>
          </div>
          <span className={`cm-chip shrink-0 ${statusColor(event.status)}`}>
            {event.status}
          </span>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-3 text-xs text-cm-muted">
          <span className="cm-chip bg-cm-primary/10 text-cm-primary">{event.theme}</span>
          <span className="flex items-center gap-1">
            <Calendar size={13} />
            {formatDate(event.start_date)} – {formatDate(event.end_date)}
          </span>
          {event.max_scenarios && (
            <span className="flex items-center gap-1">
              <Trophy size={13} />
              Up to {event.max_scenarios} scenarios
            </span>
          )}
          {event.scoring_config?.xp_multiplier && (
            <span className="flex items-center gap-1 text-cm-amber font-semibold">
              <Zap size={13} />
              {event.scoring_config.xp_multiplier}× XP
            </span>
          )}
        </div>

        {/* Join button */}
        {canJoin && (
          <button
            onClick={() => joinMutation.mutate()}
            disabled={joinMutation.isPending}
            className="cm-btn-primary"
          >
            {joinMutation.isPending ? "Joining..." : "Join Event"}
          </button>
        )}
        {event.is_joined && event.status === "active" && (
          <span className="text-cm-emerald text-sm font-medium">You have joined this event.</span>
        )}
      </motion.div>

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="cm-surface rounded-lg p-5"
      >
        <h3 className="cm-subtitle mb-4">Leaderboard</h3>
        {lbLoading ? (
          <div role="status" aria-live="polite" className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-cm-primary/30 border-t-cm-primary rounded-full animate-spin" />
          </div>
        ) : (
          <EventLeaderboard
            entries={leaderboard?.entries ?? []}
            currentUserId={leaderboard?.current_user_id}
          />
        )}
      </motion.div>
    </div>
  );
}
