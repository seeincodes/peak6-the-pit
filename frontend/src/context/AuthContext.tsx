import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "../api/client";
import { extractOrgSlugFromHostname } from "../utils/authTenant";

interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  level: number;
  xp_total: number;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string, inviteToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("token", token);
    } else {
      delete api.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    api.get("/users/me")
      .then((res) => {
        setUser({
          id: res.data.id,
          email: "",
          display_name: res.data.display_name,
          level: res.data.level,
          xp_total: res.data.xp_total,
        });
      })
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const orgSlug = extractOrgSlugFromHostname(window.location.hostname);
    const res = await api.post("/auth/login", { email, password, org_slug: orgSlug });
    // Set header + localStorage immediately so child components have auth on first render
    api.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const signup = async (email: string, password: string, displayName: string, inviteToken: string) => {
    const res = await api.post("/auth/signup", {
      email,
      password,
      display_name: displayName,
      invite_token: inviteToken,
    });
    api.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
