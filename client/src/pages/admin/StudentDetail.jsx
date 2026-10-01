import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import useAsync from "../../lib/useAsync.js";
import { fmtDate, timeAgo } from "../../lib/format.js";
import { Avatar, Badge, Button, EmptyState, ErrorState, PageHeader, PageLoader, Panel, ProgressBar, Select, StatusBadge, Table, Td, Th, useFeedback } from "../../components/ui.jsx";

export default function StudentDetail() {
  const { id } = useParams();
  const { isSuper } = useAuth();
  const { toast, confirm } = useFeedback();
  const [courseToAdd, setCourseToAdd] = useState("");
  const [adding, setAdding] = useState(false);
  const { data, loading, error, reload } = useAsync(async () => (await adminApi.student(id)).data, [id]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { student, enrollments, submissions, quizzes, enrollableCourses } = data;

  const enroll = async () => {
    if (!courseToAdd) return;
    setAdding(true);
    try {
      await adminApi.enroll(student._id, courseToAdd);
      toast(`${student.name} enrolled.`);
      setCourseToAdd("");
      reload({ quiet: true });
    } catch (err) {
      toast(getErrorMessage(err), "danger");
    } finally {
      setAdding(false);
    }
  };

  const unenroll = async (e) => {
    const ok = await confirm({
      title: `Remove ${student.name} from ${e.course.title}?`,
      description: "Their progress, quiz attempts and submissions in this course are deleted.",
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    try {
      await adminApi.unenroll(e._id);
      toast("Removed from course.");
      reload({ quiet: true });
    } catch (err) {
      toast(getErrorMessage(err), "danger");
    }
  };

  const quizzesByCourse = quizzes.reduce((acc, q) => {
    (acc[q.course] ||= []).push(q);
    return acc;
  }, {});

  return (
    <>
      <PageHeader back={{ to: "/admin/students", label: "Students" }} title={student.name}>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-fg-muted">
          <Avatar user={student} size={24} />
          <span>{student.email}</span>
          {student.department && <span>{student.department}</span>}
          <span>Joined {fmtDate(student.createdAt)}</span>
          <span>Last active {timeAgo(student.lastLogin)}</span>
          {student.authProvider === "google" && <Badge>Google sign-in</Badge>}
          {!student.isActive && <StatusBadge status="deactivated" />}
          {isSuper && (
            <Link to={`/admin/users?search=${encodeURIComponent(student.email)}`} className="text-accent-fg hover:underline">
              Manage account
            </Link>
          )}
        </div>
      </PageHeader>

      <div className="space-y-6">
        <Panel
          title="Courses"
          flush
          actions={
            enrollableCourses.length > 0 && (
              <div className="flex gap-2">
                <Select value={courseToAdd} onChange={(e) => setCourseToAdd(e.target.value)} selectClassName="h-8 w-56 text-[13px]" aria-label="Course to enroll in">
                  <option value="">Enroll in a course…</option>
                  {enrollableCourses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                      {c.isPublished ? "" : " (draft)"}
                    </option>
                  ))}
                </Select>
                <Button size="sm" onClick={enroll} disabled={!courseToAdd} loading={adding}>
                  Enroll
                </Button>
              </div>
            )
          }
        >
          {enrollments.length === 0 ? (
            <EmptyState title="Not enrolled in any of your courses" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Course</Th>
                  <Th className="w-[30%]">Progress</Th>
                  <Th className="hidden md:table-cell">Quizzes passed</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => {
                  const qs = quizzesByCourse[e.course._id] || [];
                  return (
                    <tr key={e._id}>
                      <Td>
                        <Link to={`/admin/courses/${e.course._id}?tab=students`} className="font-medium hover:underline">
                          {e.course.title}
                        </Link>
                        <div className="text-xs text-fg-muted">Enrolled {fmtDate(e.enrollmentDate)}</div>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-3">
                          <ProgressBar value={e.progress} tone={e.status === "completed" ? "ok" : "accent"} />
                          <span className="tabular w-9 shrink-0 text-right text-xs text-fg-muted">{e.progress}%</span>
                        </div>
                      </Td>
                      <Td className="tabular hidden text-fg-muted md:table-cell">
                        {qs.filter((q) => q.passed).length}
                        {qs.length ? ` of ${qs.length} attempted` : ""}
                      </Td>
                      <Td>
                        <StatusBadge status={e.status === "completed" ? "completed" : e.progress > 0 ? "active" : "not-started"} />
                      </Td>
                      <Td align="right">
                        <Button size="sm" variant="ghost" onClick={() => unenroll(e)}>
                          Remove
                        </Button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Panel>

        <Panel title="Submissions" flush>
          {submissions.length === 0 ? (
            <EmptyState title="No submissions yet" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Assignment</Th>
                  <Th className="hidden md:table-cell">Submitted</Th>
                  <Th>Status</Th>
                  <Th align="right">Marks</Th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s._id}>
                    <Td>
                      <Link to={`/admin/submissions?open=${s._id}`} className="font-medium hover:underline">
                        {s.assignment.title}
                      </Link>
                      <div className="text-xs text-fg-muted">{s.assignment.course?.title}</div>
                    </Td>
                    <Td className="hidden whitespace-nowrap text-fg-muted md:table-cell">{fmtDate(s.submissionDate)}</Td>
                    <Td>
                      <StatusBadge status={s.status} />
                    </Td>
                    <Td align="right" className="tabular">
                      {s.status === "graded" ? (
                        <>
                          {s.marks}
                          <span className="text-fg-subtle">/{s.assignment.maximumMarks}</span>
                        </>
                      ) : (
                        <span className="text-fg-subtle">—</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>

        {quizzes.length > 0 && (
          <Panel title="Quiz results" description="Best attempt per module" flush>
            <Table>
              <thead>
                <tr>
                  <Th>Module</Th>
                  <Th align="right">Best score</Th>
                  <Th align="right">Attempts</Th>
                  <Th>Result</Th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((q) => (
                  <tr key={q.moduleId}>
                    <Td>{q.moduleTitle}</Td>
                    <Td align="right" className="tabular">
                      {q.best}/{q.total}
                    </Td>
                    <Td align="right" className="tabular text-fg-muted">{q.attempts}</Td>
                    <Td>{q.passed ? <Badge tone="ok">Passed</Badge> : <Badge tone="warn">Not passed</Badge>}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Panel>
        )}
      </div>
    </>
  );
}
