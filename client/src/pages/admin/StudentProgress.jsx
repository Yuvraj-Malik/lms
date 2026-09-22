import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { adminApi } from "../../api/endpoints.js";
import { Card, Badge, Spinner, EmptyState } from "../../components/ui.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";

const StudentProgress = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    adminApi.studentProgress(id).then(({ data }) => setData(data));
  }, [id]);

  if (!data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div>
      <Link to="/admin/students" className="text-xs font-medium text-pine dark:text-amber-light">
        ← Back to Students
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink dark:text-dark-ink">{data.student.name}</h1>
      <p className="text-sm text-ink-soft dark:text-dark-ink-soft">{data.student.email}</p>

      <div className="mt-6 space-y-4">
        {data.enrollments.length === 0 ? (
          <EmptyState title="Not enrolled in anything yet" />
        ) : (
          data.enrollments.map((e) => (
            <Card key={e._id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink dark:text-dark-ink">{e.course.title}</p>
                  <p className="text-xs text-ink-soft dark:text-dark-ink-soft">{e.course.category}</p>
                </div>
                <Badge tone={e.status === "completed" ? "pine" : "amber"}>{e.status}</Badge>
              </div>
              <ProgressBar value={e.progress} className="mt-3" />
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentProgress;
