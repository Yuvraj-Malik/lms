import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, ExternalLink, Upload } from "lucide-react";
import { assignmentApi, submissionApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import useAsync from "../../lib/useAsync.js";
import { assignmentState, dueLabel, fmtDateTime } from "../../lib/format.js";
import { Button, ErrorState, Input, Notice, PageHeader, PageLoader, Panel, Segmented, StatusBadge, Textarea, cx, useFeedback } from "../../components/ui.jsx";

const TYPES = [
  { value: "text", label: "Text" },
  { value: "file", label: "File" },
  { value: "github", label: "GitHub" },
  { value: "drive", label: "Drive" },
  { value: "url", label: "Link" },
];
const LINK_HINT = {
  github: ["Repository link", "https://github.com/you/project"],
  drive: ["Google Drive link", "https://drive.google.com/…  (set sharing to 'Anyone with the link')"],
  url: ["Project link", "https://your-project.netlify.app"],
};

const SubmissionView = ({ s }) => {
  if (s.submissionType === "text") return <p className="prose-notes rounded-md bg-subtle px-3 py-2.5 text-sm">{s.textContent}</p>;
  if (s.submissionType === "file")
    return (
      <a href={submissionApi.fileUrl(s._id)} className="inline-flex items-center gap-2 text-sm font-medium text-accent-fg hover:underline">
        <Download size={15} /> {s.fileOriginalName || "Download file"}
      </a>
    );
  return (
    <a href={s.submissionLink} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-2 text-sm font-medium text-accent-fg hover:underline">
      <ExternalLink size={15} className="shrink-0" /> <span className="truncate">{s.submissionLink}</span>
    </a>
  );
};

export default function AssignmentDetail() {
  const { id } = useParams();
  const { toast } = useFeedback();
  const fileInput = useRef(null);
  const { data, loading, error, reload, setData } = useAsync(async () => (await assignmentApi.get(id)).data, [id]);
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState("text");
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState(null);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { assignment, mySubmission } = data;
  const state = assignmentState(assignment, mySubmission);
  const overdue = new Date(assignment.deadline) < new Date();
  const showForm = !mySubmission || (editing && mySubmission.status !== "graded");

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    const fd = new FormData();
    fd.append("submissionType", type);
    if (type === "text") {
      if (!text.trim()) return setFormError("Write your answer before submitting.");
      fd.append("textContent", text.trim());
    } else if (type === "file") {
      if (!file) return setFormError("Choose a file to upload.");
      fd.append("file", file);
    } else {
      if (!/^https?:\/\/\S+$/i.test(link.trim())) return setFormError("Paste a full link starting with https://");
      fd.append("submissionLink", link.trim());
    }
    setBusy(true);
    try {
      const { data: res } = await submissionApi.submit(assignment._id, fd);
      setData((d) => ({ ...d, mySubmission: res.submission }));
      setEditing(false);
      setFile(null);
      toast(mySubmission ? "Submission updated." : "Submitted. Your instructor has been notified.");
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const startEdit = () => {
    setType(mySubmission.submissionType);
    setText(mySubmission.textContent || "");
    setLink(mySubmission.submissionLink || "");
    setEditing(true);
  };

  return (
    <>
      <PageHeader back={{ to: "/dashboard/assignments", label: "Assignments" }} eyebrow={assignment.course?.title} title={assignment.title} />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Panel title="Brief">
            {assignment.description && <p className="prose-notes text-sm">{assignment.description}</p>}
            {assignment.instructions && (
              <>
                <h3 className="mb-1.5 mt-5 text-sm font-semibold">Instructions</h3>
                <p className="prose-notes text-sm text-fg-muted">{assignment.instructions}</p>
              </>
            )}
            {!assignment.description && !assignment.instructions && <p className="text-sm text-fg-muted">No extra details were provided.</p>}
          </Panel>

          {mySubmission && !editing && (
            <Panel
              title="Your submission"
              description={`Submitted ${fmtDateTime(mySubmission.submissionDate)}`}
              actions={
                mySubmission.status !== "graded" && (
                  <Button size="sm" onClick={startEdit}>
                    Replace submission
                  </Button>
                )
              }
            >
              <SubmissionView s={mySubmission} />
              {mySubmission.status === "graded" && (
                <div className="mt-5 border-t border-line pt-4">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-semibold">Grade</h3>
                    <span className="tabular text-lg font-semibold">
                      {mySubmission.marks}
                      <span className="text-sm font-normal text-fg-subtle"> / {assignment.maximumMarks}</span>
                    </span>
                  </div>
                  {mySubmission.feedback ? (
                    <p className="prose-notes mt-2 rounded-md bg-subtle px-3 py-2.5 text-sm">{mySubmission.feedback}</p>
                  ) : (
                    <p className="mt-1 text-[13px] text-fg-muted">No written feedback.</p>
                  )}
                </div>
              )}
            </Panel>
          )}

          {showForm && (
            <Panel title={mySubmission ? "Replace your submission" : "Submit your work"}>
              <form onSubmit={submit} className="space-y-4">
                {overdue && <Notice tone="warn">The deadline has passed. You can still submit, but it will be marked late.</Notice>}
                <div>
                  <div className="mb-1.5 text-[13px] font-medium">Submit as</div>
                  <Segmented options={TYPES} value={type} onChange={(v) => { setType(v); setFormError(""); }} />
                </div>
                {type === "text" && <Textarea label="Your answer" rows={8} value={text} onChange={(e) => setText(e.target.value)} />}
                {type === "file" && (
                  <div>
                    <input ref={fileInput} type="file" className="hidden" accept=".pdf,.zip,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      className={cx("flex w-full flex-col items-center rounded-md border border-dashed px-4 py-8 text-center text-sm transition-colors hover:bg-subtle", file ? "border-accent" : "border-line-strong")}
                    >
                      <Upload size={18} className="mb-2 text-fg-subtle" />
                      {file ? <span className="font-medium">{file.name}</span> : <span>Choose a file</span>}
                      <span className="mt-1 text-xs text-fg-muted">PDF, ZIP, Word, PowerPoint, image or text · up to 15 MB</span>
                    </button>
                  </div>
                )}
                {LINK_HINT[type] && <Input label={LINK_HINT[type][0]} placeholder={LINK_HINT[type][1]} value={link} onChange={(e) => setLink(e.target.value)} type="url" />}
                {formError && <Notice tone="danger">{formError}</Notice>}
                <div className="flex justify-end gap-2">
                  {editing && (
                    <Button variant="ghost" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" variant="primary" loading={busy}>
                    {mySubmission ? "Replace submission" : "Submit"}
                  </Button>
                </div>
              </form>
            </Panel>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border border-line bg-surface p-4">
            <StatusBadge status={state} />
            <dl className="mt-4 space-y-2.5 text-[13px]">
              <div className="flex justify-between gap-4">
                <dt className="text-fg-muted">Deadline</dt>
                <dd className="m-0 text-right">{fmtDateTime(assignment.deadline)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-fg-muted">Time left</dt>
                <dd className={cx("m-0 text-right", overdue && "text-danger")}>{dueLabel(assignment.deadline)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-fg-muted">Maximum marks</dt>
                <dd className="tabular m-0">{assignment.maximumMarks}</dd>
              </div>
            </dl>
          </div>
          {mySubmission?.status === "graded" && (
            <p className="px-1 text-xs text-fg-muted">Graded work is locked. Ask your instructor to reopen it if you need to resubmit.</p>
          )}
        </aside>
      </div>
    </>
  );
}
