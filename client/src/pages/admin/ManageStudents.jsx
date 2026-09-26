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
      <h1 className="type-display font-semibold text-text-primary">Students</h1>
      <p className="mt-1 type-body-sm text-text-secondary">{students.length} registered students</p>

      {students.length === 0 ? (
        <EmptyState title="No students yet" description="Students will appear here once they register." />
      ) : (
        <div className="mt-6 space-y-3">
          {students.map((s) => (
            <Link key={s._id} to={`/admin/students/${s._id}`} className="block">
              <Card className="p-5 flex items-center justify-between transition-all hover:bg-bg-surface-raised/50 shadow-card">
                <div>
                  <p className="type-h3 text-text-primary">{s.name}</p>
                  <p className="type-body-sm text-text-secondary">{s.email}</p>
                </div>
                <div className="text-right">
                  <p className="type-h3 text-text-primary">{s.enrollmentCount}</p>
                  <p className="type-caption text-text-tertiary">enrollments</p>
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
