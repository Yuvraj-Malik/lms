import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Download } from "lucide-react";
import { assignmentApi, submissionApi } from "../../api/endpoints.js";
import { Card, Badge, Button, Input, Textarea, Spinner, EmptyState } from "../../components/ui.jsx";

const SubmissionRow = ({ submission, maximumMarks, onGraded }) => {
  const [marks, setMarks] = useState(submission.marks ?? "");
  const [feedback, setFeedback] = useState(submission.feedback || "");
  const [saving, setSaving] = useState(false);

  const handleGrade = async () => {
    setSaving(true);
    try {
      const { data } = await submissionApi.grade(submission._id, { marks: Number(marks), feedback });
      onGraded(data.submission);
    } finally {
      setSaving(false);
    }
  };

  const content =
    submission.submissionType === "file" ? (
      <a
        href={submission.filePath}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 text-sm text-pine hover:underline dark:text-amber-light"
      >
        <Download size={13} /> {submission.fileOriginalName || "Download file"}
      </a>
    ) : submission.submissionType === "text" ? (
      <p className="text-sm text-ink-soft dark:text-dark-ink-soft">{submission.textContent}</p>
    ) : (
      <a
        href={submission.submissionLink}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-pine hover:underline dark:text-amber-light"
      >
        {submission.submissionLink}
      </a>
    );

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink dark:text-dark-ink">{submission.student?.name}</p>
          <p className="text-xs text-ink-soft dark:text-dark-ink-soft">{submission.student?.email}</p>
          <p className="mt-1 text-xs text-ink-soft dark:text-dark-ink-soft">
            Submitted {new Date(submission.submissionDate).toLocaleString()}
          </p>
        </div>
        <Badge tone={submission.status === "late" ? "clay" : submission.status === "graded" ? "pine" : "amber"}>
          {submission.status}
        </Badge>
      </div>

      <div className="mt-3">{content}</div>

      <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-[140px_1fr_auto] dark:border-dark-border">
        <Input
          label={`Marks (/ ${maximumMarks})`}
          type="number"
          min={0}
          max={maximumMarks}
          value={marks}
          onChange={(e) => setMarks(e.target.value)}
        />
        <Textarea label="Feedback" rows={1} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        <div className="flex items-end">
          <Button onClick={handleGrade} disabled={saving || marks === ""}>
            {saving ? "Saving…" : "Save grade"}
          </Button>
        </div>
      </div>
    </Card>
  );
};

const ViewSubmissions = () => {
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState(null);

  const load = async () => {
    const [aRes, sRes] = await Promise.all([
      assignmentApi.get(assignmentId),
      submissionApi.forAssignment(assignmentId),
    ]);
    setAssignment(aRes.data.assignment);
    setSubmissions(sRes.data.submissions);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  const handleGraded = (updated) => {
    setSubmissions((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
  };

  if (!assignment || !submissions) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div>
      <Link
        to={`/admin/courses/${assignment.course._id}/assignments`}
        className="text-xs font-medium text-pine dark:text-amber-light"
      >
        ← Back to Assignments
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink dark:text-dark-ink">
        Submissions — {assignment.title}
      </h1>
      <p className="mt-1 text-sm text-ink-soft dark:text-dark-ink-soft">
        {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
      </p>

      <div className="mt-6 space-y-4">
        {submissions.length === 0 ? (
          <EmptyState title="No submissions yet" description="Nothing has been submitted for this assignment." />
        ) : (
          submissions.map((s) => (
            <SubmissionRow key={s._id} submission={s} maximumMarks={assignment.maximumMarks} onGraded={handleGraded} />
          ))
        )}
      </div>
    </div>
  );
};

export default ViewSubmissions;
