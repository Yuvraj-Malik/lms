import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/endpoints.js";
import { Card, Spinner, EmptyState } from "../../components/ui.jsx";

const ManageStudents = () => {
  const [students, setStudents] = useState(null);

  useEffect(() => {
    adminApi.students().then(({ data }) => setStudents(data.students));
  }, []);

  if (!students) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink dark:text-dark-ink">Students</h1>
      <p className="mt-1 text-sm text-ink-soft dark:text-dark-ink-soft">{students.length} registered</p>

      {students.length === 0 ? (
        <EmptyState title="No students yet" description="Students will appear here once they register." />
      ) : (
        <div className="mt-6 space-y-2">
          {students.map((s) => (
            <Link key={s._id} to={`/admin/students/${s._id}`}>
              <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
                <div>
                  <p className="text-sm font-medium text-ink dark:text-dark-ink">{s.name}</p>
                  <p className="text-xs text-ink-soft dark:text-dark-ink-soft">{s.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-ink dark:text-dark-ink">{s.enrollmentCount}</p>
                  <p className="text-xs text-ink-soft dark:text-dark-ink-soft">enrollments</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageStudents;
