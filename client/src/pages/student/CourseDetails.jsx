import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BookOpen, Users, ClipboardList, CheckCircle2 } from "lucide-react";
import { courseApi, enrollmentApi } from "../../api/endpoints.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { getErrorMessage } from "../../api/client.js";
import { Card, Button, Badge, StatusBadge, Spinner, Alert } from "../../components/ui.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";

const CourseDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    courseApi
      .get(id)
      .then(({ data }) => {
        setCourse(data.course);
        setModules(data.modules || []);
        setAssignments(data.assignments || []);
        setEnrollment(data.enrollment || null);
        setCounts(data.counts || {});
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEnroll = async () => {
    setEnrolling(true);
    setError("");
    try {
      const { data } = await enrollmentApi.enroll(id);
      setEnrollment(data.enrollment);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }
  if (!course) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-12">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="type-caption rounded-[4px] border border-primary-500/20 bg-primary-50 px-2 py-0.5 text-primary-700 dark:bg-primary-600/15 dark:text-primary-400">
            {course.category}
          </span>
          <span className="type-caption rounded-[4px] border border-border-default bg-bg-surface-raised px-2 py-0.5 text-text-secondary">
            {course.difficulty}
          </span>
        </div>
        <h1 className="mt-3 type-display text-text-primary">{course.title}</h1>
        <p className="mt-3 max-w-2xl type-body text-text-secondary">
          {course.description}
        </p>

        <div className="mt-5 flex flex-wrap gap-5 type-body-sm text-text-tertiary">
          <span>Instructor: <strong className="text-text-secondary">{course.instructor}</strong></span>
          <span>Duration: <strong className="text-text-secondary">{course.duration}</strong></span>
          <span className="flex items-center gap-1.5">
            <Users size={14} /> {counts.enrolledCount ?? 0} enrolled
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen size={14} /> {counts.moduleCount ?? 0} modules
          </span>
          <span className="flex items-center gap-1.5">
            <ClipboardList size={14} /> {counts.assignmentCount ?? 0} assignments
          </span>
        </div>

        {error && <Alert tone="danger" className="mt-4">{error}</Alert>}

        {user?.role === "student" && (
          <div className="mt-6">
            {enrollment ? (
              <Card className="max-w-sm p-6">
                <p className="type-body font-medium text-text-primary">Enrolled in Course</p>
                <div className="mt-3">
                  <div className="flex justify-between type-caption text-text-secondary mb-1">
                    <span>Progress</span>
                    <span>{enrollment.progress}%</span>
                  </div>
                  <ProgressBar value={enrollment.progress} showLabel={false} />
                </div>
                <Link to={`/dashboard/my-courses/${course._id}`}>
                  <Button variant="primary" className="mt-5 w-full">Go to Course Workspace</Button>
                </Link>
              </Card>
            ) : (
              <Button variant="primary" onClick={handleEnroll} disabled={enrolling}>
                {enrolling ? "Enrolling…" : "Enroll in this course"}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="type-h2 text-text-primary">Course Modules</h2>
          <ol className="mt-4 space-y-2.5">
            {modules.map((m) => {
              const done = enrollment?.completedModules?.includes(m._id);
              return (
                <li
                  key={m._id}
                  className="flex items-start gap-3 rounded-[8px] border border-border-subtle bg-bg-surface p-3.5 transition-colors"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bg-surface-raised border border-border-subtle text-xs font-semibold text-text-secondary">
                    {m.moduleOrder}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="type-body font-medium text-text-primary">{m.title}</p>
                    {m.description && (
                      <p className="mt-0.5 type-body-sm text-text-secondary">{m.description}</p>
                    )}
                  </div>
                  {done && <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />}
                </li>
              );
            })}
            {modules.length === 0 && (
              <p className="type-body-sm text-text-secondary">No modules published yet.</p>
            )}
          </ol>
        </div>

        {user?.role === "student" && (
          <div>
            <h2 className="type-h2 text-text-primary">Assignments</h2>
            <div className="mt-4 space-y-2.5">
              {assignments.map((a) => (
                <Link
                  key={a._id}
                  to={`/dashboard/assignments/${a._id}`}
                  className="block rounded-[8px] border border-border-subtle bg-bg-surface p-3.5 hover:border-primary-500 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="type-body font-medium text-text-primary truncate">{a.title}</p>
                    <StatusBadge
                      status={a.mySubmission ? a.mySubmission.status : "upcoming"}
                      label={a.mySubmission ? undefined : "Unsubmitted"}
                    />
                  </div>
                  <p className="mt-1 type-body-sm text-text-tertiary">
                    Due {new Date(a.deadline).toLocaleDateString()}
                  </p>
                </Link>
              ))}
              {assignments.length === 0 && (
                <p className="type-body-sm text-text-secondary">No assignments published yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetails;
