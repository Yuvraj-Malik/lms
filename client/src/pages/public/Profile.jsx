import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { userApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { Input, Textarea, Button, Alert, Card } from "../../components/ui.jsx";

const Profile = () => {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileErr("");
    setProfileMsg("");
    setSavingProfile(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("bio", bio);
      if (avatarFile) fd.append("avatar", avatarFile);
      const { data } = await userApi.updateProfile(fd);
      setUser(data.user);
      setProfileMsg("Profile updated.");
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
    setSavingPw(true);
    try {
      await userApi.changePassword(pwForm);
      setPwMsg("Password changed.");
      setPwForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setPwErr(getErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink dark:text-dark-ink">Profile</h1>

      <Card className="mt-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-pine/10 text-xl font-semibold text-pine dark:bg-pine-light/15 dark:text-pine-light">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              user.name?.[0]?.toUpperCase()
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-ink dark:text-dark-ink">{user.email}</p>
            <p className="text-xs capitalize text-ink-soft dark:text-dark-ink-soft">{user.role}</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
          {profileErr && <Alert>{profileErr}</Alert>}
          {profileMsg && <Alert tone="pine">{profileMsg}</Alert>}
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea label="Bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink dark:text-dark-ink">Avatar</span>
            <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0])} className="text-sm" />
          </label>
          <Button type="submit" disabled={savingProfile}>
            {savingProfile ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </Card>

      <Card className="mt-6">
        <h2 className="font-display text-lg font-semibold text-ink dark:text-dark-ink">Change password</h2>
        <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
          {pwErr && <Alert>{pwErr}</Alert>}
          {pwMsg && <Alert tone="pine">{pwMsg}</Alert>}
          <Input
            label="Current password"
            type="password"
            required
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
          />
          <Input
            label="New password"
            type="password"
            required
            minLength={6}
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
          />
          <Button type="submit" disabled={savingPw}>
            {savingPw ? "Updating…" : "Change password"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Profile;
