import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { extractOrgSlugFromHostname } from "../utils/authTenant";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const detectedOrgSlug = extractOrgSlugFromHostname(window.location.hostname);
  const [orgSlug, setOrgSlug] = useState(
    detectedOrgSlug === "acme" || detectedOrgSlug === "thepit"
      ? detectedOrgSlug
      : "thepit"
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, orgSlug);
      navigate("/");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        setError(axiosErr.response?.data?.detail || "Login failed. Please try again.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cm-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cm-primary to-cm-mint flex items-center justify-center">
              <span className="text-cm-bg text-xl font-extrabold leading-none">P</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight uppercase text-cm-text">
              THE PIT
            </h1>
          </div>
          <p className="text-cm-muted text-sm">Sign in to continue training</p>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-cm-border/10 bg-cm-card p-8">
          <h2 className="text-xl font-extrabold tracking-tight text-cm-text mb-6">Sign In</h2>

          {error && (
            <div role="alert" aria-live="assertive" className="mb-4 p-3 rounded-md bg-cm-red/10 border border-cm-red/30 text-cm-red text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-org" className="block text-cm-muted text-xs font-semibold mb-1.5 uppercase tracking-wide">
                Organization
              </label>
              <select
                id="login-org"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-cm-bg border border-cm-border/10 text-cm-text focus:outline-none focus:border-cm-primary/50 transition-all duration-300 focus-ring"
              >
                <option value="thepit">The Pit (thepit)</option>
                <option value="acme">Acme (acme)</option>
              </select>
            </div>

            <div>
              <label htmlFor="login-email" className="block text-cm-muted text-xs font-semibold mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-invalid={!!error}
                className="w-full px-4 py-2.5 rounded-lg bg-cm-bg border border-cm-border/10 text-cm-text placeholder-cm-muted/50 focus:outline-none focus:border-cm-primary/50 transition-all duration-300 focus-ring"
                placeholder="trader@example.com"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-cm-muted text-xs font-semibold mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-invalid={!!error}
                className="w-full px-4 py-2.5 rounded-lg bg-cm-bg border border-cm-border/10 text-cm-text placeholder-cm-muted/50 focus:outline-none focus:border-cm-primary/50 transition-all duration-300 focus-ring"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full py-3 rounded-lg bg-cm-primary text-cm-bg font-bold text-sm hover:bg-cm-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 focus-ring"
            >
              {loading ? (
                <span className="animate-pulse">Signing in...</span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-cm-muted text-sm">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-cm-primary hover:underline font-semibold transition-all duration-300 focus-ring rounded">
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
