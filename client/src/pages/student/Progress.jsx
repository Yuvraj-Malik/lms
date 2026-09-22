import { useEffect, useState } from "react";
import { enrollmentApi } from "../../api/endpoints.js";
import { Card, Badge, Spinner, EmptyState } from "../../components/ui.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";

const Progress = () => {
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
      <h1 className="font-display text-2xl font-semibold text-ink dark:text-dark-ink">Progress</h1>

      {enrollments.length === 0 ? (
        <EmptyState title="No progress to show yet" description="Enroll in a course to start tracking it." />
      ) : (
        <div className="mt-6 space-y-4">
          {enrollments.map((e) => (
            <Card key={e._id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink dark:text-dark-ink">{e.course.title}</p>
                  <p className="text-xs text-ink-soft dark:text-dark-ink-soft">
                    {e.completedModules.length} module{e.completedModules.length !== 1 ? "s" : ""} completed
                  </p>
                </div>
                <Badge tone={e.status === "completed" ? "pine" : "amber"}>{e.status}</Badge>
              </div>
              <ProgressBar value={e.progress} className="mt-3" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Progress;
