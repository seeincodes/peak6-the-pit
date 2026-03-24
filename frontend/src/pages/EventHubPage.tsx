import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Calendar, Clock } from "lucide-react";
import api from "../api/client";
import { categoryShortDisplay } from "../theme/colors";

type EventStatus = "active" | "upcoming" | "completed";

interface MarketEvent {
  id: string;
  title: string;
  description: string;
  theme: string;
  status: EventStatus;
  start_at: string;
  end_at: string;
}

function timeRemaining(endDate: string): string {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h remaining`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m remaining`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusColor(status: EventStatus): string {
  if (status === "active") return "bg-cm-emerald/20 text-cm-emerald";
  if (status === "upcoming") return "bg-cm-primary/20 text-cm-primary";
  return "bg-cm-muted/20 text-cm-muted";
}

export default function EventHubPage() {
  const [tab, setTab] = useState<"active" | "past">("active");

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await api.get("/events");
      return res.data as MarketEvent[];
    },
  });

  const activeEvents = events?.filter((e) => e.status === "active" || e.status === "upcoming") ?? [];
  const pastEvents = events?.filter((e) => e.status === "completed") ?? [];

  return (
    <div className="cm-page max-w-3xl">
      <h2 className="cm-title mb-4">Event Hub</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "active"}
          onClick={() => setTab("active")}
          className={tab === "active" ? "cm-tab-active" : "cm-tab"}
        >
          Active &amp; Upcoming
        </button>
        <button
          role="tab"
          aria-selected={tab === "past"}
          onClick={() => setTab("past")}
          className={tab === "past" ? "cm-tab-active" : "cm-tab"}
        >
          Past Events
        </button>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div role="status" aria-live="polite" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse cm-surface rounded-lg p-5 space-y-3"
            >
              <div className="h-4 bg-cm-primary/10 rounded w-1/2" />
              <div className="h-3 bg-cm-primary/10 rounded w-3/4" />
              <div className="h-3 bg-cm-primary/10 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Active & Upcoming */}
      {!isLoading && tab === "active" && (
        <div className="space-y-4">
          {activeEvents.length === 0 && (
            <div className="text-cm-muted text-center py-10">
              No active or upcoming events right now.
            </div>
          )}
          {activeEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="cm-surface rounded-lg p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    to={`/events/${event.id}`}
                    className="text-base font-semibold text-cm-text hover:text-cm-primary transition-colors"
                  >
                    {event.title}
                  </Link>
                  <p className="text-sm text-cm-muted mt-0.5">{event.description}</p>
                </div>
                <span className={`cm-chip shrink-0 ${statusColor(event.status)}`}>
                  {event.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-cm-muted">
                <span className="cm-chip bg-cm-primary/10 text-cm-primary capitalize">{categoryShortDisplay[event.theme] || event.theme.replace(/_/g, " ")}</span>
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  {formatDate(event.start_at)} – {formatDate(event.end_at)}
                </span>
                {event.status === "active" && (
                  <span className="flex items-center gap-1 text-cm-emerald font-medium">
                    <Clock size={13} />
                    {timeRemaining(event.end_at)}
                  </span>
                )}
              </div>

              <Link
                to={`/events/${event.id}`}
                className="cm-btn-primary inline-block text-xs px-3 py-1.5"
              >
                View Event
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Past Events */}
      {!isLoading && tab === "past" && (
        <div className="space-y-2">
          {pastEvents.length === 0 && (
            <div className="text-cm-muted text-center py-10">
              No past events yet.
            </div>
          )}
          {pastEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between cm-surface rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Trophy size={15} className="text-cm-amber shrink-0" />
                <div>
                  <Link
                    to={`/events/${event.id}`}
                    className="text-sm font-medium text-cm-text hover:text-cm-primary transition-colors"
                  >
                    {event.title}
                  </Link>
                  <div className="text-xs text-cm-muted">
                    {formatDate(event.start_at)} – {formatDate(event.end_at)}
                  </div>
                </div>
              </div>
              <span className="cm-chip bg-cm-muted/10 text-cm-muted text-xs">Ended</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
