import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { adminApi, courseApi } from "../../api/endpoints.js";
import useAsync from "../../lib/useAsync.js";
import SubmissionsTable from "../../components/SubmissionsTable.jsx";
import { ErrorState, PageHeader, PageLoader, Select } from "../../components/ui.jsx";

export default function AdminSubmissions() {
  const [params] = useSearchParams();
  const [course, setCourse] = useState("");
  const { data, loading, error, reload, setData } = useAsync(async () => {
    const [s, c] = await Promise.all([adminApi.submissions(), courseApi.manage()]);
    return { submissions: s.data.submissions, courses: c.data.courses };
  }, []);

  const filtered = useMemo(
    () => (data?.submissions || []).filter((s) => !course || s.assignment?.course?._id === course),
    [data, course]
  );

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader
        title="Submissions"
        description="Work handed in across your courses. Select a row to read it and grade."
        actions={
          <Select value={course} onChange={(e) => setCourse(e.target.value)} selectClassName="w-64" aria-label="Course">
            <option value="">All courses</option>
            {data.courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </Select>
        }
      />
      <SubmissionsTable
        submissions={filtered}
        setSubmissions={(fn) => setData((d) => ({ ...d, submissions: fn(d.submissions) }))}
        initialOpenId={params.get("open")}
      />
    </>
  );
}
