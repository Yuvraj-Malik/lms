import { useEffect, useState } from "react";
import { enrollmentApi } from "../../api/endpoints.js";
import { Card, StatusBadge, Spinner, EmptyState } from "../../components/ui.jsx";
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
    <div className="space-y-8">
      <div>
        <h1 className="type-display text-text-primary">Academic Progress</h1>
        <p className="mt-1 type-body text-text-secondary">
          Track module completion and progress across enrolled curricula
        </p>
      </div>

      {enrollments.length === 0 ? (
        <EmptyState
          title="No enrollment progress"
          description="Enroll in a course from the catalog to track your progress here."
        />
      ) : (
        <div className="grid gap-4">
          {enrollments.map((e) => (
            <Card key={e._id} className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="type-h3 text-text-primary">{e.course.title}</p>
                  <p className="mt-1 type-body-sm text-text-secondary">
                    {e.completedModules.length} module{e.completedModules.length !== 1 ? "s" : ""} completed
                  </p>
                </div>
                <StatusBadge
                  status={e.status === "completed" ? "completed" : "in-progress"}
                  label={e.status}
                />
              </div>
              <div className="mt-4">
                <div className="flex justify-between type-caption text-text-secondary mb-1">
                  <span>Progress</span>
                  <span className="font-semibold text-primary-600 dark:text-primary-400">{e.progress}%</span>
                </div>
                <ProgressBar value={e.progress} showLabel={false} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Progress;
