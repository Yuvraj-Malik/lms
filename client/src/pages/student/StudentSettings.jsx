import React, { useState } from "react";
import { 
  User, 
  Lock, 
  Bell, 
  Palette, 
  Check, 
  Moon, 
  Sun, 
  ShieldCheck, 
  Save 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { userApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { Card, Input, Textarea, Button, Alert } from "../../components/ui.jsx";

export default function StudentSettings() {
  const { user, setUser } = useAuth();
  const { dark, toggleDark } = useTheme();

  // Profile State
  const [name, setName] = useState(user?.name || "");
  const [department, setDepartment] = useState(user?.department || "Computer Science & Engineering");
  const [bio, setBio] = useState(user?.bio || "");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password State
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState({
    emailNotifications: user?.notificationPreferences?.emailNotifications ?? true,
    assignmentAlerts: user?.notificationPreferences?.assignmentAlerts ?? true,
    gradeAlerts: user?.notificationPreferences?.gradeAlerts ?? true,
  });
  const [notifMsg, setNotifMsg] = useState("");
  const [notifErr, setNotifErr] = useState("");
  const [savingNotif, setSavingNotif] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileErr("");
    setProfileMsg("");
    setSavingProfile(true);

    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("department", department.trim());
      fd.append("bio", bio.trim());

      const res = await userApi.updateProfile(fd);
      setUser(res.data.user);
      setProfileMsg("Profile details saved successfully.");
    } catch (err) {
      setProfileErr(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwErr("");
    setPwMsg("");

    if (pwForm.newPassword.length < 6) {
      setPwErr("New password must be at least 6 characters.");
      return;
    }

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwErr("New passwords do not match.");
      return;
    }

    setSavingPw(true);
    try {
      await userApi.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg("Your password has been updated.");
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
    setNotifErr("");
    setNotifMsg("");
    setSavingNotif(true);

    try {
      const fd = new FormData();
      fd.append("notificationPreferences", JSON.stringify(notifications));
      const res = await userApi.updateProfile(fd);
      setUser(res.data.user);
      setNotifMsg("Notification preferences updated.");
    } catch (err) {
      setNotifErr(getErrorMessage(err));
    } finally {
      setSavingNotif(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink dark:text-dark-ink sm:text-3xl">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-dark-ink-soft">
          Manage your personal profile, notification preferences, security credentials, and app display.
        </p>
      </div>

      {/* Profile Details */}
      <Card>
        <div className="flex items-center gap-3 border-b border-border/70 pb-4 dark:border-dark-border/70">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pine/10 text-pine dark:bg-pine-light/10 dark:text-pine-light">
            <User size={20} />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-ink dark:text-dark-ink">
              Profile Information
            </h2>
            <p className="text-xs text-ink-soft dark:text-dark-ink-soft">
              Update your basic account details and academic track.
            </p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
          {profileErr && <Alert>{profileErr}</Alert>}
          {profileMsg && <Alert tone="pine">{profileMsg}</Alert>}

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
              className="bg-surface-sunken opacity-70 cursor-not-allowed dark:bg-dark-surface-sunken"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink dark:text-dark-ink">
              Department / Academic Track
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science & Engineering, Full Stack Web Development"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-pine focus:outline-none dark:border-dark-border dark:bg-dark-surface dark:text-dark-ink"
            />
          </div>

          <Textarea
            label="Short Bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell fellow students and instructors about yourself and your career goals..."
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" tone="pine" disabled={savingProfile}>
              <Save size={16} className="mr-1.5" />
              {savingProfile ? "Saving..." : "Save Profile Details"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Password Change */}
      <Card>
        <div className="flex items-center gap-3 border-b border-border/70 pb-4 dark:border-dark-border/70">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/10 text-amber dark:bg-amber-light/10 dark:text-amber-light">
            <Lock size={20} />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-ink dark:text-dark-ink">
              Change Password
            </h2>
            <p className="text-xs text-ink-soft dark:text-dark-ink-soft">
              Ensure your account stays secure by choosing a strong password.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
          {pwErr && <Alert>{pwErr}</Alert>}
          {pwMsg && <Alert tone="pine">{pwMsg}</Alert>}

          <Input
            label="Current Password"
            type="password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            required
          />

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
            <Button type="submit" tone="secondary" disabled={savingPw}>
              <ShieldCheck size={16} className="mr-1.5" />
              {savingPw ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <div className="flex items-center justify-between border-b border-border/70 pb-4 dark:border-dark-border/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-ink dark:text-dark-ink">
                Notification Preferences
              </h2>
              <p className="text-xs text-ink-soft dark:text-dark-ink-soft">
                Choose what communications and alerts you receive.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {notifErr && <Alert>{notifErr}</Alert>}
          {notifMsg && <Alert tone="pine">{notifMsg}</Alert>}

          <div className="divide-y divide-border/60 dark:divide-dark-border/60">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-ink dark:text-dark-ink">
                  Email Notifications
                </p>
                <p className="text-xs text-ink-soft dark:text-dark-ink-soft">
                  Receive email notifications for course announcements and direct messages.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.emailNotifications}
                onChange={() => handleToggleNotif("emailNotifications")}
                className="h-4 w-4 rounded border-border text-pine focus:ring-pine"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-ink dark:text-dark-ink">
                  Assignment Alerts
                </p>
                <p className="text-xs text-ink-soft dark:text-dark-ink-soft">
                  Get notified when a new assignment is posted or deadlines are near.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.assignmentAlerts}
                onChange={() => handleToggleNotif("assignmentAlerts")}
                className="h-4 w-4 rounded border-border text-pine focus:ring-pine"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-ink dark:text-dark-ink">
                  Grade & Feedback Alerts
                </p>
                <p className="text-xs text-ink-soft dark:text-dark-ink-soft">
                  Instant alerts whenever an instructor reviews and scores your submission.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.gradeAlerts}
                onChange={() => handleToggleNotif("gradeAlerts")}
                className="h-4 w-4 rounded border-border text-pine focus:ring-pine"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveNotifications}
              tone="pine"
              disabled={savingNotif}
            >
              <Save size={16} className="mr-1.5" />
              {savingNotif ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Theme / Appearance Settings */}
      <Card>
        <div className="flex items-center gap-3 border-b border-border/70 pb-4 dark:border-dark-border/70">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
            <Palette size={20} />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-ink dark:text-dark-ink">
              Appearance & Theme
            </h2>
            <p className="text-xs text-ink-soft dark:text-dark-ink-soft">
              Customize the look and feel of Ridgeline LMS for your study sessions.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink dark:text-dark-ink">
              Theme Mode: <span className="capitalize">{dark ? "Dark Theme" : "Light Theme"}</span>
            </p>
            <p className="text-xs text-ink-soft dark:text-dark-ink-soft">
              Dark mode reduces eye strain during late-night studying.
            </p>
          </div>
          <button
            onClick={toggleDark}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface-sunken px-4 py-2 text-sm font-medium text-ink shadow-sm transition-all hover:bg-surface-raised dark:border-dark-border dark:bg-dark-surface-sunken dark:text-dark-ink"
          >
            {dark ? <Sun size={18} className="text-amber" /> : <Moon size={18} className="text-pine" />}
            {dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </button>
        </div>
      </Card>
    </div>
  );
}
