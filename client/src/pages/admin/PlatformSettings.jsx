import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { adminApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { usePlatform } from "../../context/PlatformContext.jsx";
import useAsync from "../../lib/useAsync.js";
import { fmtDateTime } from "../../lib/format.js";
import { Button, ErrorState, Input, Notice, PageHeader, PageLoader, Panel, Select, Switch, Textarea, useFeedback } from "../../components/ui.jsx";

const randomCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("").replace(/(.{4})(?=.)/g, "$1-");
};

export default function PlatformSettings() {
  const { toast } = useFeedback();
  const { reloadPlatform } = usePlatform();
  const { data, loading, error, reload } = useAsync(async () => (await adminApi.settings()).data, []);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (data?.settings) {
      const s = data.settings;
      setForm({
        platformName: s.platformName,
        registrationOpen: s.registrationOpen,
        googleSignInEnabled: s.googleSignInEnabled,
        instructorSignupEnabled: s.instructorSignupEnabled,
        instructorSignupCode: s.instructorSignupCode || "",
        instructorsCanPublish: s.instructorsCanPublish,
        allowLateSubmissions: s.allowLateSubmissions,
        defaultQuizPassPercent: s.defaultQuizPassPercent,
        banner: { active: !!s.banner?.active, message: s.banner?.message || "", tone: s.banner?.tone || "info" },
      });
    }
  }, [data]);

  if (loading || (!form && !error)) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setBanner = (k, v) => setForm((f) => ({ ...f, banner: { ...f.banner, [k]: v } }));

  const save = async () => {
    setFormError("");
    setBusy(true);
    try {
      const { data: res } = await adminApi.saveSettings({ ...form, defaultQuizPassPercent: Number(form.defaultQuizPassPercent) });
      toast(res.message);
      await reloadPlatform();
      reload({ quiet: true });
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const meta = data.settings.updatedBy ? `Last changed by ${data.settings.updatedBy.name}, ${fmtDateTime(data.settings.updatedAt)}` : "Default settings";

  return (
    <>
      <PageHeader
        title="Platform settings"
        description="Switches that apply to everyone on the platform. Only super admins can see this page."
        actions={
          <Button variant="primary" onClick={save} loading={busy}>
            Save changes
          </Button>
        }
      />
      <div className="max-w-3xl space-y-6">
        {formError && <Notice tone="danger">{formError}</Notice>}

        <Panel title="General">
          <Input label="Platform name" value={form.platformName} onChange={(e) => set("platformName", e.target.value)} hint="Shown in the sidebar, sign-in pages and browser tab." />
        </Panel>

        <Panel title="Sign-up and sign-in" bodyClassName="px-5 py-1 divide-y divide-line">
          <Switch
            label="Open registration"
            description="Anyone can create a student account. Turn off to make accounts invite-only (you create them on the Users page)."
            checked={form.registrationOpen}
            onChange={(v) => set("registrationOpen", v)}
          />
          <Switch label="Google sign-in" description="Show 'Continue with Google' on the sign-in and sign-up pages." checked={form.googleSignInEnabled} onChange={(v) => set("googleSignInEnabled", v)} />
          <div className="py-3">
            <Switch
              label="Instructor self sign-up"
              description="People with the access code below can create their own instructor account."
              checked={form.instructorSignupEnabled}
              onChange={(v) => set("instructorSignupEnabled", v)}
            />
            {form.instructorSignupEnabled && (
              <div className="flex items-end gap-2 pb-1">
                <Input
                  label="Instructor access code"
                  value={form.instructorSignupCode}
                  onChange={(e) => set("instructorSignupCode", e.target.value)}
                  className="flex-1"
                  inputClassName="font-mono"
                  hint={!form.instructorSignupCode && data.envInstructorCode ? "Empty: the ADMIN_SIGNUP_CODE from the server's .env is used." : "At least 8 characters. Changing it stops the old code working immediately."}
                />
                <Button icon={RefreshCw} onClick={() => set("instructorSignupCode", randomCode())} className="mb-[22px]">
                  Generate
                </Button>
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Courses and grading" bodyClassName="px-5 py-1 divide-y divide-line">
          <Switch
            label="Instructors can publish their own courses"
            description="When off, instructors save courses as drafts and only a super admin can publish them."
            checked={form.instructorsCanPublish}
            onChange={(v) => set("instructorsCanPublish", v)}
          />
          <Switch
            label="Accept late submissions"
            description="When off, students can't submit after an assignment's deadline."
            checked={form.allowLateSubmissions}
            onChange={(v) => set("allowLateSubmissions", v)}
          />
          <div className="flex items-center justify-between gap-6 py-3">
            <div>
              <div className="text-sm font-medium">Default quiz pass mark</div>
              <div className="mt-0.5 text-[13px] text-fg-muted">Used for new modules. Instructors can change it per module.</div>
            </div>
            <div className="flex items-center gap-2">
              <Input type="number" min={0} max={100} value={form.defaultQuizPassPercent} onChange={(e) => set("defaultQuizPassPercent", e.target.value)} className="w-24" aria-label="Default pass mark" />
              <span className="text-sm text-fg-muted">%</span>
            </div>
          </div>
        </Panel>

        <Panel title="Site banner" description="A message shown at the top of every page, for everyone.">
          <div className="space-y-4">
            <div className="-mt-3">
              <Switch label="Show the banner" checked={form.banner.active} onChange={(v) => setBanner("active", v)} />
            </div>
            <Textarea label="Message" rows={2} maxLength={280} value={form.banner.message} onChange={(e) => setBanner("message", e.target.value)} placeholder="e.g. Ridgeline will be down for maintenance on Sunday 10–11 pm." />
            <Select label="Style" value={form.banner.tone} onChange={(e) => setBanner("tone", e.target.value)} selectClassName="w-48">
              <option value="info">Information (blue)</option>
              <option value="ok">Good news (green)</option>
              <option value="warn">Warning (amber)</option>
              <option value="danger">Urgent (red)</option>
            </Select>
          </div>
        </Panel>

        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-fg-subtle">{meta}</span>
          <Button variant="primary" onClick={save} loading={busy}>
            Save changes
          </Button>
        </div>
      </div>
    </>
  );
}
