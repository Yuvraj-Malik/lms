import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, CheckCircle2 } from "lucide-react";
import { courseApi, enrollmentApi } from "../../api/endpoints.js";
import { Card, Badge, Select, Spinner, EmptyState } from "../../components/ui.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";

const difficultyTone = { Beginner: "pine", Intermediate: "amber", Advanced: "clay" };

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sort, setSort] = useState("newest");
  const [tab, setTab] = useState("all"); // "all" | "enrolled"

  useEffect(() => {
    courseApi.categories().then(({ data }) => setCategories(data.categories));
  }, []);

  const loadEnrollments = useCallback(() => {
    enrollmentApi.my().then(({ data }) => setEnrollments(data.enrollments));
  }, []);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (category) params.category = category;
    if (difficulty) params.difficulty = difficulty;
    if (sort) params.sort = sort;
    const { data } = await courseApi.list(params);
    setCourses(data.courses);
    setLoading(false);
  }, [search, category, difficulty, sort]);

  useEffect(() => {
    const t = setTimeout(fetchCourses, 300); // debounce search typing
    return () => clearTimeout(t);
  }, [fetchCourses]);

  const enrollmentByCourseId = new Map(enrollments.map((e) => [e.course._id, e]));
  const visibleCourses = tab === "enrolled" ? courses.filter((c) => enrollmentByCourseId.has(c._id)) : courses;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink dark:text-dark-ink">Courses</h1>
      <p className="mt-1 text-sm text-ink-soft dark:text-dark-ink-soft">
        Browse the full catalog and jump back into the courses you're enrolled in.
      </p>

      <div className="mt-5 flex gap-2">
        <button
          onClick={() => setTab("all")}
          className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
            tab === "all"
              ? "bg-pine text-white dark:bg-pine-light dark:text-pine-dark"
              : "bg-surface-sunken text-ink-soft hover:text-ink dark:bg-dark-surface-sunken dark:text-dark-ink-soft"
          }`}
        >
          All Courses
        </button>
        <button
          onClick={() => setTab("enrolled")}
          className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
            tab === "enrolled"
              ? "bg-pine text-white dark:bg-pine-light dark:text-pine-dark"
              : "bg-surface-sunken text-ink-soft hover:text-ink dark:bg-dark-surface-sunken dark:text-dark-ink-soft"
          }`}
        >
          My Courses ({enrollments.length})
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft dark:text-dark-ink-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses by title, description or category"
            className="w-full rounded-lg border border-border bg-surface-raised py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-pine dark:border-dark-border dark:bg-dark-surface-raised dark:text-dark-ink"
          />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="">All difficulty levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </Select>
      </div>

      <div className="mt-3 flex justify-end">
        <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-auto">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title (A–Z)</option>
        </Select>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : visibleCourses.length === 0 ? (
          <EmptyState
            title={tab === "enrolled" ? "You haven't enrolled in anything yet" : "No courses match your filters"}
            description={
              tab === "enrolled"
                ? "Switch to 'All Courses' to find a course to enroll in."
                : "Try a different search term, or clear the category and difficulty filters."
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCourses.map((c) => {
              const enrollment = enrollmentByCourseId.get(c._id);
              return (
                <Link
                  key={c._id}
                  to={enrollment ? `/dashboard/my-courses/${c._id}` : `/dashboard/my-courses/${c._id}/details`}
                >
                  <Card className="relative h-full transition-shadow hover:shadow-md">
                    {enrollment && (
                      <span className="absolute -top-2.5 right-4 inline-flex items-center gap-1 rounded-full bg-pine px-2.5 py-1 text-xs font-medium text-white shadow-sm dark:bg-pine-light dark:text-pine-dark">
                        <CheckCircle2 size={12} /> Enrolled
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge tone="pine">{c.category}</Badge>
                      <Badge tone={difficultyTone[c.difficulty]}>{c.difficulty}</Badge>
                    </div>
                    <h3 className="mt-3 font-display text-lg font-semibold text-ink dark:text-dark-ink">{c.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-ink-soft dark:text-dark-ink-soft">{c.description}</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-ink-soft dark:text-dark-ink-soft">
                      <span>{c.instructor}</span>
                      <span>{c.duration}</span>
                    </div>
                    {enrollment && <ProgressBar value={enrollment.progress} className="mt-4" />}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;
