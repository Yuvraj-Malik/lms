import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { courseApi, moduleApi, enrollmentApi } from "../../api/endpoints.js";
import { Card, Button, Spinner } from "../../components/ui.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";

const CourseModules = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = async () => {
    setLoading(true);
    const [courseRes, modulesRes, statusRes] = await Promise.all([
      courseApi.get(courseId),
      moduleApi.listForCourse(courseId),
      enrollmentApi.status(courseId),
    ]);
    setCourse(courseRes.data.course);
    setModules(modulesRes.data.modules);
    setEnrollment(statusRes.data.enrollment);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleComplete = async (moduleId) => {
    setCompletingId(moduleId);
    try {
      const { data } = await moduleApi.complete(moduleId);
      setEnrollment(data.enrollment);
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }
  if (!course || !enrollment) return null;

  return (
    <div>
      <Link to="/dashboard/my-courses" className="text-xs font-medium text-pine dark:text-amber-light">
        ← Back to My Courses
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink dark:text-dark-ink">{course.title}</h1>
      <ProgressBar value={enrollment.progress} className="mt-4 max-w-sm" />

      <div className="mt-8 space-y-3">
        {modules.map((m) => {
          const done = enrollment.completedModules?.includes(m._id);
          const open = openId === m._id;
          return (
            <Card key={m._id}>
              <button
                onClick={() => setOpenId(open ? null : m._id)}
                className="flex w-full items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  {done ? (
                    <CheckCircle2 size={20} className="shrink-0 text-pine dark:text-pine-light" />
                  ) : (
                    <Circle size={20} className="shrink-0 text-ink-soft dark:text-dark-ink-soft" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-ink dark:text-dark-ink">
                      {m.moduleOrder}. {m.title}
                    </p>
                    {m.description && (
                      <p className="text-xs text-ink-soft dark:text-dark-ink-soft">{m.description}</p>
                    )}
                  </div>
                </div>
              </button>

              {open && (
                <div className="mt-4 border-t border-border pt-4 dark:border-dark-border">
                  {m.notes && (
                    <p className="text-sm leading-relaxed text-ink-soft dark:text-dark-ink-soft">{m.notes}</p>
                  )}
                  {m.resourceLinks?.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {m.resourceLinks.map((link, i) => (
                        <li key={i}>
                          <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-sm text-pine hover:underline dark:text-amber-light"
                          >
                            <ExternalLink size={13} /> {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!done && (
                    <Button
                      className="mt-4"
                      onClick={() => handleComplete(m._id)}
                      disabled={completingId === m._id}
                    >
                      {completingId === m._id ? "Marking complete…" : "Mark as complete"}
                    </Button>
                  )}
                </div>
              )}
            </Card>
          );
        })}
        {modules.length === 0 && (
          <p className="text-sm text-ink-soft dark:text-dark-ink-soft">No modules published yet for this course.</p>
        )}
      </div>
    </div>
  );
};

export default CourseModules;
