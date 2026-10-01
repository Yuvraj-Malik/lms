import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { authApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import AuthLayout from "../../components/AuthLayout.jsx";
import { Button, Input, Notice, useFeedback } from "../../components/ui.jsx";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useFeedback();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const mismatch = confirm && password !== confirm;

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return setError("Use at least 6 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setError("");
    setBusy(true);
    try {
      await authApi.resetPassword(token, password);
      toast("Password updated. Sign in with your new password.");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Choose a new password"
      footer={
        <Link to="/forgot-password" className="text-fg-muted hover:text-fg">
          Need a new link?
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Notice tone="danger">{error}</Notice>}
        <Input label="New password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} hint="At least 6 characters." autoFocus />
        <Input label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={mismatch ? "Passwords don't match." : ""} />
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy}>
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
