import { useState } from "react";
import { BookOpen } from "lucide-react";
import { enrollmentApi } from "../../api/endpoints.js";
import useAsync from "../../lib/useAsync.js";
import CourseCard from "../../components/CourseCard.jsx";
import { Button, EmptyState, ErrorState, PageHeader, PageLoader, Tabs } from "../../components/ui.jsx";

export default function MyCourses() {
  const [tab, setTab] = useState("active");
  const { data, loading, error, reload } = useAsync(async () => (await enrollmentApi.my()).data.enrollments, []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const active = data.filter((e) => e.status !== "completed");
  const completed = data.filter((e) => e.status === "completed");
  const list = tab === "active" ? active : tab === "completed" ? completed : data;

  return (
    <>
      <PageHeader
        title="My courses"
        description="Courses you're enrolled in."
        actions={
          <Button to="/dashboard/catalog" variant="primary">
            Find a course
          </Button>
        }
      />
      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "active", label: "In progress", count: active.length },
          { value: "completed", label: "Completed", count: completed.length },
          { value: "all", label: "All", count: data.length },
        ]}
      />
      {list.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface">
          <EmptyState
            icon={BookOpen}
            title={tab === "completed" ? "No completed courses yet" : "No courses here"}
            description={tab === "completed" ? "Finish every module in a course to earn its certificate." : "Enroll in a course from the catalog to get started."}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((e) => (
            <CourseCard key={e._id} course={{ ...e.course, moduleCount: e.moduleCount }} enrollment={e} to={`/dashboard/courses/${e.course._id}/learn`} />
          ))}
        </div>
      )}
    </>
  );
}
