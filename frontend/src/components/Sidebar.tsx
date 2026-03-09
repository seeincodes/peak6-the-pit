import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Crosshair,
  GitBranch,
  Trophy,
  LogOut,
  Flame,
} from "lucide-react";

interface SidebarProps {
  user: {
    display_name: string;
    level: number;
    level_title: string;
    xp_total: number;
    streak_days: number;
  } | null;
  logout: () => void;
}

const LEVEL_XP = [0, 0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000];

const NAV_ITEMS = [
  { to: "/", icon: Crosshair, label: "Training", matchExact: true },
  { to: "/profile", icon: GitBranch, label: "Skill Tree", matchExact: false },
  { to: "/leaderboard", icon: Trophy, label: "Leaderboard", matchExact: false },
];

export default function Sidebar({ user, logout }: SidebarProps) {
  const location = useLocation();

  const isActive = (to: string, matchExact: boolean) => {
    if (matchExact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  const currentLevelXP = user ? LEVEL_XP[user.level] || 0 : 0;
  const nextLevelXP = user
    ? LEVEL_XP[user.level + 1] || LEVEL_XP[user.level] + 500
    : 100;
  const progressXP = user ? user.xp_total - currentLevelXP : 0;
  const neededXP = nextLevelXP - currentLevelXP;
  const progressPct = Math.min((progressXP / neededXP) * 100, 100);

  return (
    <aside className="fixed top-0 left-0 h-screen z-40 flex flex-col w-[220px] bg-cm-card border-r border-cm-border">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-cm-border shrink-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cm-primary to-cm-emerald flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm tracking-tight">CM</span>
        </div>
        <span className="text-cm-text font-bold text-sm whitespace-nowrap">
          CapMan AI
        </span>
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex-1 flex flex-col gap-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.to, item.matchExact);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={`
                relative flex items-center gap-3 rounded-lg px-3 h-11
                transition-all duration-200 group
                focus-ring
                ${active
                  ? "bg-cm-primary/12 text-cm-primary"
                  : "text-cm-muted hover:bg-cm-card-raised hover:text-cm-text"
                }
              `}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-cm-primary"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <Icon
                size={20}
                className={`shrink-0 transition-colors duration-200 ${
                  active ? "text-cm-primary" : "text-cm-muted group-hover:text-cm-text"
                }`}
              />
              <span className="text-sm font-medium whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      {user && (
        <div className="border-t border-cm-border px-3 py-4 shrink-0">
          {/* XP Progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-cm-primary tracking-wide uppercase">
                LVL {user.level}
              </span>
              <span className="text-[11px] text-cm-muted">
                {progressXP}/{neededXP}
              </span>
            </div>
            <div className="relative w-full h-1.5 bg-cm-bg rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cm-primary to-cm-emerald rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Streak */}
          {user.streak_days > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <Flame size={16} className="text-cm-amber shrink-0" />
              <span className="text-xs text-cm-amber font-medium">
                {user.streak_days}d streak
              </span>
            </div>
          )}

          {/* User avatar + name */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cm-primary to-cm-emerald flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">
                {user.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-cm-text truncate">
                {user.display_name}
              </div>
              <div className="text-[11px] text-cm-muted truncate">
                {user.level_title}
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full rounded-lg px-3 h-9 text-cm-muted hover:text-cm-red hover:bg-cm-red/8 transition-all duration-200 focus-ring"
          >
            <LogOut size={18} className="shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      )}
    </aside>
  );
}
