import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Users, GraduationCap } from "lucide-react";
import { courseApi, enrollmentApi } from "../../api/endpoints.js";
import { Card, Badge, Spinner, EmptyState } from "../../components/ui.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import { getErrorMessage } from "../../api/client.js";

const CourseEnrollments = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [courseRes, enrollmentsRes] = await Promise.all([
          courseApi.get(courseId),
          enrollmentApi.forCourse(courseId),
        ]);
        setCourse(courseRes.data.course);
        setEnrollments(enrollmentsRes.data.enrollments);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };
    load();
  }, [courseId]);

  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/admin/courses" className="text-xs font-medium text-pine dark:text-amber-light">
          ← Back to Courses
        </Link>
        <EmptyState title="Could not load enrollments" description={error} />
      </div>
    );
  }

  if (!course || !enrollments) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/courses" className="text-xs font-medium text-pine dark:text-amber-light">
          ← Back to Courses
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone="pine">{course.category}</Badge>
          <Badge>{course.difficulty}</Badge>
        </div>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink dark:text-dark-ink">{course.title}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft dark:text-dark-ink-soft">
          <Users size={14} /> {enrollments.length} student{enrollments.length !== 1 ? "s" : ""} enrolled
        </p>
      </div>

      {enrollments.length === 0 ? (
        <EmptyState
          title="No students enrolled yet"
          description="Once students enroll in this course, their progress will appear here."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm dark:border-dark-border dark:bg-dark-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-sunken/60 text-xs font-semibold text-ink-soft uppercase dark:border-dark-border dark:bg-dark-surface-sunken/60 dark:text-dark-ink-soft">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Enrolled</th>
                  <th className="px-5 py-3.5">Progress</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-dark-border/60">
                {enrollments.map((e) => {
                  const isCompleted = e.status === "completed" || e.progress >= 100;
                  const isInProgress = e.progress > 0 && !isCompleted;
                  return (
                    <tr key={e._id} className="transition-colors hover:bg-surface-sunken/40 dark:hover:bg-dark-surface-sunken/40">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-pine/10 font-bold text-pine dark:bg-pine-light/10 dark:text-pine-light">
                            {e.student?.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-ink dark:text-dark-ink">{e.student?.name}</p>
                            <p className="text-xs text-ink-soft dark:text-dark-ink-soft">{e.student?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-ink-soft dark:text-dark-ink-soft">
                        {new Date(e.enrollmentDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="w-40">
                          <div className="mb-1 flex justify-between text-[11px] font-medium text-ink-soft dark:text-dark-ink-soft">
                            <span>{e.completedModules?.length || 0} modules</span>
                            <span>{e.progress}%</span>
                          </div>
                          <ProgressBar value={e.progress} />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={isCompleted ? "pine" : isInProgress ? "amber" : "neutral"}>
                          {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Not Started"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/admin/students/${e.student?._id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-pine hover:underline dark:text-amber-light"
                        >
                          <GraduationCap size={13} /> View Profile
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseEnrollments;
