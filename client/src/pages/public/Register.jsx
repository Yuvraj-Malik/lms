import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth, homePathFor } from "../../context/AuthContext.jsx";
import { getErrorMessage } from "../../api/client.js";
import AuthLayout from "../../components/AuthLayout.jsx";
import GoogleButton from "../../components/GoogleButton.jsx";
import { Button, Input, Notice } from "../../components/ui.jsx";
import { usePlatform } from "../../context/PlatformContext.jsx";

export default function Register() {
  const { user, register, loginWithGoogle } = useAuth();
  const { platform } = usePlatform();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", adminCode: "" });
  const [instructor, setInstructor] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homePathFor(user)} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (form.password.length < 6) e.password = "Use at least 6 characters.";
    if (instructor && !form.adminCode.trim()) e.adminCode = "Enter the access code from your administrator.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setBusy(true);
    try {
      const u = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        ...(instructor ? { role: "admin", adminCode: form.adminCode.trim() } : {}),
      });
      navigate(homePathFor(u), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Enroll in courses, track progress and submit your work in one place."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-fg underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {!platform.registrationOpen && !instructor && (
        <Notice tone="warn" title="Registration is closed" className="mb-5">
          New student accounts are turned off right now. Contact the administrator.
        </Notice>
      )}
      {!instructor && platform.registrationOpen && <GoogleButton label="Sign up with Google" onSuccess={async () => navigate(homePathFor(await loginWithGoogle()))} onError={setError} />}
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Notice tone="danger">{error}</Notice>}
        <Input label="Full name" autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} autoFocus />
        <Input label="Email" type="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={set("password")}
          error={errors.password}
          hint="At least 6 characters."
        />
        {instructor && (
          <Input
            label="Instructor access code"
            value={form.adminCode}
            onChange={set("adminCode")}
            error={errors.adminCode}
            hint="Instructors get a code from the platform's super admin."
          />
        )}
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy} disabled={!instructor && !platform.registrationOpen}>
          {instructor ? "Create instructor account" : "Create account"}
        </Button>
        {platform.instructorSignupEnabled && <button type="button" onClick={() => setInstructor((v) => !v)} className="w-full text-center text-[13px] text-fg-muted hover:text-fg">
          {instructor ? "Sign up as a student instead" : "I'm an instructor"}
        </button>}
      </form>
    </AuthLayout>
  );
}
