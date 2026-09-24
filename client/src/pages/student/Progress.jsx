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
        <div className="mt-6 space-y-5">
          {enrollments.map((e) => (
            <Card
              key={e._id}
              className="rounded-2xl border-border/60 bg-surface-raised/70 p-5 shadow-none dark:border-dark-border/70 dark:bg-dark-surface/70 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-ink dark:text-dark-ink">{e.course.title}</p>
                  <p className="mt-0.5 text-sm text-ink-soft dark:text-dark-ink-soft">
                    {e.completedModules.length} module{e.completedModules.length !== 1 ? "s" : ""} completed
                  </p>
                </div>
                <Badge tone={e.status === "completed" ? "pine" : "amber"}>{e.status}</Badge>
              </div>
              <ProgressBar value={e.progress} className="mt-5" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Progress;
