import SkillTree from "../components/SkillTree";
import { useQuery } from "@tanstack/react-query";
import api from "../api/client";

export default function ProfilePage() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => (await api.get("/users/me")).data,
  });

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-cm-text mb-6">Skill Tree</h2>
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
