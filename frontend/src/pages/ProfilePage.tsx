import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Lock, Pencil } from "lucide-react";
import SkillTree from "../components/SkillTree";
import BadgeGrid from "../components/BadgeGrid";
import ProfileEditor from "../components/ProfileEditor";
import { AVATAR_PRESETS } from "../constants/avatars";
import api from "../api/client";

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => (await api.get("/users/me")).data,
  });

  if (!user) return null;

  const avatarEmoji = AVATAR_PRESETS[user.avatar_id] || AVATAR_PRESETS.default;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:p-8 space-y-6 sm:space-y-8">
      {/* Profile Header */}
      {editing ? (
        <ProfileEditor
          displayName={user.display_name}
          avatarId={user.avatar_id || "default"}
          bio={user.bio || ""}
          onClose={() => setEditing(false)}
        />
      ) : (
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-xl bg-cm-card-raised border border-cm-border flex items-center justify-center text-3xl shrink-0">
            {avatarEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-cm-text truncate">{user.display_name}</h2>
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

      {/* Badges & Skill Tree — combined card */}
      <div className="rounded-xl border border-cm-border bg-cm-card/50 p-4 sm:p-6">
        {/* Badges section */}
        <BadgeGrid />

        {/* Divider */}
        <div className="my-8 border-t border-cm-border" />

        {/* Skill Tree section */}
        <div>
          <h3 className="text-xl font-bold text-cm-text mb-2">Skill Tree</h3>
          <p className="text-sm text-cm-muted mb-6">
            Unlock categories by leveling up. Master each area to progress.
          </p>
          <div className="flex items-center gap-6 mb-6 text-sm text-cm-muted">
            <span className="flex items-center gap-2"><Check size={14} className="text-cm-emerald shrink-0" /> Unlocked</span>
            <span className="flex items-center gap-2"><Lock size={14} className="shrink-0" /> Locked</span>
          </div>
          <SkillTree
            allCategories={user.all_categories}
            unlockedCategories={user.unlocked_categories}
            level={user.level}
          />
        </div>
      </div>
    </div>
  );
}
