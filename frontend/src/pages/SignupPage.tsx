import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(email, password, displayName);
      navigate("/");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        setError(axiosErr.response?.data?.detail || "Signup failed. Please try again.");
      } else {
        setError("Signup failed. Please try again.");
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-1">
            <span className="text-cm-text">The </span>
            <span className="text-cm-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.2)]">
              Pit
            </span>
          </h1>
          <p className="text-cm-muted text-sm">Create your trading profile</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-cm-border bg-cm-card p-8">
          <h2 className="text-xl font-bold text-cm-text mb-6">Sign Up</h2>

          {error && (
            <div role="alert" aria-live="assertive" className="mb-4 p-3 rounded-lg bg-cm-red/10 border border-cm-red/30 text-cm-red text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="signup-name" className="block text-cm-muted text-xs font-semibold mb-1.5 uppercase tracking-wide">
                Display Name
              </label>
              <input
                id="signup-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                aria-invalid={!!error}
                className="w-full px-4 py-2.5 rounded-lg bg-cm-bg border border-cm-border text-cm-text placeholder-cm-muted/50 focus:outline-none focus:border-cm-cyan/50 focus:shadow-neon-cyan transition-all focus-ring"
                placeholder="TradingAce"
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-cm-muted text-xs font-semibold mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-invalid={!!error}
                className="w-full px-4 py-2.5 rounded-lg bg-cm-bg border border-cm-border text-cm-text placeholder-cm-muted/50 focus:outline-none focus:border-cm-cyan/50 focus:shadow-neon-cyan transition-all focus-ring"
                placeholder="trader@peak6.com"
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-cm-muted text-xs font-semibold mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                aria-invalid={!!error}
                className="w-full px-4 py-2.5 rounded-lg bg-cm-bg border border-cm-border text-cm-text placeholder-cm-muted/50 focus:outline-none focus:border-cm-cyan/50 focus:shadow-neon-cyan transition-all focus-ring"
                placeholder="Min. 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full py-3 rounded-lg bg-cm-cyan text-cm-bg font-bold text-sm hover:bg-cm-cyan/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus-ring"
            >
              {loading ? (
                <span className="animate-pulse">Creating account...</span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-cm-muted text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-cm-cyan hover:underline font-semibold focus-ring rounded">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
