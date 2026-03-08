import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ProfileHUD from "./components/ProfileHUD";
import TrainingPage from "./pages/TrainingPage";
import ProfilePage from "./pages/ProfilePage";
import api from "./api/client";

function App() {
  const location = useLocation();
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
      <nav className="flex gap-4 px-6 py-2 border-b border-cm-border">
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
            location.pathname === "/profile" ? "text-cm-cyan" : "text-cm-muted hover:text-cm-text"
          }`}
        >
          Skill Tree
        </Link>
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
          <Route
            path="/profile"
            element={<ProfilePage />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
