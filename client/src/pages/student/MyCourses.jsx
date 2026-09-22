import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { enrollmentApi } from "../../api/endpoints.js";
import { Card, Badge, Spinner, EmptyState } from "../../components/ui.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";

const MyCourses = () => {
  const [enrollments, setEnrollments] = useState(null);

  useEffect(() => {
    enrollmentApi.my().then(({ data }) => setEnrollments(data.enrollments));
  }, []);

  if (!enrollments) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink dark:text-dark-ink">My Courses</h1>

      {enrollments.length === 0 ? (
        <EmptyState
          title="You haven't enrolled in anything yet"
          description="Browse the catalog to find a course to start."
          action={
            <Link to="/courses" className="text-sm font-medium text-pine dark:text-amber-light">
              Browse courses →
            </Link>
          }
        />
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {enrollments.map((e) => (
            <Link key={e._id} to={`/dashboard/my-courses/${e.course._id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <Badge tone="pine">{e.course.category}</Badge>
                  <Badge tone={e.status === "completed" ? "pine" : "amber"}>{e.status}</Badge>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-ink dark:text-dark-ink">
                  {e.course.title}
                </h3>
                <p className="mt-1 text-xs text-ink-soft dark:text-dark-ink-soft">
                  Enrolled {new Date(e.enrollmentDate).toLocaleDateString()}
                </p>
                <ProgressBar value={e.progress} className="mt-4" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
