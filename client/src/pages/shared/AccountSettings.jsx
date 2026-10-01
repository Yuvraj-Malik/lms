import { useRef, useState } from "react";
import { userApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { Avatar, Button, Input, Notice, PageHeader, Panel, Segmented, Switch, Textarea, useFeedback } from "../../components/ui.jsx";

const ProfileForm = () => {
  const { user, setUser } = useAuth();
  const { toast } = useFeedback();
  const fileRef = useRef(null);
  const [form, setForm] = useState({ name: user.name || "", department: user.department || "", bio: user.bio || "" });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const save = async (e, extra = {}) => {
    e?.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries({ ...form, ...extra }).forEach(([k, v]) => fd.append(k, v));
      if (avatar) fd.append("avatar", avatar);
      const { data } = await userApi.update(fd);
      setUser(data.user);
      setAvatar(null);
      setPreview(null);
      toast("Profile saved.");
    } catch (err) {
      toast(getErrorMessage(err), "danger");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="Profile" description="Shown to instructors and in course discussions.">
      <form onSubmit={save} className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar user={{ ...user, avatar: preview || user.avatar }} size={56} />
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setAvatar(f);
                setPreview(URL.createObjectURL(f));
              }
            }}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => fileRef.current?.click()}>
              {user.avatar ? "Change photo" : "Upload photo"}
            </Button>
            {user.avatar && !preview && (
              <Button size="sm" variant="ghost" onClick={() => save(null, { removeAvatar: "true" })}>
                Remove
              </Button>
            )}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" value={user.email} disabled hint="Contact a super admin to change your email." />
        </div>
        <Input label="Department or programme" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
        <Textarea label="Bio" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} hint="A sentence or two about you." />
        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={busy}>
            Save profile
          </Button>
        </div>
      </form>
    </Panel>
  );
};

const PasswordForm = () => {
  const { user, setUser } = useAuth();
  const { toast } = useFeedback();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const creating = !user.hasPassword;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.newPassword.length < 6) return setError("New password must be at least 6 characters.");
    if (form.newPassword !== form.confirm) return setError("The new passwords don't match.");
    setBusy(true);
    try {
      const { data } = await userApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setUser({ ...user, hasPassword: true });
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      toast(data.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      title={creating ? "Create a password" : "Password"}
      description={creating ? "You signed up with Google. Add a password to also sign in with your email." : "Use at least 6 characters."}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Notice tone="danger">{error}</Notice>}
        {!creating && (
          <Input label="Current password" type="password" autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="New password" type="password" autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
          <Input label="Confirm new password" type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={busy}>
            {creating ? "Create password" : "Change password"}
          </Button>
        </div>
      </form>
    </Panel>
  );
};

const NotificationPrefs = () => {
  const { user, setUser } = useAuth();
  const { toast } = useFeedback();
  const prefs = user.notificationPreferences || {};

  const update = async (key, value) => {
    const next = { ...prefs, [key]: value };
    setUser({ ...user, notificationPreferences: next });
    try {
      const fd = new FormData();
      fd.append("notificationPreferences", JSON.stringify(next));
      const { data } = await userApi.update(fd);
      setUser(data.user);
    } catch (err) {
      setUser(user);
      toast(getErrorMessage(err), "danger");
    }
  };

  const isStudent = user.role === "student";
  return (
    <Panel title="Notifications" bodyClassName="px-5 py-1 divide-y divide-line">
      <Switch
        label="Email me as well"
        description="Announcements, new assignments and grades also arrive in your inbox. In-app notifications are always on."
        checked={prefs.emailNotifications !== false}
        onChange={(v) => update("emailNotifications", v)}
      />
      {isStudent && (
        <>
          <Switch label="New assignment emails" description="When an instructor posts work in one of your courses." checked={prefs.assignmentAlerts !== false} onChange={(v) => update("assignmentAlerts", v)} />
          <Switch label="Grade emails" description="When a submission of yours is graded." checked={prefs.gradeAlerts !== false} onChange={(v) => update("gradeAlerts", v)} />
        </>
      )}
    </Panel>
  );
};

const Appearance = () => {
  const { dark, setTheme, mode } = useTheme();
  return (
    <Panel title="Appearance">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-fg-muted">Currently using the {dark ? "dark" : "light"} theme.</div>
        <Segmented
          value={mode}
          onChange={setTheme}
          options={[
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
      </div>
    </Panel>
  );
};

export default function AccountSettings() {
  return (
    <>
      <PageHeader title="Account settings" />
      <div className="max-w-3xl space-y-6">
        <ProfileForm />
        <PasswordForm />
        <NotificationPrefs />
        <Appearance />
      </div>
    </>
  );
}
