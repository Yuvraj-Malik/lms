import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle, FileText } from "lucide-react";
import { assignmentApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { Card, Button, Input, Textarea, Select, StatusBadge, Spinner, Alert } from "../../components/ui.jsx";

const AssignmentDetail = () => {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [mySubmission, setMySubmission] = useState(null);
  const [submissionType, setSubmissionType] = useState("text");
  const [textContent, setTextContent] = useState("");
  const [submissionLink, setSubmissionLink] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    try {
      const { data } = await assignmentApi.get(id);
      setAssignment(data.assignment);
      setMySubmission(data.mySubmission);
      if (data.mySubmission) {
        setSubmissionType(data.mySubmission.submissionType || "text");
        setTextContent(data.mySubmission.textContent || "");
        setSubmissionLink(data.mySubmission.submissionLink || "");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const form = new FormData();
      if (file) {
        form.append("submissionType", "file");
        form.append("file", file);
      } else {
        form.append("submissionType", submissionType);
        if (submissionType === "text") form.append("textContent", textContent);
        else form.append("submissionLink", submissionLink);
      }
      await assignmentApi.submit(id, form);
      setSuccess("Submission uploaded successfully.");
      setFile(null);
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }
  if (!assignment) return null;

  const overdue = new Date(assignment.deadline) < new Date();
  const formattedDeadline = new Date(assignment.deadline).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-2xl space-y-8">
      <Link
        to="/dashboard/assignments"
        className="inline-flex items-center gap-1.5 type-body-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} /> Back to Assignments
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="type-h2 text-text-primary">{assignment.title}</h1>
          <p className="mt-1 type-body text-text-secondary">{assignment.course?.title}</p>
        </div>
        <StatusBadge
          status={overdue ? "overdue" : "upcoming"}
          label={overdue ? `Overdue · ${formattedDeadline}` : `Due ${formattedDeadline}`}
        />
      </div>

      <Card className="p-6">
        <p className="type-body text-text-secondary">{assignment.description}</p>
        {assignment.instructions && (
          <div className="mt-4 pt-4 border-t border-border-subtle">
            <h3 className="type-h3 text-text-primary">Submission Instructions</h3>
            <p className="mt-1.5 type-body text-text-secondary">
              {assignment.instructions}
            </p>
          </div>
        )}
        <p className="mt-4 type-caption text-text-tertiary">
          Maximum marks: {assignment.maximumMarks}
        </p>
      </Card>

      {mySubmission?.status === "graded" && (
        <Card className="p-6 border-primary-500/25 bg-bg-surface">
          <h3 className="type-h3 text-text-primary">Evaluation Result</h3>
          <p className="mt-2 type-display text-primary-600 dark:text-primary-400">
            {mySubmission.marks} <span className="type-body-sm text-text-secondary">/ {assignment.maximumMarks} marks</span>
          </p>
          {mySubmission.feedback && (
            <div className="mt-3 rounded-[6px] border border-border-subtle bg-bg-surface-raised p-3.5 type-body-sm text-text-secondary">
              <span className="font-semibold text-text-primary">Instructor Evaluation: </span>
              "{mySubmission.feedback}"
            </div>
          )}
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="type-h3 text-text-primary">
            {mySubmission ? "Update Submission" : "Submit Assignment"}
          </h3>
          {mySubmission && (
            <StatusBadge
              status={mySubmission.status === "late" ? "overdue" : mySubmission.status === "graded" ? "completed" : "pending"}
              label={mySubmission.status}
            />
          )}
        </div>

        {mySubmission && (
          <p className="mt-2 type-body-sm text-text-tertiary">
            Last submitted {new Date(mySubmission.submissionDate).toLocaleString()} —{" "}
            {mySubmission.submissionType === "file" ? mySubmission.fileOriginalName : mySubmission.submissionLink || mySubmission.textContent}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          {success && <Alert tone="success">{success}</Alert>}

          <Select
            label="Submission type"
            value={file ? "file" : submissionType}
            onChange={(e) => {
              setFile(null);
              setSubmissionType(e.target.value);
            }}
          >
            <option value="text">Text Entry</option>
            <option value="github">GitHub Repository</option>
            <option value="drive">Drive Document Link</option>
            <option value="url">Project URL</option>
            <option value="file">File Upload</option>
          </Select>

          {submissionType === "text" && !file && (
            <Textarea
              label="Submission text"
              rows={4}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste or write your submission here..."
            />
          )}

          {["github", "drive", "url"].includes(submissionType) && !file && (
            <Input
              label={`${submissionType === "github" ? "GitHub" : submissionType === "drive" ? "Drive" : "Project"} link`}
              type="url"
              value={submissionLink}
              onChange={(e) => setSubmissionLink(e.target.value)}
              placeholder="https://…"
            />
          )}

          {submissionType === "file" && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Upload File
              </label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-[6px] file:border file:border-border-default file:bg-bg-surface-raised file:text-text-primary file:text-xs file:font-semibold hover:file:bg-bg-surface cursor-pointer"
              />
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Uploading…" : mySubmission ? "Resubmit Work" : "Submit Assignment"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AssignmentDetail;
