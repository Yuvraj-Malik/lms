import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { Input, Button, Alert, Card } from "../../components/ui.jsx";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md items-center px-4 py-10 sm:px-6">
      <Card className="w-full">
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-dark-ink">Reset your password</h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-dark-ink-soft">
          We'll send a reset link to your email.
        </p>

        {sent ? (
          <div className="mt-6 space-y-4">
            <Alert tone="pine">
              A password reset link has been sent to <strong>{email}</strong> if an account exists.
              Please check your inbox (and spam folder) and follow the instructions in the email.
            </Alert>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
            >
              Send to a different email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && <Alert>{error}</Alert>}
            <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-ink-soft dark:text-dark-ink-soft">
          <Link to="/login" className="font-medium text-pine dark:text-amber-light">
            Back to log in
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default ForgotPassword;
