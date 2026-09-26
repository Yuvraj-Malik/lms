import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Moon, Sun } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { getErrorMessage } from "../../api/client.js";
import { Input, Button, Alert, Divider } from "../../components/ui.jsx";
import { RidgelineMark } from "../../components/BrandLogo.jsx";

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
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
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
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
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden px-4 py-12">
      {/* Top right theme toggle */}
      <button
        onClick={toggleDark}
        type="button"
        aria-label="Toggle theme"
        className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-[6px] border border-border-subtle bg-bg-surface text-text-secondary transition-colors hover:bg-bg-surface-raised hover:text-text-primary"
      >
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-sm animate-fade-up">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-3 flex justify-center">
            <RidgelineMark size={36} />
          </div>
          <h1 className="type-h2 text-text-primary">
            Create an Account
          </h1>
          <p className="mt-1 type-body text-text-secondary">
            Register for Ridgeline institutional courses
          </p>
        </div>

        {/* Card */}
        <div className="rounded-[10px] border border-border-subtle bg-bg-surface p-6 shadow-card">
          {error && <Alert tone="danger" className="mb-4">{error}</Alert>}

          {/* Google first */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            className="flex w-full items-center justify-center gap-3 rounded-[6px] border border-border-default bg-bg-surface-raised py-2.5 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-bg-surface disabled:opacity-50"
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
              placeholder="e.g. Alex Chen"
            />
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@institution.edu"
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
            <label className="flex cursor-pointer items-center gap-2.5 rounded-[6px] border border-border-subtle bg-bg-surface-raised p-3 transition-colors hover:bg-bg-surface">
              <input
                type="checkbox"
                checked={asAdmin}
                onChange={(e) => setAsAdmin(e.target.checked)}
                className="h-4 w-4 rounded border-border-default text-primary-600 accent-primary-600"
              />
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-text-secondary" />
                <span className="type-body-sm text-text-secondary">
                  Register as instructor / administrator
                </span>
              </div>
            </label>

            {asAdmin && (
              <Input
                label="Administrator access code"
                required
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="Enter authorized code"
              />
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading || googleLoading}
              className="w-full"
            >
              {loading ? "Registering account…" : "Complete registration"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center type-body text-text-secondary">
          Already registered?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
