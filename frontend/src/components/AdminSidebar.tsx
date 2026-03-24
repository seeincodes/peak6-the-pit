import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  LogOut,
  X,
} from "lucide-react";

interface AdminSidebarProps {
  user: {
    display_name: string;
    avatar_id?: string;
  } | null;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onLogout?: () => void;
}

export default function AdminSidebar({ user, mobileOpen, onMobileClose, onLogout }: AdminSidebarProps) {
  const location = useLocation();

  const isActive = (to: string) => {
    return location.pathname === to || location.pathname.startsWith(to + "/");
  };

  const sidebarInner = (isMobile: boolean) => (
    <aside className="flex flex-col bg-cm-card border-r border-cm-border h-full w-[220px] overflow-hidden">
      {/* Logo / Brand */}
      <div className="flex items-center h-16 border-b border-cm-border shrink-0 px-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cm-primary to-cm-mint flex items-center justify-center shrink-0">
            <span className="text-cm-bg font-extrabold text-sm tracking-tight">P</span>
          </div>
          <span className="text-cm-text font-extrabold text-sm whitespace-nowrap tracking-tight">
            THE PIT
          </span>
        </div>
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="flex items-center justify-center w-7 h-7 rounded-md text-cm-muted hover:text-cm-text transition-colors shrink-0"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav aria-label="Admin navigation" className="flex-1 flex flex-col gap-4 px-3 py-4 overflow-y-auto">
        <div>
          <p className="text-[10px] font-semibold text-cm-muted/60 uppercase tracking-widest px-3 mb-1">
            Admin
          </p>
          <div className="flex flex-col gap-0.5">
            <Link
              to="/admin/dashboard"
              onClick={isMobile ? onMobileClose : undefined}
              aria-current={isActive("/admin/dashboard") ? "page" : undefined}
              className={`
                relative flex items-center gap-3 rounded-lg h-9 px-3
                transition-all duration-200 group focus-ring
                ${isActive("/admin/dashboard")
                  ? "bg-cm-primary/10 text-cm-primary"
                  : "text-cm-muted hover:bg-cm-card-raised hover:text-cm-text"
                }
              `}
            >
              {isActive("/admin/dashboard") && (
                <motion.div
                  layoutId={isMobile ? "admin-sidebar-active-mobile" : "admin-sidebar-active"}
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-cm-primary"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <BarChart3
                size={18}
                className={`shrink-0 transition-colors duration-200 ${
                  isActive("/admin/dashboard") ? "text-cm-primary" : "text-cm-muted group-hover:text-cm-text"
                }`}
              />
              <span className="text-sm font-medium whitespace-nowrap">
                Analytics
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* User section */}
      {user && (
        <div className="border-t border-cm-border px-3 py-4 shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-cm-card-raised border border-cm-border flex items-center justify-center text-sm">
              {user.avatar_id ? user.avatar_id.charAt(0).toUpperCase() : "👤"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-cm-text truncate">
                {user.display_name}
              </p>
              <p className="text-[10px] text-cm-muted">Admin</p>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 h-9 rounded-lg bg-cm-bg hover:bg-cm-card-raised text-cm-muted hover:text-cm-text transition-colors text-sm"
            >
              <LogOut size={16} />
              <span className="font-medium">Logout</span>
            </button>
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
