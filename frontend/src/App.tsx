import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import { AVATAR_PRESETS } from "./constants/avatars";
import { useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import AdminSidebar from "./components/AdminSidebar";
import TrainingPage from "./pages/TrainingPage";
import ProfilePage from "./pages/ProfilePage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ReviewPage from "./pages/ReviewPage";
import ProgressPage from "./pages/ProgressPage";
import PeerReviewPage from "./pages/PeerReviewPage";
import LearningPathPage from "./pages/LearningPathPage";
import FeedPage from "./pages/FeedPage";
import UserProfilePage from "./pages/UserProfilePage";
import QuickFirePage from "./pages/QuickFirePage";
import DictionaryPage from "./pages/DictionaryPage";
import ChatPage from "./pages/ChatPage";
import EventHubPage from "./pages/EventHubPage";
import EventDetailPage from "./pages/EventDetailPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminEventForm } from "./pages/Admin/AdminEventForm";
import { XPToastProvider } from "./context/XPToastContext";
import api from "./api/client";

function App() {
  const { user: authUser, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cm-bg flex items-center justify-center">
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cm-primary/30 border-t-cm-primary rounded-full animate-spin" />
          <span className="text-cm-muted text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const { logout } = useAuth();
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await api.get("/users/me");
      return res.data;
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isAdmin = user?.role === "org_admin";

  // Close mobile sidebar on route change
  const location = useLocation();
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cm-bg flex items-center justify-center">
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cm-primary/30 border-t-cm-primary rounded-full animate-spin" />
          <span className="text-cm-muted text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <XPToastProvider>
      <div className="h-screen bg-cm-bg flex overflow-hidden">
        <a href="#main-content" className="skip-link">Skip to main content</a>

        {/* Mobile top bar */}
        <div className="fixed top-0 left-0 right-0 h-14 bg-cm-card border-b border-cm-border flex items-center justify-between px-4 z-30 lg:hidden">
          <div className="flex items-center">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="text-cm-muted hover:text-cm-text transition-colors p-1 -ml-1"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2 ml-3">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cm-primary to-cm-emerald flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-[10px] tracking-tight">TP</span>
              </div>
              <span className="text-cm-text font-bold text-sm">The Pit</span>
            </div>
          </div>
          {user && !isAdmin && (
            <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-sm font-medium text-cm-text hidden xs:inline">{user.display_name}</span>
              <div className="w-8 h-8 rounded-full bg-cm-card-raised border border-cm-border flex items-center justify-center text-base">
                {AVATAR_PRESETS[user.avatar_id || "default"] || "👤"}
              </div>
            </Link>
          )}
          {user && isAdmin && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-cm-text">Admin Console</span>
              <button
                onClick={logout}
                className="text-xs font-medium text-cm-muted hover:text-cm-text transition-colors"
              >
                Log out
              </button>
            </div>
          )}
        </div>

        {isAdmin ? (
          <AdminSidebar
            user={user}
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />
        ) : (
          <Sidebar
            user={user}
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />
        )}

        <main
          id="main-content"
          className={`
            flex-1 min-h-0 overflow-y-auto overflow-x-hidden
            pt-14 lg:pt-0
            transition-[margin-left] duration-300 ease-in-out
            ml-0 lg:ml-[220px]
          `}
        >
          {/* Desktop top bar */}
          {user && !isAdmin && (
            <div className="hidden lg:flex items-center justify-end h-16 px-6 border-b border-cm-border bg-cm-card/50 sticky top-0 z-30 backdrop-blur-sm">
              <Link to="/profile" className="relative z-10 flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="text-right">
                  <div className="text-sm font-semibold text-cm-text leading-tight">{user.display_name}</div>
                  <div className="text-[11px] text-cm-primary">{user.level_title}</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-cm-card-raised border border-cm-border flex items-center justify-center text-lg">
                  {AVATAR_PRESETS[user.avatar_id || "default"] || "👤"}
                </div>
              </Link>
            </div>
          )}
          {user && isAdmin && (
            <div className="hidden lg:flex items-center justify-end h-16 px-6 border-b border-cm-border bg-cm-card/50 sticky top-0 z-30 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="text-sm font-semibold text-cm-primary">Admin Dashboard</div>
                <button
                  onClick={logout}
                  className="text-sm font-medium text-cm-muted hover:text-cm-text transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          )}

          <Routes>
            {isAdmin ? (
              <>
                <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<AdminDashboard currentUser={user} />} />
                <Route path="/admin/events/new" element={<AdminEventForm />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </>
            ) : (
              <>
                <Route
                  path="/"
                  element={
                    <TrainingPage
                      unlockedCategories={user?.unlocked_categories || []}
                      hasOnboarded={user?.has_onboarded ?? true}
                    />
                  }
                />
                <Route path="/quick-fire" element={<QuickFireStandalone />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/review" element={<ReviewPage />} />
                <Route path="/dictionary" element={<DictionaryPage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/peer-review" element={<PeerReviewPage />} />
                <Route path="/paths" element={<LearningPathPage />} />
                <Route path="/feed" element={<FeedPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/events" element={<EventHubPage />} />
                <Route path="/events/:eventId" element={<EventDetailPage />} />
                <Route path="/profile/:userId" element={<UserProfilePage />} />
                <Route path="/admin/dashboard" element={<AdminDashboard currentUser={user} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </XPToastProvider>
  );
}

const QF_CATEGORIES = [
  { value: "iv_analysis", label: "IV Analysis" },
  { value: "greeks", label: "Greeks" },
  { value: "order_flow", label: "Order Flow" },
  { value: "macro", label: "Macro" },
  { value: "term_structure", label: "Term Structure" },
  { value: "skew", label: "IV Skew" },
  { value: "position_sizing", label: "Position Sizing" },
  { value: "trade_structuring", label: "Trade Structuring" },
  { value: "risk_management", label: "Risk Management" },
];

function QuickFireStandalone() {
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");

  if (category) {
    return (
      <QuickFirePage
        category={category}
        difficulty={difficulty}
        onExit={() => setCategory("")}
      />
    );
  }

  return (
    <div className="cm-page max-w-xl">
      <h2 className="cm-title mb-6">Quick Fire</h2>
      <div className="cm-surface p-5 space-y-4">
        <div>
          <label className="cm-label mb-1.5 block">Category</label>
          <select
            className="cm-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select a category...</option>
            {QF_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="cm-label mb-1.5 block">Difficulty</label>
          <div className="flex gap-2">
            {["beginner", "intermediate", "advanced"].map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={difficulty === d ? "cm-tab-active flex-1" : "cm-tab flex-1"}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
