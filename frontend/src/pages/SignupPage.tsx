import { useState, FormEvent, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

interface InvitePreview {
  org_slug: string;
  org_name: string;
  email: string;
  role: string;
  expires_at: string;
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite") || "";
  const { signup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!inviteToken) {
      setInviteLoading(false);
      return;
    }
    api.get(`/auth/invite/${inviteToken}`)
      .then((res) => {
        setInvite(res.data);
        setEmail(res.data.email);
      })
      .catch((err) => {
        const detail = err?.response?.data?.detail || "Invalid invite link.";
        setError(detail);
      })
      .finally(() => setInviteLoading(false));
  }, [inviteToken]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(email, password, displayName, inviteToken);
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
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cm-primary to-cm-mint flex items-center justify-center">
              <span className="text-cm-bg text-xl font-extrabold leading-none">P</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight uppercase text-cm-text">
              THE PIT
            </h1>
          </div>
          <p className="text-cm-muted text-sm">Create your trading profile</p>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-cm-border bg-cm-card p-8">
          <h2 className="text-xl font-extrabold tracking-tight text-cm-text mb-6">Sign Up</h2>

          {!inviteToken && !inviteLoading && (
            <div role="alert" aria-live="polite" className="mb-4 p-3 rounded-md bg-cm-yellow/10 border border-cm-yellow/30 text-cm-yellow text-sm">
              Signups are invite-only. Ask your admin for an invite link.
            </div>
          )}

          {invite && (
            <div className="mb-4 p-3 rounded-md bg-cm-primary/10 border border-cm-primary/30 text-sm">
              <div className="text-cm-text font-semibold">Invited to {invite.org_name}</div>
              <div className="text-cm-muted">Role: {invite.role}</div>
            </div>
          )}

          {error && (
            <div role="alert" aria-live="assertive" className="mb-4 p-3 rounded-md bg-cm-red/10 border border-cm-red/30 text-cm-red text-sm">
              {error}
            </div>
          )}

          {inviteToken && !inviteLoading && (
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
                className="w-full px-4 py-2.5 rounded-lg bg-cm-bg border border-cm-border text-cm-text placeholder-cm-muted/50 focus:outline-none focus:border-cm-primary/50 transition-all duration-300 focus-ring"
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
                className="w-full px-4 py-2.5 rounded-lg bg-cm-bg border border-cm-border text-cm-text placeholder-cm-muted/50 focus:outline-none focus:border-cm-primary/50 transition-all duration-300 focus-ring"
                placeholder="trader@example.com"
                readOnly={!!invite}
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
                className="w-full px-4 py-2.5 rounded-lg bg-cm-bg border border-cm-border text-cm-text placeholder-cm-muted/50 focus:outline-none focus:border-cm-primary/50 transition-all duration-300 focus-ring"
                placeholder="Min. 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!error}
              aria-busy={loading}
              className="w-full py-3 rounded-lg bg-cm-primary text-cm-bg font-bold text-sm hover:bg-cm-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 focus-ring"
            >
              {loading ? (
                <span className="animate-pulse">Creating account...</span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
          )}

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
