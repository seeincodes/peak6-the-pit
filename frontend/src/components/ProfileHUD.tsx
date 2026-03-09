import XPBar from "./XPBar";

interface ProfileHUDProps {
  displayName: string;
  level: number;
  levelTitle: string;
  xpTotal: number;
  streakDays: number;
}

const LEVEL_XP = [0, 0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000];

export default function ProfileHUD({
  displayName,
  level,
  levelTitle,
  xpTotal,
  streakDays,
}: ProfileHUDProps) {
  const currentLevelXP = LEVEL_XP[level] || 0;
  const nextLevelXP = LEVEL_XP[level + 1] || LEVEL_XP[level] + 500;
  const progressXP = xpTotal - currentLevelXP;
  const neededXP = nextLevelXP - currentLevelXP;

  return (
    <header role="banner" className="flex items-center justify-between px-8 py-4 border-b border-cm-border bg-cm-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div aria-hidden="true" className="w-10 h-10 rounded-full bg-gradient-to-br from-cm-cyan to-cm-emerald flex items-center justify-center text-cm-bg font-bold">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-sm font-semibold text-cm-text">{displayName}</div>
          <div className="text-xs text-cm-cyan">{levelTitle}</div>
        </div>
      </div>

      <XPBar current={progressXP} nextLevel={neededXP} level={level} />

      <div className="flex items-center gap-2">
        {streakDays > 0 && (
          <div aria-label={`${streakDays} day streak`} className="flex items-center gap-1 px-3 py-1 rounded-full bg-cm-amber/10 border border-cm-amber/30">
            <span className="text-cm-amber text-sm">
              {streakDays}d streak
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
