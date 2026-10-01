import { adminApi, assignmentApi } from "../../../api/endpoints.js";
import useAsync from "../../../lib/useAsync.js";
import SubmissionsTable from "../../../components/SubmissionsTable.jsx";
import { ErrorState, Spinner } from "../../../components/ui.jsx";

export default function SubmissionsTab({ courseId, assignmentId }) {
  const { data, loading, error, reload, setData } = useAsync(async () => {
    const [s, a] = await Promise.all([adminApi.submissions({ course: courseId }), assignmentApi.listForCourse(courseId)]);
    return { submissions: s.data.submissions, assignments: a.data.assignments };
  }, [courseId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="max-w-5xl">
      <SubmissionsTable
        key={assignmentId || "all"}
        submissions={data.submissions}
        setSubmissions={(fn) => setData((d) => ({ ...d, submissions: fn(d.submissions) }))}
        showCourse={false}
        assignments={data.assignments}
        initialAssignment={assignmentId}
      />
    </div>
  );
}
