import React, { useState } from "react";
import { User, Lock, Bell, Palette, Moon, Sun, Save, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { userApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { Card, Button, Input, Textarea, Alert } from "../../components/ui.jsx";

export default function StudentSettings() {
  const { user, setUser } = useAuth();
  const { dark, toggleDark } = useTheme();

  // Profile Form State
  const [name, setName] = useState(user?.name || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");

  // Password Form State
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    emailNotifications: user?.notificationPreferences?.emailNotifications ?? true,
    assignmentAlerts: user?.notificationPreferences?.assignmentAlerts ?? true,
    gradeAlerts: user?.notificationPreferences?.gradeAlerts ?? true,
  });
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifMsg, setNotifMsg] = useState("");
  const [notifErr, setNotifErr] = useState("");

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg("");
    setProfileErr("");
    setSavingProfile(true);

    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("department", department);
      fd.append("bio", bio);

      const res = await userApi.updateProfile(fd);
      setUser(res.data.user);
      setProfileMsg("Profile updated successfully.");
    } catch (err) {
      setProfileErr(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwMsg("");
    setPwErr("");

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwErr("New passwords do not match.");
      return;
    }

    setSavingPw(true);
    try {
      if (user?.hasPassword) {
        await userApi.changePassword({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        });
        setPwMsg("Password updated successfully.");
      } else {
        await userApi.createPassword({
          password: pwForm.newPassword,
        });
        setPwMsg("Password created successfully.");
        setUser({ ...user, hasPassword: true });
      }
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwErr(getErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  };

  const handleToggleNotif = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveNotifications = async () => {
    setNotifMsg("");
    setNotifErr("");
    setSavingNotif(true);

    try {
      const res = await userApi.updateNotificationPreferences(notifications);
      setUser(res.data.user);
      setNotifMsg("Notification preferences updated.");
    } catch (err) {
      setNotifErr(getErrorMessage(err));
    } finally {
      setSavingNotif(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-12">
      <div>
        <h1 className="type-display text-text-primary">
          Account Settings
        </h1>
        <p className="mt-1 type-body text-text-secondary">
          Profile information, academic credentials, security, and interface preferences
        </p>
      </div>

      {/* Profile Details (24px padding, 16px gap) */}
      <Card className="p-6">
        <div className="flex items-center gap-3.5 pb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-border-subtle bg-bg-surface-raised text-text-secondary">
            <User size={18} />
          </div>
          <div>
            <h2 className="type-h3 text-text-primary">
              Profile Information
            </h2>
            <p className="type-body-sm text-text-secondary">
              Update academic department and public institutional details
            </p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
          {profileErr && <Alert tone="danger">{profileErr}</Alert>}
          {profileMsg && <Alert tone="success">{profileMsg}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email Address"
              value={user?.email || ""}
              disabled
              hint="Managed by institutional directory."
            />
          </div>

          <div>
            <Input
              label="Department / Academic Track"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science & Engineering"
            />
          </div>

          <Textarea
            label="Academic Bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Brief description of your research focus or academic interests"
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" disabled={savingProfile}>
              <Save size={15} className="mr-1.5" />
              {savingProfile ? "Saving…" : "Save Profile"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Security / Password */}
      <Card className="p-6">
        <div className="flex items-center gap-3.5 pb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-border-subtle bg-bg-surface-raised text-text-secondary">
            <Lock size={18} />
          </div>
          <div>
            <h2 className="type-h3 text-text-primary">
              {user?.hasPassword ? "Change Password" : "Create Password"}
            </h2>
            <p className="type-body-sm text-text-secondary">
              {user?.hasPassword
                ? "Update your login credentials with a strong password"
                : "Add a password to enable email authentication alongside Google Sign-In"}
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
          {pwErr && <Alert tone="danger">{pwErr}</Alert>}
          {pwMsg && <Alert tone="success">{pwMsg}</Alert>}

          {user?.hasPassword && (
            <Input
              label="Current Password"
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              required
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="New Password"
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="secondary" disabled={savingPw}>
              <ShieldCheck size={15} className="mr-1.5" />
              {savingPw ? "Saving…" : user?.hasPassword ? "Update Password" : "Create Password"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Notification Preferences */}
      <Card className="p-6">
        <div className="flex items-center gap-3.5 pb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-border-subtle bg-bg-surface-raised text-text-secondary">
            <Bell size={18} />
          </div>
          <div>
            <h2 className="type-h3 text-text-primary">
              Notification Preferences
            </h2>
            <p className="type-body-sm text-text-secondary">
              Configure course communications and deadline alerts
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {notifErr && <Alert tone="danger">{notifErr}</Alert>}
          {notifMsg && <Alert tone="success">{notifMsg}</Alert>}

          <div className="divide-y divide-border-subtle">
            <div className="flex items-center justify-between py-3.5">
              <div>
                <p className="type-body font-medium text-text-primary">
                  Email Notifications
                </p>
                <p className="type-body-sm text-text-secondary">
                  Course announcements and direct instructor messages
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.emailNotifications}
                onChange={() => handleToggleNotif("emailNotifications")}
                className="h-4 w-4 rounded border-border-default text-primary-600 accent-primary-600"
              />
            </div>

            <div className="flex items-center justify-between py-3.5">
              <div>
                <p className="type-body font-medium text-text-primary">
                  Assignment Alerts
                </p>
                <p className="type-body-sm text-text-secondary">
                  Notifications when assignments are published or deadlines approach
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.assignmentAlerts}
                onChange={() => handleToggleNotif("assignmentAlerts")}
                className="h-4 w-4 rounded border-border-default text-primary-600 accent-primary-600"
              />
            </div>

            <div className="flex items-center justify-between py-3.5">
              <div>
                <p className="type-body font-medium text-text-primary">
                  Grade & Evaluation Alerts
                </p>
                <p className="type-body-sm text-text-secondary">
                  Alerts when an instructor reviews and scores your submission
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.gradeAlerts}
                onChange={() => handleToggleNotif("gradeAlerts")}
                className="h-4 w-4 rounded border-border-default text-primary-600 accent-primary-600"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveNotifications}
              variant="primary"
              disabled={savingNotif}
            >
              <Save size={15} className="mr-1.5" />
              {savingNotif ? "Saving…" : "Save Preferences"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Appearance Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3.5 pb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-border-subtle bg-bg-surface-raised text-text-secondary">
            <Palette size={18} />
          </div>
          <div>
            <h2 className="type-h3 text-text-primary">
              Display & Theme
            </h2>
            <p className="type-body-sm text-text-secondary">
              Theme mode selection for interface contrast
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="type-body font-medium text-text-primary">
              Current Theme: <span className="capitalize">{dark ? "Dark" : "Light"}</span>
            </p>
            <p className="type-body-sm text-text-secondary">
              {dark ? "Elevated slate dark theme active" : "Clean daylight theme active"}
            </p>
          </div>
          <button
            onClick={toggleDark}
            className="flex items-center gap-2 rounded-[6px] border border-border-default bg-bg-surface-raised px-4 py-2 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-bg-surface"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? "Switch to Light" : "Switch to Dark"}
          </button>
        </div>
      </Card>
    </div>
  );
}
