import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BookOpen, ClipboardList, Users, CheckCircle2 } from "lucide-react";
import { courseApi, moduleApi, assignmentApi, enrollmentApi } from "../../api/endpoints.js";
import { Card, Badge, Button, Spinner, Alert } from "../../components/ui.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getErrorMessage } from "../../api/client.js";

const difficultyTone = { Beginner: "pine", Intermediate: "amber", Advanced: "clay" };

const CourseDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [counts, setCounts] = useState({});
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const [courseRes, modulesRes] = await Promise.all([courseApi.get(id), moduleApi.listForCourse(id)]);
    setCourse(courseRes.data.course);
    setCounts(courseRes.data);
    setModules(modulesRes.data.modules);

    if (user?.role === "student") {
      const [assignmentsRes, statusRes] = await Promise.all([
        assignmentApi.listForCourse(id),
        enrollmentApi.status(id),
      ]);
      setAssignments(assignmentsRes.data.assignments);
      setEnrollment(statusRes.data.enrollment);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const handleEnroll = async () => {
    setEnrolling(true);
    setError("");
    try {
      await enrollmentApi.enroll(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size={28} />
      </div>
    );
  }
  if (!course) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="pine">{course.category}</Badge>
        <Badge tone={difficultyTone[course.difficulty]}>{course.difficulty}</Badge>
      </div>
      <h1 className="mt-3 font-display text-3xl font-semibold text-ink dark:text-dark-ink">{course.title}</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft dark:text-dark-ink-soft">
        {course.description}
      </p>

      <div className="mt-5 flex flex-wrap gap-5 text-sm text-ink-soft dark:text-dark-ink-soft">
        <span>Instructor: {course.instructor}</span>
        <span>Duration: {course.duration}</span>
        <span className="flex items-center gap-1">
          <Users size={14} /> {counts.enrolledCount ?? 0} enrolled
        </span>
        <span className="flex items-center gap-1">
          <BookOpen size={14} /> {counts.moduleCount ?? 0} modules
        </span>
        <span className="flex items-center gap-1">
          <ClipboardList size={14} /> {counts.assignmentCount ?? 0} assignments
        </span>
      </div>

      {error && <Alert className="mt-4">{error}</Alert>}

      {user?.role === "student" && (
        <div className="mt-6">
          {enrollment ? (
            <Card className="max-w-sm">
              <p className="text-sm font-medium text-ink dark:text-dark-ink">You're enrolled</p>
              <ProgressBar value={enrollment.progress} className="mt-3" />
              <Link to="/dashboard/my-courses">
                <Button className="mt-4 w-full">Go to My Courses</Button>
              </Link>
            </Card>
          ) : (
            <Button onClick={handleEnroll} disabled={enrolling}>
              {enrolling ? "Enrolling…" : "Enroll in this course"}
            </Button>
          )}
        </div>
      )}
      {!user && (
        <Link to="/login" state={{ from: { pathname: `/courses/${id}` } }}>
          <Button className="mt-6">Log in to enroll</Button>
        </Link>
      )}

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink dark:text-dark-ink">Course modules</h2>
          <ol className="mt-4 space-y-2">
            {modules.map((m) => {
              const done = enrollment?.completedModules?.includes(m._id);
              return (
                <li
                  key={m._id}
                  className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5 dark:border-dark-border"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-xs font-medium text-ink-soft dark:bg-dark-surface-sunken dark:text-dark-ink-soft">
                    {m.moduleOrder}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink dark:text-dark-ink">{m.title}</p>
                    {m.description && (
                      <p className="mt-0.5 text-xs text-ink-soft dark:text-dark-ink-soft">{m.description}</p>
                    )}
                  </div>
                  {done && <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-pine dark:text-pine-light" />}
                </li>
              );
            })}
            {modules.length === 0 && (
              <p className="text-sm text-ink-soft dark:text-dark-ink-soft">No modules published yet.</p>
            )}
          </ol>
        </div>

        {user?.role === "student" && (
          <div>
            <h2 className="font-display text-lg font-semibold text-ink dark:text-dark-ink">Assignments</h2>
            <div className="mt-4 space-y-2">
              {assignments.map((a) => (
                <Link
                  key={a._id}
                  to={`/dashboard/assignments/${a._id}`}
                  className="block rounded-lg border border-border px-3 py-2.5 hover:border-pine dark:border-dark-border"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink dark:text-dark-ink">{a.title}</p>
                    {a.mySubmission ? (
                      <Badge tone="pine">{a.mySubmission.status}</Badge>
                    ) : (
                      <Badge tone="amber">Not submitted</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-soft dark:text-dark-ink-soft">
                    Due {new Date(a.deadline).toLocaleDateString()}
                  </p>
                </Link>
              ))}
              {assignments.length === 0 && (
                <p className="text-sm text-ink-soft dark:text-dark-ink-soft">No assignments published yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetails;
