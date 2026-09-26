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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-display text-text-primary">Course Catalog Management</h1>
          <p className="mt-1 type-body text-text-secondary">
            Manage course syllabi, modules, enrolled rosters, and assignments
          </p>
        </div>
        <Link to="/admin/courses/new">
          <Button variant="primary">
            <Plus size={16} /> New Course
          </Button>
        </Link>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          title="No courses published"
          description="Create your first institutional course offering to get started."
          action={
            <Link to="/admin/courses/new">
              <Button variant="primary">
                <Plus size={16} /> Create Course
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {courses.map((c) => (
            <Card key={c._id} className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <Link
                    to={`/admin/courses/${c._id}/enrollments`}
                    className="type-h3 text-text-primary hover:text-primary-600 hover:underline transition-colors"
                  >
                    {c.title}
                  </Link>
                  <span className="type-caption rounded-[4px] border border-primary-500/20 bg-primary-50 px-2 py-0.5 text-primary-700 dark:bg-primary-600/15 dark:text-primary-400">
                    {c.category}
                  </span>
                  <span className="type-caption rounded-[4px] border border-border-default bg-bg-surface-raised px-2 py-0.5 text-text-secondary">
                    {c.difficulty}
                  </span>
                </div>
                <p className="mt-1 type-body-sm text-text-secondary">
                  Instructor: {c.instructor} &bull; Duration: {c.duration}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link to={`/admin/courses/${c._id}/enrollments`}>
                  <Button variant="secondary" size="sm">
                    <Users size={14} /> Enrollments
                  </Button>
                </Link>
                <Link to={`/admin/courses/${c._id}/modules`}>
                  <Button variant="secondary" size="sm">
                    <Layers size={14} /> Modules
                  </Button>
                </Link>
                <Link to={`/admin/courses/${c._id}/assignments`}>
                  <Button variant="secondary" size="sm">
                    <ClipboardList size={14} /> Assignments
                  </Button>
                </Link>
                <Link to={`/admin/courses/${c._id}/edit`}>
                  <Button variant="secondary" size="sm">
                    <Pencil size={14} /> Edit
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(c._id, c.title)}
                  disabled={deletingId === c._id}
                >
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
