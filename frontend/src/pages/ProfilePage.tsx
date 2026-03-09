import SkillTree from "../components/SkillTree";
import { useQuery } from "@tanstack/react-query";
import { Check, Lock } from "lucide-react";
import api from "../api/client";

export default function ProfilePage() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => (await api.get("/users/me")).data,
  });

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-6" aria-label="Skill tree profile">
      <h2 className="text-2xl font-bold text-cm-text mb-6">Skill Tree</h2>
      <div className="flex items-center gap-4 mb-4 text-xs text-cm-muted">
        <span className="flex items-center gap-1"><Check size={12} className="text-cm-emerald" /> Unlocked</span>
        <span className="flex items-center gap-1"><Lock size={12} /> Locked</span>
      </div>
      <div className="flex justify-center">
        <SkillTree
          allCategories={user.all_categories}
          unlockedCategories={user.unlocked_categories}
          level={user.level}
        />
      </div>
    </div>
  );
}
