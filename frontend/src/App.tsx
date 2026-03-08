import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./context/AuthContext";
import ProfileHUD from "./components/ProfileHUD";
import TrainingPage from "./pages/TrainingPage";
import ProfilePage from "./pages/ProfilePage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import api from "./api/client";

function App() {
  const { user: authUser, isLoading: authLoading, logout } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth state is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-cm-bg flex items-center justify-center">
        <div className="text-cm-cyan animate-pulse text-xl font-mono">Loading...</div>
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
  return <AuthenticatedApp logout={logout} location={location} />;
}

function AuthenticatedApp({
  logout,
  location,
}: {
  logout: () => void;
  location: ReturnType<typeof useLocation>;
}) {
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await api.get("/users/me");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cm-bg flex items-center justify-center">
        <div className="text-cm-cyan animate-pulse text-xl font-mono">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cm-bg flex flex-col">
      {user && (
        <ProfileHUD
          displayName={user.display_name}
          level={user.level}
          levelTitle={user.level_title}
          xpTotal={user.xp_total}
          streakDays={user.streak_days}
        />
      )}
      <nav className="flex items-center gap-4 px-6 py-2 border-b border-cm-border">
        <Link
          to="/"
          className={`text-sm font-semibold transition-colors ${
            location.pathname === "/" ? "text-cm-cyan" : "text-cm-muted hover:text-cm-text"
          }`}
        >
          Training
        </Link>
        <Link
          to="/profile"
          className={`text-sm font-semibold transition-colors ${
            location.pathname === "/profile"
              ? "text-cm-cyan"
              : "text-cm-muted hover:text-cm-text"
          }`}
        >
          Skill Tree
        </Link>
        <Link
          to="/leaderboard"
          className={`text-sm font-semibold transition-colors ${
            location.pathname === "/leaderboard"
              ? "text-cm-cyan"
              : "text-cm-muted hover:text-cm-text"
          }`}
        >
          Leaderboard
        </Link>
        <button
          onClick={logout}
          className="ml-auto text-sm font-semibold text-cm-muted hover:text-cm-red transition-colors"
        >
          Logout
        </button>
      </nav>
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <TrainingPage
                unlockedCategories={user?.unlocked_categories || []}
              />
            }
          />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
