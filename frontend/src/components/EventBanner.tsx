import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";
import api from "../api/client";
import { categoryShortDisplay } from "../theme/colors";

interface MarketEvent {
  id: string;
  title: string;
  theme: string;
  end_at: string;
}

function timeRemaining(endDate: string): string {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return "Ending soon";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h remaining`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m remaining`;
}

export default function EventBanner() {
  const { data: events } = useQuery({
    queryKey: ["events-active-banner"],
    queryFn: async () => {
      const res = await api.get("/events?status_filter=active");
      return res.data as MarketEvent[];
    },
    staleTime: 60_000,
  });

  const event = events?.[0];
  if (!event) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        to={`/events/${event.id}`}
        className="flex items-center justify-between gap-3 rounded-lg border border-cm-primary/30 bg-gradient-to-r from-cm-primary/5 to-transparent px-5 py-4 hover:border-cm-primary/50 transition-colors group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Calendar size={16} className="text-cm-primary shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-cm-text truncate">{event.title}</div>
            <div className="flex items-center gap-2 text-xs text-cm-muted mt-1">
              <span className="cm-chip bg-cm-primary/10 text-cm-primary capitalize">{categoryShortDisplay[event.theme] || event.theme.replace(/_/g, " ")}</span>
              <span className="text-cm-emerald font-medium">{timeRemaining(event.end_at)}</span>
            </div>
          </div>
        </div>
        <ArrowRight
          size={16}
          className="text-cm-muted group-hover:text-cm-primary transition-colors shrink-0"
        />
      </Link>
    </motion.div>
  );
}
