import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardApi } from "../../api/endpoints.js";
import { Card, Badge, Spinner, EmptyState } from "../../components/ui.jsx";

const StudentAssignments = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    dashboardApi.student().then(({ data }) => setData(data));
  }, []);

  if (!data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  const all = [...data.pendingAssignments, ...data.overdueAssignments];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink dark:text-dark-ink">Assignments</h1>

      {all.length === 0 ? (
        <EmptyState title="No assignments right now" description="Enroll in a course to see its assignments here." />
      ) : (
        <div className="mt-6 space-y-3">
          {all.map((a) => {
            const overdue = new Date(a.deadline) < new Date();
            return (
              <Link key={a._id} to={`/dashboard/assignments/${a._id}`}>
                <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
                  <div>
                    <p className="text-sm font-medium text-ink dark:text-dark-ink">{a.title}</p>
                    <p className="text-xs text-ink-soft dark:text-dark-ink-soft">{a.course?.title}</p>
                  </div>
                  <Badge tone={overdue ? "clay" : "amber"}>
                    {overdue ? "Overdue" : `Due ${new Date(a.deadline).toLocaleDateString()}`}
                  </Badge>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;
