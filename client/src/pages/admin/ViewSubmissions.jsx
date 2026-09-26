import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Download } from "lucide-react";
import { assignmentApi, submissionApi } from "../../api/endpoints.js";
import { Card, Badge, StatusBadge, Button, Input, Textarea, Spinner, EmptyState } from "../../components/ui.jsx";

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
        className="inline-flex items-center gap-1.5 type-body-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
      >
        <Download size={14} /> {submission.fileOriginalName || "Download submitted file"}
      </a>
    ) : submission.submissionType === "text" ? (
      <div className="rounded-sm bg-bg-base/60 p-3 border border-border-subtle type-body text-text-primary">
        {submission.textContent}
      </div>
    ) : (
      <a
        href={submission.submissionLink}
        target="_blank"
        rel="noreferrer"
        className="type-body-sm font-medium text-primary-500 hover:text-primary-600 underline transition-colors"
      >
        {submission.submissionLink}
      </a>
    );

  const getStatusBadge = () => {
    if (submission.status === "graded") {
      return <StatusBadge status="completed" label="Graded" />;
    }
    if (submission.status === "late") {
      return <StatusBadge status="overdue" label="Submitted Late" />;
    }
    return <StatusBadge status="pending" label="Pending Review" />;
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="type-h3 text-text-primary">{submission.student?.name}</p>
          <p className="type-body-sm text-text-secondary">{submission.student?.email}</p>
          <p className="mt-1 type-caption text-text-tertiary">
            Submitted {new Date(submission.submissionDate).toLocaleString()}
          </p>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      <div className="mt-4">{content}</div>

      <div className="mt-5 grid gap-3 border-t border-border-subtle pt-4 sm:grid-cols-[140px_1fr_auto]">
        <Input
          label={`Marks (/ ${maximumMarks})`}
          type="number"
          min={0}
          max={maximumMarks}
          value={marks}
          onChange={(e) => setMarks(e.target.value)}
        />
        <Textarea
          label="Instructor Notes"
          placeholder="e.g. Clean recursive implementation; test coverage omitted null edge case."
          rows={1}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
        <div className="flex items-end">
          <Button onClick={handleGrade} disabled={saving || marks === ""}>
            {saving ? "Recording…" : "Record grade"}
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
        className="inline-flex items-center text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors"
      >
        ← Back to Assignments
      </Link>
      <h1 className="mt-3 type-display font-semibold text-text-primary">
        Submissions — {assignment.title}
      </h1>
      <p className="mt-1 type-body-sm text-text-secondary">
        {submissions.length} student submission{submissions.length !== 1 ? "s" : ""}
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
