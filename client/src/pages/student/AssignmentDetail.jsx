import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { assignmentApi, submissionApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { Card, Badge, Button, Select, Textarea, Input, Alert, Spinner } from "../../components/ui.jsx";

const AssignmentDetail = () => {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [mySubmission, setMySubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  const [submissionType, setSubmissionType] = useState("github");
  const [textContent, setTextContent] = useState("");
  const [submissionLink, setSubmissionLink] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await assignmentApi.get(id);
    setAssignment(data.assignment);
    setMySubmission(data.mySubmission);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (file) {
        fd.append("file", file);
      } else {
        fd.append("submissionType", submissionType);
        if (submissionType === "text") fd.append("textContent", textContent);
        else fd.append("submissionLink", submissionLink);
      }
      const { data } = await submissionApi.submit(id, fd);
      setMySubmission(data.submission);
      setSuccess("Submission received.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }
  if (!assignment) return null;

  const overdue = new Date(assignment.deadline) < new Date();

  return (
    <div className="max-w-2xl">
      <Link to="/dashboard/assignments" className="text-xs font-medium text-pine dark:text-amber-light">
        ← Back to Assignments
      </Link>

      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink dark:text-dark-ink">{assignment.title}</h1>
          <p className="mt-1 text-sm text-ink-soft dark:text-dark-ink-soft">{assignment.course?.title}</p>
        </div>
        <Badge tone={overdue ? "clay" : "amber"}>Due {new Date(assignment.deadline).toLocaleString()}</Badge>
      </div>

      <Card className="mt-6">
        <p className="text-sm leading-relaxed text-ink-soft dark:text-dark-ink-soft">{assignment.description}</p>
        {assignment.instructions && (
          <>
            <h3 className="mt-4 text-sm font-medium text-ink dark:text-dark-ink">Instructions</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft dark:text-dark-ink-soft">
              {assignment.instructions}
            </p>
          </>
        )}
        <p className="mt-4 text-xs text-ink-soft dark:text-dark-ink-soft">
          Maximum marks: {assignment.maximumMarks}
        </p>
      </Card>

      {mySubmission?.status === "graded" && (
        <Card className="mt-6">
          <h3 className="font-display text-base font-semibold text-ink dark:text-dark-ink">Grade</h3>
          <p className="mt-2 text-2xl font-semibold text-pine dark:text-pine-light">
            {mySubmission.marks} <span className="text-sm text-ink-soft dark:text-dark-ink-soft">/ {assignment.maximumMarks}</span>
          </p>
          {mySubmission.feedback && (
            <p className="mt-2 text-sm text-ink-soft dark:text-dark-ink-soft">{mySubmission.feedback}</p>
          )}
        </Card>
      )}

      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-ink dark:text-dark-ink">
            {mySubmission ? "Resubmit" : "Submit assignment"}
          </h3>
          {mySubmission && <Badge tone={mySubmission.status === "late" ? "clay" : "pine"}>{mySubmission.status}</Badge>}
        </div>

        {mySubmission && (
          <p className="mt-2 text-xs text-ink-soft dark:text-dark-ink-soft">
            Last submitted {new Date(mySubmission.submissionDate).toLocaleString()} —{" "}
            {mySubmission.submissionType === "file" ? mySubmission.fileOriginalName : mySubmission.submissionLink || mySubmission.textContent}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && <Alert>{error}</Alert>}
          {success && <Alert tone="pine">{success}</Alert>}

          <Select
            label="Submission type"
            value={file ? "file" : submissionType}
            onChange={(e) => {
              setFile(null);
              setSubmissionType(e.target.value);
            }}
          >
            <option value="text">Text</option>
            <option value="github">GitHub link</option>
            <option value="drive">Drive link</option>
            <option value="url">Project URL</option>
            <option value="file">File upload</option>
          </Select>

          {submissionType === "text" && !file && (
            <Textarea
              label="Your answer"
              rows={4}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
            />
          )}
          {["github", "drive", "url"].includes(submissionType) && !file && (
            <Input
              label="Link"
              type="url"
              placeholder="https://…"
              value={submissionLink}
              onChange={(e) => setSubmissionLink(e.target.value)}
            />
          )}
          {submissionType === "file" && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink dark:text-dark-ink">
                File (PDF, ZIP, DOC, image — max 15MB)
              </span>
              <input
                type="file"
                required
                onChange={(e) => setFile(e.target.files[0])}
                className="text-sm text-ink-soft dark:text-dark-ink-soft"
              />
            </label>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : mySubmission ? "Resubmit" : "Submit"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AssignmentDetail;
