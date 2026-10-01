import { useParams, useSearchParams } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { courseApi } from "../../api/endpoints.js";
import { useAuth } from "../../context/AuthContext.jsx";
import useAsync from "../../lib/useAsync.js";
import CourseDiscussion from "../../components/CourseDiscussion.jsx";
import { Button, ErrorState, PageHeader, PageLoader, StatusBadge, Tabs } from "../../components/ui.jsx";
import CourseDetailsForm from "./course/CourseDetailsForm.jsx";
import ModulesTab from "./course/ModulesTab.jsx";
import AssignmentsTab from "./course/AssignmentsTab.jsx";
import StudentsTab from "./course/StudentsTab.jsx";
import SubmissionsTab from "./course/SubmissionsTab.jsx";

export function NewCourse() {
  return (
    <>
      <PageHeader back={{ to: "/admin/courses", label: "Courses" }} title="New course" description="Start with the details. You'll add modules, quizzes and assignments next." />
      <CourseDetailsForm />
    </>
  );
}

export default function CourseEditor() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "modules";
  const { data, loading, error, reload } = useAsync(async () => (await courseApi.get(courseId)).data, [courseId]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data.access.canManage) return <ErrorState message="You can only manage courses you created." />;

  const { course, counts } = data;
  const setTab = (value, extra = {}) => setParams({ tab: value, ...extra }, { replace: true });
  const ownerName = course.createdBy && course.createdBy._id !== user._id ? course.createdBy.name : null;

  return (
    <>
      <PageHeader
        back={{ to: "/admin/courses", label: "Courses" }}
        eyebrow={`${course.category} · ${course.difficulty}${ownerName ? ` · Owned by ${ownerName}` : ""}`}
        title={course.title}
        actions={
          <>
            <StatusBadge status={course.isPublished ? "published" : "draft"} />
            <Button to={`/courses/${course._id}`} icon={ExternalLink} size="sm" target="_blank">
              Preview
            </Button>
          </>
        }
      />
      <Tabs
        className="mb-6"
        value={tab}
        onChange={(v) => setTab(v)}
        tabs={[
          { value: "modules", label: "Modules", count: counts.moduleCount },
          { value: "assignments", label: "Assignments", count: counts.assignmentCount },
          { value: "students", label: "Students", count: counts.enrolledCount },
          { value: "submissions", label: "Submissions" },
          { value: "discussion", label: "Discussion" },
          { value: "details", label: "Settings" },
        ]}
      />
      {tab === "modules" && <ModulesTab courseId={course._id} onChanged={() => reload({ quiet: true })} />}
      {tab === "assignments" && <AssignmentsTab courseId={course._id} onChanged={() => reload({ quiet: true })} onShowSubmissions={(id) => setTab("submissions", { assignment: id })} />}
      {tab === "students" && <StudentsTab courseId={course._id} courseTitle={course.title} moduleCount={counts.moduleCount} />}
      {tab === "submissions" && <SubmissionsTab courseId={course._id} assignmentId={params.get("assignment") || ""} />}
      {tab === "discussion" && (
        <div className="max-w-4xl">
          <CourseDiscussion courseId={course._id} />
        </div>
      )}
      {tab === "details" && <CourseDetailsForm course={course} onSaved={() => reload({ quiet: true })} />}
    </>
  );
}
