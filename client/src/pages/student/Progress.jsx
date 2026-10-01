import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { assignmentApi, enrollmentApi } from "../../api/endpoints.js";
import useAsync from "../../lib/useAsync.js";
import { fmtDate } from "../../lib/format.js";
import { EmptyState, ErrorState, PageHeader, PageLoader, ProgressBar, Stat, StatusBadge, Table, Td, Th } from "../../components/ui.jsx";

export default function Progress() {
  const { data, loading, error, reload } = useAsync(async () => {
    const [e, a] = await Promise.all([enrollmentApi.my(), assignmentApi.my()]);
    return { enrollments: e.data.enrollments, assignments: a.data.assignments };
  }, []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const rows = data.enrollments.map((e) => {
    const asg = data.assignments.filter((a) => a.course?._id === e.course._id);
    const graded = asg.filter((a) => a.mySubmission?.status === "graded");
    const avg = graded.length ? Math.round((graded.reduce((s, a) => s + a.mySubmission.marks / a.maximumMarks, 0) / graded.length) * 100) : null;
    return {
      e,
      submitted: asg.filter((a) => a.mySubmission).length,
      total: asg.length,
      avg,
    };
  });

  const modulesDone = data.enrollments.reduce((n, e) => n + e.completedModules.length, 0);
  const modulesTotal = data.enrollments.reduce((n, e) => n + (e.moduleCount || 0), 0);
  const allGraded = data.assignments.filter((a) => a.mySubmission?.status === "graded");
  const overallAvg = allGraded.length ? Math.round((allGraded.reduce((s, a) => s + a.mySubmission.marks / a.maximumMarks, 0) / allGraded.length) * 100) : null;

  return (
    <>
      <PageHeader title="Progress" description="How far you've got in each course, and how your graded work is going." />
      {rows.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface">
          <EmptyState icon={TrendingUp} title="Nothing to track yet" description="Enroll in a course and your progress will show up here." />
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Modules completed" value={`${modulesDone}/${modulesTotal}`} />
            <Stat label="Courses completed" value={`${data.enrollments.filter((e) => e.status === "completed").length}/${data.enrollments.length}`} />
            <Stat label="Assignments submitted" value={`${data.assignments.filter((a) => a.mySubmission).length}/${data.assignments.length}`} />
            <Stat label="Average grade" value={overallAvg === null ? "—" : `${overallAvg}%`} hint={`${allGraded.length} graded`} />
          </div>
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <Table>
              <thead>
                <tr>
                  <Th>Course</Th>
                  <Th className="w-[34%]">Modules</Th>
                  <Th className="hidden sm:table-cell">Assignments</Th>
                  <Th className="hidden sm:table-cell">Avg. grade</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ e, submitted, total, avg }) => (
                  <tr key={e._id}>
                    <Td>
                      <Link to={`/dashboard/courses/${e.course._id}/learn`} className="font-medium hover:underline hover:underline-offset-4">
                        {e.course.title}
                      </Link>
                      <div className="text-xs text-fg-muted">Enrolled {fmtDate(e.enrollmentDate)}</div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <ProgressBar value={e.progress} tone={e.status === "completed" ? "ok" : "accent"} />
                        <span className="tabular shrink-0 text-xs text-fg-muted">
                          {e.completedModules.length}/{e.moduleCount}
                        </span>
                      </div>
                    </Td>
                    <Td className="tabular hidden text-fg-muted sm:table-cell">
                      {submitted}/{total}
                    </Td>
                    <Td className="tabular hidden sm:table-cell">{avg === null ? <span className="text-fg-subtle">—</span> : `${avg}%`}</Td>
                    <Td>
                      <StatusBadge status={e.status === "completed" ? "completed" : e.progress > 0 ? "active" : "not-started"} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}
    </>
  );
}
