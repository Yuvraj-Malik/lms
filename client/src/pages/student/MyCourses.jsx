import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, CheckCircle2, BookOpen, Clock, BarChart2, Filter } from "lucide-react";
import { courseApi, enrollmentApi } from "../../api/endpoints.js";
import { Badge, Select, Spinner, EmptyState, Button } from "../../components/ui.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";

const ACCENTS = [
  { bg: "from-[#166534] to-[#16a34a]", text: "text-[#bbf7d0]" },
  { bg: "from-[#0284c7] to-[#0ea5e9]", text: "text-[#bae6fd]" },
  { bg: "from-[#7c3aed] to-[#a855f7]", text: "text-[#e9d5ff]" },
  { bg: "from-[#d97706] to-[#f59e0b]", text: "text-[#fde68a]" },
  { bg: "from-[#dc2626] to-[#ef4444]", text: "text-[#fecaca]" },
  { bg: "from-[#0f766e] to-[#14b8a6]", text: "text-[#ccfbf1]" },
];

const difficultyTone = { Beginner: "pine", Intermediate: "amber", Advanced: "clay" };

const CourseCard = ({ course, enrollment, accentIndex }) => {
  const accent = ACCENTS[accentIndex % ACCENTS.length];
  const href = enrollment
    ? `/dashboard/my-courses/${course._id}`
    : `/dashboard/my-courses/${course._id}/details`;

  return (
    <Link to={href} className="group block">
      <div className="overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-dark-border dark:bg-dark-surface-raised">
        {/* Color strip header */}
        <div className={`relative h-28 bg-gradient-to-br ${accent.bg} p-4`}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, white 0%, transparent 60%)" }} />
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-xl font-bold text-white backdrop-blur-sm">
            {course.title[0]}
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
            {enrollment && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                <CheckCircle2 size={10} /> Enrolled
              </span>
            )}
            <Badge tone={difficultyTone[course.difficulty]} size="xs">
              {course.difficulty}
            </Badge>
          </div>
        </div>

        {/* Card body */}
        <div className="p-4">
          <div className="mb-2">
            <Badge tone="neutral" size="xs">{course.category}</Badge>
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-pine dark:text-dark-ink dark:group-hover:text-pine-lighter">
            {course.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-xs text-ink-soft dark:text-dark-ink-soft">
            {course.description}
          </p>

          <div className="mt-3 flex items-center gap-3 text-[11px] text-ink-muted dark:text-dark-ink-muted">
            <span className="flex items-center gap-1">
              <BookOpen size={11} /> {course.instructor}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} /> {course.duration}
            </span>
          </div>

          {enrollment ? (
            <div className="mt-3 border-t border-border pt-3 dark:border-dark-border">
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="font-medium text-ink-soft dark:text-dark-ink-soft">Progress</span>
                <span className="font-semibold text-pine dark:text-pine-lighter">
                  {enrollment.progress}%
                </span>
              </div>
              <ProgressBar value={enrollment.progress} showLabel={false} />
            </div>
          ) : (
            <div className="mt-3 border-t border-border pt-3 dark:border-dark-border">
              <span className="text-xs font-medium text-pine dark:text-pine-lighter">
                View course →
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sort, setSort] = useState("newest");
  const [tab, setTab] = useState("all");

  useEffect(() => {
    courseApi.categories().then(({ data }) => setCategories(data.categories));
    enrollmentApi.my().then(({ data }) => setEnrollments(data.enrollments));
  }, []);

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
    const t = setTimeout(fetchCourses, 300);
    return () => clearTimeout(t);
  }, [fetchCourses]);

  const enrollmentMap = new Map(enrollments.map((e) => [e.course._id, e]));
  const visible =
    tab === "enrolled"
      ? courses.filter((c) => enrollmentMap.has(c._id))
      : courses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink dark:text-dark-ink">
            Course Catalog
          </h1>
          <p className="mt-0.5 text-sm text-ink-soft dark:text-dark-ink-soft">
            {courses.length} courses available
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-surface-sunken p-1 dark:border-dark-border dark:bg-dark-surface">
        {[
          { key: "all", label: "All Courses" },
          { key: "enrolled", label: `My Courses (${enrollments.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-surface-raised text-ink shadow-sm dark:bg-dark-surface-raised dark:text-dark-ink"
                : "text-ink-soft hover:text-ink dark:text-dark-ink-soft dark:hover:text-dark-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-dark-ink-muted"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or description…"
            className="h-9 w-full rounded-lg border border-border bg-surface-raised pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted outline-none transition-colors focus:border-pine-light focus:ring-2 focus:ring-pine-light/15 dark:border-dark-border dark:bg-dark-surface-raised dark:text-dark-ink dark:placeholder:text-dark-ink-muted"
          />
        </div>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="">All levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </Select>
      </div>

      {/* Sort */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-muted dark:text-dark-ink-muted">
          {loading ? "Loading…" : `Showing ${visible.length} ${tab === "enrolled" ? "enrolled" : ""} courses`}
        </p>
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-auto"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title (A–Z)</option>
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex min-h-48 items-center justify-center">
          <Spinner size={28} />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={tab === "enrolled" ? "No enrolled courses" : "No courses found"}
          description={
            tab === "enrolled"
              ? "Switch to 'All Courses' to find a course to enroll in."
              : "Try adjusting your search or filters."
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((c, i) => (
            <CourseCard
              key={c._id}
              course={c}
              enrollment={enrollmentMap.get(c._id)}
              accentIndex={i}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
