import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Moon, Sun } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { getErrorMessage } from "../../api/client.js";
import { Input, Button, Alert, Divider } from "../../components/ui.jsx";

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const Logo = () => (
  <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
    <rect width="28" height="28" rx="7" fill="#166534" />
    <path d="M6 20 L11 11 L14.5 16.5 L18 9 L22 20 Z" fill="white" opacity="0.9" />
    <path d="M6 20 L11 11 L14.5 16.5 L12 20 Z" fill="#22c55e" />
  </svg>
);

const Register = () => {
  const { register, loginWithGoogle } = useAuth();
  const { dark, toggleDark } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [asAdmin, setAsAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = { ...form };
      if (asAdmin) {
        payload.role = "admin";
        payload.adminCode = adminCode;
      }
      const user = await register(payload);
      navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        setError("Google sign-up was cancelled.");
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden px-4 py-8">
      {/* Top right theme toggle */}
      <button
        onClick={toggleDark}
        type="button"
        aria-label="Toggle theme"
        className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-raised text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink dark:border-dark-border dark:bg-dark-surface-raised dark:text-dark-ink-soft dark:hover:bg-dark-surface-elevated dark:hover:text-dark-ink"
      >
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-sm animate-fade-up">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-3 flex justify-center">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-dark-ink">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-ink-soft dark:text-dark-ink-soft">
            Start learning on Ridgeline today
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-surface-raised p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface-raised">
          {error && <Alert tone="clay" className="mb-4">{error}</Alert>}

          {/* Google first */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface-raised py-2.5 text-sm font-medium text-ink shadow-sm transition-colors hover:bg-surface-sunken disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface-raised dark:text-dark-ink dark:hover:bg-dark-surface-elevated"
          >
            <GoogleIcon />
            {googleLoading ? "Connecting…" : "Sign up with Google"}
          </button>

          <Divider label="or" className="my-5" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              autoComplete="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Alex Johnson"
            />
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 6 characters"
              hint="Use at least 6 characters."
            />

            {/* Admin toggle */}
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border p-3 transition-colors hover:bg-surface-sunken dark:border-dark-border dark:hover:bg-dark-surface-elevated">
              <input
                type="checkbox"
                checked={asAdmin}
                onChange={(e) => setAsAdmin(e.target.checked)}
                className="h-4 w-4 rounded border-border text-pine accent-pine"
              />
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-ink-soft dark:text-dark-ink-soft" />
                <span className="text-sm text-ink-soft dark:text-dark-ink-soft">
                  Registering as an admin
                </span>
              </div>
            </label>

            {asAdmin && (
              <Input
                label="Admin signup code"
                required
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="Enter the admin code"
              />
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading || googleLoading}
              className="w-full"
            >
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink-soft dark:text-dark-ink-soft">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-pine hover:text-pine-light dark:text-pine-lighter"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
