import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, CheckCircle, XCircle, Star, BookOpen } from "lucide-react";
import { AVATAR_PRESETS } from "../constants/avatars";
import api from "../api/client";

interface Mentorship {
  id: string;
  mentor_id: string;
  mentee_id: string;
  mentor_name: string;
  mentee_name: string;
  status: "pending" | "active" | "declined";
  role: "mentor" | "mentee";
  started_at?: string;
  created_at: string;
}

interface AvailableMentor {
  id: string;
  display_name: string;
  level: number;
  avatar_id?: string;
  mastered_categories: number;
  already_requested?: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MentorshipHubPage() {
  const [tab, setTab] = useState<"my" | "find">("my");
  const queryClient = useQueryClient();

  const { data: mentorships, isLoading: loadingMentorships } = useQuery({
    queryKey: ["mentorships"],
    queryFn: async () => {
      const res = await api.get("/mentorships");
      return res.data as Mentorship[];
    },
  });

  const { data: availableMentors, isLoading: loadingMentors } = useQuery({
    queryKey: ["mentors-available"],
    queryFn: async () => {
      const res = await api.get("/mentorships/mentors/available");
      return res.data as AvailableMentor[];
    },
    enabled: tab === "find",
  });

  const acceptMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.put(`/mentorships/${id}/accept`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorships"] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.put(`/mentorships/${id}/decline`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorships"] });
    },
  });

  const requestMutation = useMutation({
    mutationFn: async (mentor_id: string) => {
      const res = await api.post("/mentorships/request", { mentor_id });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentors-available"] });
      queryClient.invalidateQueries({ queryKey: ["mentorships"] });
    },
  });

  const pendingRequests = mentorships?.filter(
    (m) => m.status === "pending" && m.role === "mentor"
  ) ?? [];
  const activeMentorships = mentorships?.filter(
    (m) => m.status === "active"
  ) ?? [];

  return (
    <div className="cm-page max-w-3xl">
      <div className="flex items-center gap-3 mb-4">
        <Heart size={22} className="text-cm-primary" />
        <h2 className="cm-title">Mentorship</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "my"}
          onClick={() => setTab("my")}
          className={tab === "my" ? "cm-tab-active" : "cm-tab"}
        >
          My Mentorships
        </button>
        <button
          role="tab"
          aria-selected={tab === "find"}
          onClick={() => setTab("find")}
          className={tab === "find" ? "cm-tab-active" : "cm-tab"}
        >
          Find a Mentor
        </button>
      </div>

      {/* My Mentorships Tab */}
      {tab === "my" && (
        <div className="space-y-6">
          {/* Pending requests (as mentor) */}
          {pendingRequests.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-cm-muted uppercase tracking-widest mb-3">
                Pending Requests
              </h3>
              <div className="space-y-3">
                {pendingRequests.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="cm-surface rounded-lg p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-cm-card-raised border border-cm-border/10 flex items-center justify-center text-xl shrink-0">
                        {AVATAR_PRESETS["default"]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-cm-text truncate">
                          {m.mentee_name}
                        </p>
                        <p className="text-xs text-cm-muted">
                          Requested mentorship
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => acceptMutation.mutate(m.id)}
                        disabled={acceptMutation.isPending || declineMutation.isPending}
                        className="flex items-center gap-1.5 cm-btn-primary text-xs px-3 py-1.5"
                      >
                        <CheckCircle size={14} />
                        Accept
                      </button>
                      <button
                        onClick={() => declineMutation.mutate(m.id)}
                        disabled={acceptMutation.isPending || declineMutation.isPending}
                        className="flex items-center gap-1.5 cm-btn text-xs px-3 py-1.5 text-cm-muted hover:text-cm-text"
                      >
                        <XCircle size={14} />
                        Decline
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Active mentorships */}
          <div>
            <h3 className="text-sm font-semibold text-cm-muted uppercase tracking-widest mb-3">
              Active Mentorships
            </h3>
            {loadingMentorships && (
              <div role="status" aria-live="polite" className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse cm-surface rounded-lg p-4 space-y-2"
                  >
                    <div className="h-4 bg-cm-primary/10 rounded w-1/3" />
                    <div className="h-3 bg-cm-primary/10 rounded w-1/2" />
                  </div>
                ))}
              </div>
            )}
            {!loadingMentorships && activeMentorships.length === 0 && (
              <div className="text-cm-muted text-center py-10 cm-surface rounded-lg">
                No active mentorships yet.{" "}
                <button
                  onClick={() => setTab("find")}
                  className="text-cm-primary hover:underline"
                >
                  Find a mentor
                </button>
                .
              </div>
            )}
            {!loadingMentorships && activeMentorships.length > 0 && (
              <div className="space-y-3">
                {activeMentorships.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="cm-surface rounded-lg p-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-cm-card-raised border border-cm-border/10 flex items-center justify-center text-xl shrink-0">
                      {AVATAR_PRESETS["default"]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-cm-text">
                        {m.role === "mentee" ? m.mentor_name : m.mentee_name}
                      </p>
                      <p className="text-xs text-cm-muted capitalize">
                        {m.role === "mentee" ? "Your mentor" : "Your mentee"}
                        {m.started_at && (
                          <> · Since {formatDate(m.started_at)}</>
                        )}
                      </p>
                    </div>
                    <span className="cm-chip bg-cm-emerald/20 text-cm-emerald text-xs shrink-0">
                      Active
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Find a Mentor Tab */}
      {tab === "find" && (
        <div className="space-y-3">
          {loadingMentors && (
            <div role="status" aria-live="polite" className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse cm-surface rounded-lg p-5 space-y-3"
                >
                  <div className="h-4 bg-cm-primary/10 rounded w-1/3" />
                  <div className="h-3 bg-cm-primary/10 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}
          {!loadingMentors && (!availableMentors || availableMentors.length === 0) && (
            <div className="text-cm-muted text-center py-10 cm-surface rounded-lg">
              No mentors available right now. Check back later.
            </div>
          )}
          {!loadingMentors &&
            availableMentors?.map((mentor, i) => (
              <motion.div
                key={mentor.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="cm-surface rounded-lg p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-cm-card-raised border border-cm-border/10 flex items-center justify-center text-2xl shrink-0">
                  {AVATAR_PRESETS[mentor.avatar_id || "default"] || AVATAR_PRESETS["default"]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-cm-text">
                    {mentor.display_name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-cm-primary">
                      <Star size={12} />
                      Level {mentor.level}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-cm-muted">
                      <BookOpen size={12} />
                      {mentor.mastered_categories} mastered
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => requestMutation.mutate(mentor.id)}
                  disabled={
                    requestMutation.isPending ||
                    mentor.already_requested
                  }
                  className={
                    mentor.already_requested
                      ? "cm-btn text-xs px-3 py-1.5 text-cm-muted cursor-not-allowed"
                      : "cm-btn-primary text-xs px-3 py-1.5 shrink-0"
                  }
                >
                  {mentor.already_requested ? "Requested" : "Request"}
                </button>
              </motion.div>
            ))}
        </div>
      )}
    </div>
  );
}
