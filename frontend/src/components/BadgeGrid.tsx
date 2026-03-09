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
  const { data: badges, isLoading, isError } = useQuery<Badge[]>({
    queryKey: ["badges"],
    queryFn: async () => (await api.get("/users/me/badges")).data,
  });

  if (isLoading) {
    return (
      <div>
        <h3 className="text-xl font-bold text-cm-text mb-2">Badges</h3>
        <p className="text-sm text-cm-muted mb-6">Earn badges by completing challenges and reaching milestones.</p>
        <div className="flex flex-wrap gap-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="w-20 h-24 rounded-lg bg-cm-card border border-cm-border animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !badges) {
    return (
      <div>
        <h3 className="text-xl font-bold text-cm-text mb-2">Badges</h3>
        <p className="text-sm text-cm-muted">Unable to load badges. Please try again later.</p>
      </div>
    );
  }

  const earned = badges.filter((b) => b.earned).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold text-cm-text">Badges</h3>
        <span className="text-xs text-cm-muted">
          {earned}/{badges.length} earned
        </span>
      </div>
      <p className="text-sm text-cm-muted mb-6">Earn badges by completing challenges and reaching milestones.</p>
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
