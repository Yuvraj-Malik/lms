import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Pencil, Layers, ClipboardList, Users } from "lucide-react";
import { courseApi } from "../../api/endpoints.js";
import { Card, Badge, Button, Spinner, EmptyState } from "../../components/ui.jsx";

const ManageCourses = () => {
  const [courses, setCourses] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = () => courseApi.list({ sort: "newest" }).then(({ data }) => setCourses(data.courses));

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This removes its modules, assignments and submissions too.`)) return;
    setDeletingId(id);
    try {
      await courseApi.remove(id);
      await load();
    } finally {
      setDeletingId(null);
    }
  };

  if (!courses) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-dark-ink">Manage Courses</h1>
        <Link to="/admin/courses/new">
          <Button>
            <Plus size={16} /> New course
          </Button>
        </Link>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Create your first course to get started."
          action={
            <Link to="/admin/courses/new">
              <Button>
                <Plus size={16} /> New course
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="mt-6 space-y-3">
          {courses.map((c) => (
            <Card key={c._id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/courses/${c._id}/enrollments`}
                    className="font-medium text-ink hover:text-pine hover:underline dark:text-dark-ink dark:hover:text-amber-light"
                  >
                    {c.title}
                  </Link>
                  <Badge tone="pine">{c.category}</Badge>
                  <Badge>{c.difficulty}</Badge>
                </div>
                <p className="mt-1 text-xs text-ink-soft dark:text-dark-ink-soft">
                  {c.instructor} · {c.duration}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link to={`/admin/courses/${c._id}/enrollments`}>
                  <Button variant="secondary">
                    <Users size={14} /> Enrollments
                  </Button>
                </Link>
                <Link to={`/admin/courses/${c._id}/modules`}>
                  <Button variant="secondary">
                    <Layers size={14} /> Modules
                  </Button>
                </Link>
                <Link to={`/admin/courses/${c._id}/assignments`}>
                  <Button variant="secondary">
                    <ClipboardList size={14} /> Assignments
                  </Button>
                </Link>
                <Link to={`/admin/courses/${c._id}/edit`}>
                  <Button variant="secondary">
                    <Pencil size={14} /> Edit
                  </Button>
                </Link>
                <Button variant="danger" onClick={() => handleDelete(c._id, c.title)} disabled={deletingId === c._id}>
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageCourses;
