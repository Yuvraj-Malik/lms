import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Users, GraduationCap } from "lucide-react";
import { courseApi, enrollmentApi } from "../../api/endpoints.js";
import { Card, Badge, StatusBadge, Spinner, EmptyState } from "../../components/ui.jsx";
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
        <Link to="/admin/courses" className="inline-flex items-center text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors">
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
        <Link to="/admin/courses" className="inline-flex items-center text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors">
          ← Back to Courses
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge>{course.category}</Badge>
          <Badge tone="neutral">{course.difficulty}</Badge>
        </div>
        <h1 className="mt-2 type-display font-semibold text-text-primary">{course.title}</h1>
        <p className="mt-1 flex items-center gap-1.5 type-body-sm text-text-secondary">
          <Users size={14} /> {enrollments.length} student{enrollments.length !== 1 ? "s" : ""} enrolled
        </p>
      </div>

      {enrollments.length === 0 ? (
        <EmptyState
          title="No students enrolled yet"
          description="Once students enroll in this course, their progress will appear here."
        />
      ) : (
        <div className="overflow-hidden rounded-md border border-border-subtle bg-bg-surface shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left type-body">
              <thead className="border-b border-border-subtle bg-bg-surface-raised/40 type-caption text-text-secondary">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Enrolled</th>
                  <th className="px-5 py-3.5">Progress</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {enrollments.map((e) => {
                  const isCompleted = e.status === "completed" || e.progress >= 100;
                  const isInProgress = e.progress > 0 && !isCompleted;
                  return (
                    <tr key={e._id} className="transition-colors hover:bg-bg-surface-raised/30">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm bg-primary-600/10 font-semibold text-primary-400 text-sm">
                            {e.student?.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{e.student?.name}</p>
                            <p className="type-caption text-text-tertiary">{e.student?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 type-body-sm text-text-secondary">
                        {new Date(e.enrollmentDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="w-40">
                          <div className="mb-1 flex justify-between type-caption text-text-secondary">
                            <span>{e.completedModules?.length || 0} modules</span>
                            <span>{e.progress}%</span>
                          </div>
                          <ProgressBar value={e.progress} />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge
                          status={isCompleted ? "completed" : isInProgress ? "in-progress" : "upcoming"}
                          label={isCompleted ? "Completed" : isInProgress ? "In Progress" : "Not Started"}
                        />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/admin/students/${e.student?._id}`}
                          className="inline-flex items-center gap-1.5 type-body-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
                        >
                          <GraduationCap size={14} /> Profile
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
