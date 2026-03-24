import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Pencil } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import BadgeGrid from "../components/BadgeGrid";
import ProfileEditor from "../components/ProfileEditor";
import SkillTreeCanvas from "../components/SkillTreeCanvas";
import SkillNodeDetail from "../components/SkillNodeDetail";
import { AVATAR_PRESETS } from "../constants/avatars";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const { logout } = useAuth();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => (await api.get("/users/me")).data,
  });

  const { data: skillNodes } = useQuery({
    queryKey: ["skill-tree"],
    queryFn: async () => (await api.get("/skills/tree")).data,
  });

  const { data: mastery } = useQuery({
    queryKey: ["skill-mastery"],
    queryFn: async () => (await api.get("/skills/mastery")).data,
  });

  if (!user) return null;

  const avatarEmoji = AVATAR_PRESETS[user.avatar_id] || AVATAR_PRESETS.default;

  return (
    <div className="cm-page max-w-4xl space-y-6 sm:space-y-8">
      {/* Profile Header */}
      <div className="flex items-start justify-between">
        {editing ? (
          <ProfileEditor
            displayName={user.display_name}
            avatarId={user.avatar_id || "default"}
            bio={user.bio || ""}
            onClose={() => setEditing(false)}
          />
        ) : (
          <div className="flex items-start gap-5 flex-1 min-w-0">
            <div className="w-16 h-16 rounded-xl bg-cm-card-raised border border-cm-border flex items-center justify-center text-3xl shrink-0">
              {avatarEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="cm-subtitle truncate">{user.display_name}</h2>
                <button
                  onClick={() => setEditing(true)}
                  className="text-cm-muted hover:text-cm-primary transition-colors focus-ring rounded p-1"
                  aria-label="Edit profile"
                >
                  <Pencil size={14} />
                </button>
              </div>
              <div className="text-sm text-cm-primary">{user.level_title}</div>
              {user.bio && <div className="text-sm text-cm-muted mt-1">{user.bio}</div>}
              <div className="flex items-center gap-4 mt-2 text-xs text-cm-muted">
                <span>{user.xp_total} XP</span>
                <span>Level {user.level}</span>
                {user.streak_days > 0 && <span>{user.streak_days}d streak</span>}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-2 text-cm-muted hover:text-cm-red transition-colors text-sm focus-ring rounded px-2 py-1 shrink-0 ml-4"
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>

      {/* Badges & Skill Nodes — combined card */}
      <div className="cm-surface-section p-4 sm:p-6">
        {/* Badges section */}
        <BadgeGrid />

        {/* Divider */}
        <div className="my-8 cm-divider" />

        {/* Skill Tree section */}
        <div>
          <h3 className="cm-subtitle mb-2">Skill Tree</h3>
          <p className="cm-body mb-4">
            Click a node to see your mastery details and start training.
          </p>
          {skillNodes && mastery ? (
            <div className="relative h-[500px] rounded-lg overflow-hidden border border-cm-border bg-cm-bg">
              <SkillTreeCanvas
                nodes={skillNodes}
                mastery={mastery}
                onNodeClick={setSelectedNode}
              />
            </div>
          ) : (
            <div className="h-[500px] rounded-lg border border-cm-border bg-cm-bg flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-cm-primary/30 border-t-cm-primary rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedNode && (
          <SkillNodeDetail
            node={selectedNode}
            mastery={mastery?.find((m: any) => m.category === selectedNode.category) || null}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
