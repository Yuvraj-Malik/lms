import { useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { adminApi, submissionApi } from "../api/endpoints.js";
import { getErrorMessage } from "../api/client.js";
import { fmtDateTime } from "../lib/format.js";
import { Avatar, Button, Dialog, Input, Notice, StatusBadge, Textarea, useFeedback } from "./ui.jsx";

const TYPE_LABEL = { text: "Text answer", file: "File upload", github: "GitHub repository", drive: "Google Drive", url: "Project link" };

// View one submission, give marks and feedback, or reopen it for the student
export default function GradeDialog({ submission, onClose, onSaved, onReopened }) {
  const { toast, confirm } = useFeedback();
  const max = submission.assignment?.maximumMarks ?? 100;
  const [marks, setMarks] = useState(submission.marks ?? "");
  const [feedback, setFeedback] = useState(submission.feedback || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const n = Number(marks);
    if (marks === "" || !Number.isFinite(n) || n < 0 || n > max) return setError(`Enter marks between 0 and ${max}.`);
    setBusy(true);
    setError("");
    try {
      const { data } = await submissionApi.grade(submission._id, { marks: n, feedback });
      toast(`Graded ${submission.student?.name}'s work.`);
      onSaved({ ...submission, ...data.submission, assignment: submission.assignment });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const reopen = async () => {
    const ok = await confirm({
      title: "Reopen this submission?",
      description: "The current submission and its grade are deleted so the student can submit again. They'll get a notification.",
      confirmLabel: "Reopen",
      danger: true,
    });
    if (!ok) return;
    try {
      await adminApi.reopenSubmission(submission._id);
      toast("Submission reopened.");
      onReopened?.(submission._id);
    } catch (err) {
      toast(getErrorMessage(err), "danger");
    }
  };

  const s = submission;
  return (
    <Dialog
      open
      onClose={onClose}
      width={640}
      title={s.assignment?.title || "Submission"}
      description={s.assignment?.course?.title}
      footer={
        <>
          <Button variant="danger-ghost" className="mr-auto" onClick={reopen}>
            Reopen for resubmission
          </Button>
          <Button onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={save} loading={busy}>
            {s.status === "graded" ? "Update grade" : "Save grade"}
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-3">
        <Avatar user={s.student} size={36} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{s.student?.name}</div>
          <div className="truncate text-[13px] text-fg-muted">{s.student?.email}</div>
        </div>
        <StatusBadge status={s.status} />
      </div>
      <div className="mt-1 pl-12 text-xs text-fg-muted">
        {TYPE_LABEL[s.submissionType]} · submitted {fmtDateTime(s.submissionDate)}
      </div>

      <div className="mt-4 rounded-md border border-line bg-subtle/60 p-3">
        {s.submissionType === "text" && <p className="prose-notes max-h-72 overflow-y-auto text-sm">{s.textContent}</p>}
        {s.submissionType === "file" && (
          <a href={submissionApi.fileUrl(s._id)} className="inline-flex items-center gap-2 text-sm font-medium text-accent-fg hover:underline">
            <Download size={15} /> {s.fileOriginalName || "Download file"}
          </a>
        )}
        {["github", "drive", "url"].includes(s.submissionType) && (
          <a href={s.submissionLink} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-2 text-sm font-medium text-accent-fg hover:underline">
            <ExternalLink size={15} className="shrink-0" /> <span className="truncate">{s.submissionLink}</span>
          </a>
        )}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[140px_1fr]">
        <Input label={`Marks (out of ${max})`} type="number" min={0} max={max} value={marks} onChange={(e) => setMarks(e.target.value)} inputClassName="tabular" />
        <Textarea label="Feedback" rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} hint="The student sees this with their grade." />
      </div>
      {error && <Notice tone="danger" className="mt-4">{error}</Notice>}
    </Dialog>
  );
}
