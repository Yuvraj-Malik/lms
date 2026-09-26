import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { Input, Button, Alert, Card } from "../../components/ui.jsx";
import { RidgelineMark } from "../../components/BrandLogo.jsx";

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
      <Card className="w-full p-6">
        <div className="mb-4">
          <RidgelineMark size={28} />
        </div>
        <h1 className="type-h2 text-text-primary">Reset your password</h1>
        <p className="mt-1 type-body text-text-secondary">
          Enter your institutional email to receive recovery instructions.
        </p>

        {sent ? (
          <div className="mt-6 space-y-4">
            <Alert tone="success">
              A password reset link has been dispatched to <strong>{email}</strong> if a corresponding record exists. Please check your institutional inbox.
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
            {error && <Alert tone="danger">{error}</Alert>}
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@institution.edu"
            />
            <Button type="submit" variant="primary" disabled={loading} className="w-full">
              {loading ? "Sending link…" : "Send recovery link"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center type-body text-text-secondary">
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
            Return to sign in
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default ForgotPassword;
