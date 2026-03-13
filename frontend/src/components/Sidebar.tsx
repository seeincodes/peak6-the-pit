import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crosshair,
  Trophy,
  BookOpen,
  Bookmark,
  Target,
  Users,
  Map,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Activity,
} from "lucide-react";
import { AVATAR_PRESETS } from "../constants/avatars";
import DailyChallengeCard from "./DailyChallengeCard";
import StreakFlame from "./StreakFlame";
import ThemeToggle from "./ThemeToggle";

interface SidebarProps {
  user: {
    display_name: string;
    level: number;
    level_title: string;
    xp_total: number;
    streak_days: number;
    avatar_id?: string;
  } | null;
  logout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const LEVEL_XP = [0, 0, 60, 180, 380, 720, 1250, 2050, 3250, 5050, 8000];

const NAV_ITEMS = [
  { to: "/", icon: Crosshair, label: "Training", matchExact: true },
  { to: "/paths", icon: Map, label: "Learn Paths", matchExact: false },
  { to: "/review", icon: BookOpen, label: "Review", matchExact: false },
  { to: "/progress", icon: Target, label: "Progress", matchExact: false },
  { to: "/leaderboard", icon: Trophy, label: "Leaderboard", matchExact: false },
  { to: "/bookmarks", icon: Bookmark, label: "Saved", matchExact: false },
  { to: "/feed", icon: Activity, label: "Community", matchExact: false },
  { to: "/peer-review", icon: Users, label: "Peer Review", matchExact: false },
];

export default function Sidebar({ user, logout, collapsed, onToggleCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();

  const isActive = (to: string, matchExact: boolean) => {
    if (matchExact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  const currentLevelXP = user ? LEVEL_XP[user.level] || 0 : 0;
  const nextLevelXP = user
    ? LEVEL_XP[user.level + 1] || LEVEL_XP[user.level] + 500
    : 100;
  const progressXP = user ? Math.max(0, user.xp_total - currentLevelXP) : 0;
  const neededXP = nextLevelXP - currentLevelXP;
  const progressPct = Math.min((progressXP / neededXP) * 100, 100);

  const sidebarInner = (isMobile: boolean) => (
    <aside
      className={`
        flex flex-col bg-cm-card border-r border-cm-border h-full
        transition-[width] duration-300 ease-in-out overflow-hidden
        ${isMobile ? "w-[220px]" : collapsed ? "w-16" : "w-[220px]"}
      `}
    >
      {/* Logo / Brand + Controls */}
      <div className={`flex items-center h-16 border-b border-cm-border shrink-0 ${collapsed && !isMobile ? "justify-center px-2" : "px-4"}`}>
        {collapsed && !isMobile ? (
          <button
            onClick={onToggleCollapse}
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-cm-primary to-cm-emerald flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
            aria-label="Expand sidebar"
          >
            <ChevronRight size={16} className="text-white" />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cm-primary to-cm-emerald flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm tracking-tight">CM</span>
              </div>
              <span className="text-cm-text font-bold text-sm whitespace-nowrap">
                CapMan AI
              </span>
            </div>
            {isMobile ? (
              <button
                onClick={onMobileClose}
                className="flex items-center justify-center w-7 h-7 rounded-md text-cm-muted hover:text-cm-text transition-colors shrink-0"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            ) : (
              <button
                onClick={onToggleCollapse}
                className="flex items-center justify-center w-7 h-7 rounded-md text-cm-muted hover:text-cm-text hover:bg-cm-card-raised transition-colors shrink-0"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={16} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex-1 flex flex-col gap-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.to, item.matchExact);
          const Icon = item.icon;
          const isCollapsed = collapsed && !isMobile;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={isMobile ? onMobileClose : undefined}
              aria-current={active ? "page" : undefined}
              title={isCollapsed ? item.label : undefined}
              className={`
                relative flex items-center gap-3 rounded-lg h-11
                transition-all duration-200 group focus-ring
                ${isCollapsed ? "justify-center px-0" : "px-3"}
                ${active
                  ? "bg-cm-primary/10 text-cm-primary"
                  : "text-cm-muted hover:bg-cm-card-raised hover:text-cm-text"
                }
              `}
            >
              {active && (
                <motion.div
                  layoutId={isMobile ? "sidebar-active-mobile" : "sidebar-active"}
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
              {!isCollapsed && (
                <span className="text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      {user && (
        <div className="border-t border-cm-border px-3 py-4 shrink-0">
          {collapsed && !isMobile ? (
            <div className="flex flex-col items-center gap-3">
              <Link
                to="/profile"
                onClick={isMobile ? onMobileClose : undefined}
                aria-label="Go to profile"
                className="w-8 h-8 rounded-full bg-cm-card-raised border border-cm-border flex items-center justify-center text-base focus-ring hover:border-cm-primary/40 transition-colors"
                title={user.display_name}
              >
                {AVATAR_PRESETS[user.avatar_id || "default"] || "👤"}
              </Link>
              <button
                onClick={logout}
                className="flex items-center justify-center w-8 h-8 rounded-md text-cm-muted hover:text-cm-red hover:bg-cm-red/10 transition-all focus-ring"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <>
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
                  <StreakFlame days={user.streak_days} size="sm" />
                  <span className="text-xs text-cm-amber font-medium">streak</span>
                </div>
              )}

              {/* Daily Challenges */}
              <div className="mb-3">
                <DailyChallengeCard compact />
              </div>

              {/* User avatar + name */}
              <Link
                to="/profile"
                onClick={isMobile ? onMobileClose : undefined}
                aria-label="Go to profile"
                className="flex items-center gap-3 mb-2 rounded-lg px-2 py-1 -mx-2 text-left hover:bg-cm-card-raised transition-colors focus-ring"
              >
                <div className="w-8 h-8 rounded-full bg-cm-card-raised border border-cm-border flex items-center justify-center shrink-0 text-base">
                  {AVATAR_PRESETS[user.avatar_id || "default"] || "👤"}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-cm-text truncate">
                    {user.display_name}
                  </div>
                  <div className="text-[11px] text-cm-muted truncate">
                    {user.level_title}
                  </div>
                </div>
              </Link>

              {/* Logout */}
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full rounded-lg px-3 h-9 text-cm-muted hover:text-cm-red hover:bg-cm-red/10 transition-all duration-200 focus-ring"
              >
                <LogOut size={18} className="shrink-0" />
                <span className="text-sm font-medium">Logout</span>
              </button>
              <div className="mt-2">
                <ThemeToggle />
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <div className="hidden lg:block fixed top-0 left-0 h-screen z-40">
        {sidebarInner(false)}
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
            />
            <motion.div
              className="fixed top-0 left-0 h-screen z-50 lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {sidebarInner(true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
