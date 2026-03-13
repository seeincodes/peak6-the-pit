import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import ThemeToggle from "./components/ThemeToggle";
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
import { XPToastProvider } from "./context/XPToastContext";
import api from "./api/client";

function App() {
  const { user: authUser, isLoading: authLoading, logout } = useAuth();

  // Show loading spinner while auth state is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-cm-bg flex items-center justify-center">
        <div role="status" aria-live="polite" className="text-cm-primary animate-pulse text-xl">Loading...</div>
      </div>
    );
  }

  // Not authenticated — show public routes only
  if (!authUser) {
    return (
      <div className="min-h-screen bg-cm-bg">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle compact />
        </div>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
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
        <div role="status" aria-live="polite" className="text-cm-primary animate-pulse text-xl">Loading...</div>
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
          <div className="ml-auto">
            <ThemeToggle compact />
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

export default App;
