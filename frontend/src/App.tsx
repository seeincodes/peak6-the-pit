import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import TrainingPage from "./pages/TrainingPage";
import ProfilePage from "./pages/ProfilePage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ReviewPage from "./pages/ReviewPage";
import BookmarksPage from "./pages/BookmarksPage";
import ProgressPage from "./pages/ProgressPage";
import PeerReviewPage from "./pages/PeerReviewPage";
import LearningPathPage from "./pages/LearningPathPage";
import FeedPage from "./pages/FeedPage";
import UserProfilePage from "./pages/UserProfilePage";
import QuickFirePage from "./pages/QuickFirePage";
import { XPToastProvider } from "./context/XPToastContext";
import api from "./api/client";

function App() {
  const { user: authUser, isLoading: authLoading, logout } = useAuth();

  // Show loading spinner while auth state is being determined
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

  // Not authenticated — show public routes only
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

  // Authenticated — show protected layout
  return <AuthenticatedApp logout={logout} />;
}

function AuthenticatedApp({
  logout,
}: {
  logout: () => void;
}) {
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await api.get("/users/me");
      return res.data;
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
        <div className="fixed top-0 left-0 right-0 h-14 bg-cm-card border-b border-cm-border flex items-center px-4 z-30 lg:hidden">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="text-cm-muted hover:text-cm-text transition-colors p-1 -ml-1"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cm-primary to-cm-emerald flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-[10px] tracking-tight">CM</span>
            </div>
            <span className="text-cm-text font-bold text-sm">CapMan AI</span>
          </div>
        </div>

        <Sidebar
          user={user}
          logout={logout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        <main
          id="main-content"
          className={`
            flex-1 min-h-0 overflow-y-auto overflow-x-hidden
            pt-14 lg:pt-0
            transition-[margin-left] duration-300 ease-in-out
            ml-0 ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-[220px]"}
          `}
        >
          <Routes>
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
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/peer-review" element={<PeerReviewPage />} />
            <Route path="/paths" element={<LearningPathPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/profile/:userId" element={<UserProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
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
