import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import AuthLayout from "../../components/AuthLayout.jsx";
import { Button, Input, Notice } from "../../components/ui.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a link to choose a new password."
      footer={
        <Link to="/login" className="text-fg-muted hover:text-fg">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <Notice tone="ok" title="Check your inbox">
          If an account exists for {email}, a reset link is on its way. It expires in 30 minutes.
        </Notice>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <Notice tone="danger">{error}</Notice>}
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy} disabled={!email}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
