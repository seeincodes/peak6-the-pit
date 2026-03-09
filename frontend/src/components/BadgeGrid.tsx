import { useQuery } from "@tanstack/react-query";
import BadgeCard from "./BadgeCard";
import api from "../api/client";

interface Badge {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  earned: boolean;
  awarded_at: string | null;
}

export default function BadgeGrid() {
  const { data: badges } = useQuery<Badge[]>({
    queryKey: ["badges"],
    queryFn: async () => (await api.get("/users/me/badges")).data,
  });

  if (!badges) return null;

  const earned = badges.filter((b) => b.earned).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-cm-text">Badges</h3>
        <span className="text-xs text-cm-muted">
          {earned}/{badges.length} earned
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        {badges.map((b) => (
          <BadgeCard
            key={b.slug}
            name={b.name}
            description={b.description}
            icon={b.icon}
            tier={b.tier}
            earned={b.earned}
            awardedAt={b.awarded_at}
          />
        ))}
      </div>
    </div>
  );
}
