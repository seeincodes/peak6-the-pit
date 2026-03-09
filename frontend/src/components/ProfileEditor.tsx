import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Check } from "lucide-react";
import { AVATAR_PRESETS } from "../constants/avatars";
import api from "../api/client";

interface ProfileEditorProps {
  displayName: string;
  avatarId: string;
  bio: string;
  onClose: () => void;
}

export default function ProfileEditor({ displayName, avatarId, bio, onClose }: ProfileEditorProps) {
  const [name, setName] = useState(displayName);
  const [selectedAvatar, setSelectedAvatar] = useState(avatarId || "default");
  const [bioText, setBioText] = useState(bio || "");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: { display_name: string; avatar_id: string; bio: string }) =>
      api.patch("/users/me", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      onClose();
    },
  });

  const handleSave = () => {
    mutation.mutate({ display_name: name, avatar_id: selectedAvatar, bio: bioText });
  };

  return (
    <div className="bg-cm-card border border-cm-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-cm-text">Edit Profile</h3>
        <button onClick={onClose} className="text-cm-muted hover:text-cm-text focus-ring rounded">
          <X size={18} />
        </button>
      </div>

      {/* Avatar picker */}
      <label className="block text-xs text-cm-muted mb-2">Avatar</label>
      <div className="grid grid-cols-7 gap-2 mb-4">
        {Object.entries(AVATAR_PRESETS).map(([id, emoji]) => (
          <button
            key={id}
            onClick={() => setSelectedAvatar(id)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all focus-ring ${
              selectedAvatar === id
                ? "bg-cm-primary/20 ring-2 ring-cm-primary"
                : "bg-cm-card-raised hover:bg-cm-border"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Display name */}
      <label className="block text-xs text-cm-muted mb-1">Display Name</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={100}
        className="w-full bg-cm-bg border border-cm-border rounded px-3 py-2 text-sm text-cm-text mb-4 focus:outline-none focus:ring-2 focus:ring-cm-primary"
      />

      {/* Bio */}
      <label className="block text-xs text-cm-muted mb-1">Bio</label>
      <textarea
        value={bioText}
        onChange={(e) => setBioText(e.target.value)}
        maxLength={200}
        rows={2}
        placeholder="e.g., Vol desk intern, Phase 2"
        className="w-full bg-cm-bg border border-cm-border rounded px-3 py-2 text-sm text-cm-text mb-1 resize-none focus:outline-none focus:ring-2 focus:ring-cm-primary"
      />
      <div className="text-[11px] text-cm-muted text-right mb-4">{bioText.length}/200</div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-cm-muted hover:text-cm-text rounded focus-ring"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || mutation.isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-cm-primary rounded hover:opacity-90 disabled:opacity-50 focus-ring"
        >
          <Check size={14} />
          {mutation.isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
