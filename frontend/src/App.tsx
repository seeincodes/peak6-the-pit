import { Routes, Route, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import TrainingPage from "./pages/TrainingPage";
import ProfilePage from "./pages/ProfilePage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import LeaderboardPage from "./pages/LeaderboardPage";
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
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cm-bg flex items-center justify-center">
        <div role="status" aria-live="polite" className="text-cm-primary animate-pulse text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cm-bg flex">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Sidebar user={user} logout={logout} />
      <main id="main-content" className="flex-1 min-h-screen ml-[220px]">
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
