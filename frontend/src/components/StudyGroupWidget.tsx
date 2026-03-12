import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Copy, Check, LogOut, Plus, UserPlus } from "lucide-react";
import { AVATAR_PRESETS } from "../constants/avatars";
import api from "../api/client";

interface GroupDetail {
  id: string;
  name: string;
  invite_code: string;
  path_id: string;
  path_name: string;
  max_members: number;
  members: {
    user_id: string;
    display_name: string;
    avatar_id: string;
    current_step: number;
    progress_pct: number;
    completed: boolean;
  }[];
}

interface MyGroup {
  id: string;
  name: string;
  invite_code: string;
  path_id: string;
  path_name: string;
  member_count: number;
  max_members: number;
}

export default function StudyGroupWidget({
  pathId,
  pathName,
}: {
  pathId: string;
  pathName: string;
}) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState(`${pathName} Study Group`);
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);

  // Find if user is in a group for this path
  const { data: myGroups } = useQuery({
    queryKey: ["my-study-groups"],
    queryFn: async () => {
      const res = await api.get("/study-groups/my-groups");
      return res.data as MyGroup[];
    },
  });

  const groupForPath = myGroups?.find((g) => g.path_id === pathId);

  // Get group detail if in a group
  const { data: groupDetail } = useQuery({
    queryKey: ["study-group-detail", groupForPath?.id],
    queryFn: async () => {
      const res = await api.get(`/study-groups/${groupForPath!.id}`);
      return res.data as GroupDetail;
    },
    enabled: !!groupForPath,
    refetchInterval: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/study-groups", { name: groupName, path_id: pathId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-study-groups"] });
      setShowCreate(false);
      setGroupName("");
    },
  });

  const joinMutation = useMutation({
    mutationFn: () =>
      api.post("/study-groups/join", { invite_code: inviteCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-study-groups"] });
      setShowJoin(false);
      setInviteCode("");
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () =>
      api.delete(`/study-groups/${groupForPath!.id}/leave`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-study-groups"] });
    },
  });

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // In a group — show members + progress
  if (groupDetail) {
    return (
      <div className="cm-surface p-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-cm-primary" />
            <h4 className="text-sm font-bold text-cm-text">{groupDetail.name}</h4>
            <span className="text-xs text-cm-muted">
              {groupDetail.members.length}/{groupDetail.max_members}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyInviteCode(groupDetail.invite_code)}
              className="flex items-center gap-1 text-xs text-cm-primary hover:text-cm-primary/80 transition-colors"
              title="Copy invite code"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {groupDetail.invite_code}
            </button>
            <button
              onClick={() => leaveMutation.mutate()}
              disabled={leaveMutation.isPending}
              className="text-cm-muted hover:text-cm-red transition-colors"
              title="Leave group"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {groupDetail.members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-cm-card-raised border border-cm-border flex items-center justify-center text-sm shrink-0">
                {AVATAR_PRESETS[m.avatar_id] || "👤"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium text-cm-text truncate">
                    {m.display_name}
                  </span>
                  <span className="text-xs text-cm-muted">
                    {m.completed ? "Done!" : `${m.progress_pct}%`}
                  </span>
                </div>
                <div className="w-full h-1 bg-cm-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      m.completed ? "bg-cm-emerald" : "bg-cm-primary"
                    }`}
                    style={{ width: `${m.progress_pct}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Not in a group — show CTAs
  return (
    <div className="cm-surface p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Users size={16} className="text-cm-primary" />
        <h4 className="text-sm font-bold text-cm-text">Study Group</h4>
      </div>
      <p className="text-xs text-cm-muted mb-3">
        Team up with others on this path for accountability and friendly competition.
      </p>

      <AnimatePresence mode="wait">
        {showCreate ? (
          <motion.div
            key="create"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <input
              type="text"
              placeholder="Group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2 rounded-lg bg-cm-bg border border-cm-border text-sm text-cm-text placeholder:text-cm-muted/50 focus:outline-none focus:border-cm-primary/50"
            />
            <div className="flex gap-2">
              <button
                onClick={() => createMutation.mutate()}
                disabled={!groupName.trim() || createMutation.isPending}
                className="cm-btn-primary text-xs flex-1"
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="text-xs text-cm-muted hover:text-cm-text px-3"
              >
                Cancel
              </button>
            </div>
            {createMutation.isError && (
              <p className="text-xs text-cm-red">Failed to create group</p>
            )}
          </motion.div>
        ) : showJoin ? (
          <motion.div
            key="join"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <input
              type="text"
              placeholder="Enter invite code..."
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="w-full px-3 py-2 rounded-lg bg-cm-bg border border-cm-border text-sm text-cm-text placeholder:text-cm-muted/50 focus:outline-none focus:border-cm-primary/50 font-mono tracking-wider text-center"
            />
            <div className="flex gap-2">
              <button
                onClick={() => joinMutation.mutate()}
                disabled={!inviteCode.trim() || joinMutation.isPending}
                className="cm-btn-primary text-xs flex-1"
              >
                {joinMutation.isPending ? "Joining..." : "Join"}
              </button>
              <button
                onClick={() => setShowJoin(false)}
                className="text-xs text-cm-muted hover:text-cm-text px-3"
              >
                Cancel
              </button>
            </div>
            {joinMutation.isError && (
              <p className="text-xs text-cm-red">
                Invalid code or group is full
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div key="ctas" className="flex gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="cm-btn-primary text-xs flex-1 flex items-center justify-center gap-1"
            >
              <Plus size={14} /> Create Group
            </button>
            <button
              onClick={() => setShowJoin(true)}
              className="flex-1 flex items-center justify-center gap-1 text-xs px-3 py-2 rounded-lg border border-cm-border text-cm-text hover:bg-cm-card-raised transition-colors"
            >
              <UserPlus size={14} /> Join with Code
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
