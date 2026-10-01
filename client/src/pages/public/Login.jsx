import { useState } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth, homePathFor } from "../../context/AuthContext.jsx";
import { getErrorMessage } from "../../api/client.js";
import AuthLayout from "../../components/AuthLayout.jsx";
import GoogleButton from "../../components/GoogleButton.jsx";
import { Button, Input, Notice } from "../../components/ui.jsx";

export default function Login() {
  const { user, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homePathFor(user)} replace />;

  const goNext = (u) => {
    const from = location.state?.from?.pathname;
    const allowed = from && (u.role === "admin" ? from.startsWith("/admin") : from.startsWith("/dashboard"));
    navigate(allowed ? from : homePathFor(u), { replace: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      goNext(await login(form.email.trim(), form.password));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Pick up where you left off."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="font-medium text-fg underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <GoogleButton onSuccess={async () => goNext(await loginWithGoogle())} onError={setError} />
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Notice tone="danger">{error}</Notice>}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          autoFocus
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          aside={
            <Link to="/forgot-password" className="text-[13px] text-fg-muted hover:text-fg">
              Forgot password?
            </Link>
          }
        />
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy} disabled={!form.email || !form.password}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
