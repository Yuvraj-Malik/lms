import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { Input, Button, Alert, Card } from "../../components/ui.jsx";
import { RidgelineMark } from "../../components/BrandLogo.jsx";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
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
        <h1 className="type-h2 text-text-primary">Set a new password</h1>
        <p className="mt-1 type-body text-text-secondary">
          Enter and verify your new credential password.
        </p>

        {done ? (
          <Alert tone="success" className="mt-6">
            Password updated successfully. Redirecting to login…
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && <Alert tone="danger">{error}</Alert>}
            <Input
              label="New password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <Input
              label="Confirm new password"
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
            />
            <Button type="submit" variant="primary" disabled={loading} className="w-full">
              {loading ? "Updating…" : "Update password"}
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

export default ResetPassword;
