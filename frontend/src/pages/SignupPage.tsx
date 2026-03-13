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
        <div className="text-center mb-7">
          <h1 className="text-5xl font-bold mb-1">
            <span className="text-cm-text">The </span>
            <span className="text-cm-primary">
              Pit
            </span>
          </h1>
          <p className="text-cm-muted text-base">Create your profile and start leveling up.</p>
        </div>

        {/* Card */}
        <div className="cm-surface-raised p-8">
          <h2 className="text-2xl font-bold text-cm-text mb-6">Sign Up</h2>

          {error && (
            <div role="alert" aria-live="assertive" className="mb-4 p-3 rounded-md bg-cm-red/10 border border-cm-red/30 text-cm-red text-sm">
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
                className="cm-input"
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
                className="cm-input"
                placeholder="trader@example.com"
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
                className="cm-input"
                placeholder="Min. 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="cm-btn-primary-lg w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <Link to="/login" className="text-cm-primary hover:underline font-semibold transition-all duration-300 focus-ring rounded">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
