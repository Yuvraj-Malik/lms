import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  CheckCircle2, 
  BookOpen, 
  Clock, 
  Code, 
  Database, 
  Cpu, 
  Layers, 
  Globe 
} from "lucide-react";
import { courseApi, enrollmentApi } from "../../api/endpoints.js";
import { Badge, Select, Spinner, EmptyState } from "../../components/ui.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";

// Fixed 3-value brand rotation for course headers
const BRAND_ROTATION = [
  { bg: "bg-[#4F46E5]", border: "border-primary-500/20", icon: "text-white" },
  { bg: "bg-[#8B7355]", border: "border-[#8B7355]/20", icon: "text-white" },
  { bg: "bg-[#64748B]", border: "border-slate-500/20", icon: "text-white" },
];

const getCategoryIcon = (category = "") => {
  const cat = category.toLowerCase();
  if (cat.includes("code") || cat.includes("web") || cat.includes("dev")) return Code;
  if (cat.includes("data") || cat.includes("sql") || cat.includes("cloud")) return Database;
  if (cat.includes("system") || cat.includes("ai") || cat.includes("ml")) return Cpu;
  if (cat.includes("design") || cat.includes("ui") || cat.includes("ux")) return Layers;
  if (cat.includes("network") || cat.includes("security")) return Globe;
  return BookOpen;
};

const CourseCard = ({ course, enrollment, accentIndex }) => {
  const rotation = BRAND_ROTATION[accentIndex % BRAND_ROTATION.length];
  const CategoryIcon = getCategoryIcon(course.category);
  const href = enrollment
    ? `/dashboard/my-courses/${course._id}`
    : `/dashboard/my-courses/${course._id}/details`;

  return (
    <Link to={href} className="group block focus:outline-none">
      <div className="overflow-hidden rounded-[10px] border border-border-subtle bg-bg-surface shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-raised hover:border-border-default">
        {/* Tonal header with fixed 3-value brand palette and category icon */}
        <div className={`relative h-24 ${rotation.bg} p-4 flex items-center justify-between`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-white/15 text-white backdrop-blur-sm shadow-sm">
            <CategoryIcon size={20} />
          </div>
          <div className="flex items-center gap-1.5">
            {enrollment && (
              <span className="inline-flex items-center gap-1 rounded-[4px] bg-black/25 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                <CheckCircle2 size={10} /> Enrolled
              </span>
            )}
            <span className="inline-flex items-center rounded-[4px] bg-black/25 px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase text-white backdrop-blur-sm">
              {course.difficulty}
            </span>
          </div>
        </div>

        {/* Card body */}
        <div className="p-6">
          <div className="mb-2">
            <span className="type-caption text-text-tertiary">
              {course.category}
            </span>
          </div>
          <h3 className="line-clamp-2 type-h3 text-text-primary group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {course.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 type-body-sm text-text-secondary">
            {course.description}
          </p>

          <div className="mt-4 flex items-center gap-4 text-xs text-text-tertiary">
            <span className="flex items-center gap-1.5">
              <BookOpen size={13} /> {course.instructor}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} /> {course.duration}
            </span>
          </div>

          {enrollment ? (
            <div className="mt-4 border-t border-border-subtle pt-3.5">
              <div className="mb-1.5 flex items-center justify-between type-caption">
                <span className="text-text-secondary">Progress</span>
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  {enrollment.progress}%
                </span>
              </div>
              <ProgressBar value={enrollment.progress} showLabel={false} />
            </div>
          ) : (
            <div className="mt-4 border-t border-border-subtle pt-3.5 flex items-center justify-between">
              <span className="type-body-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                View course details →
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-display text-text-primary">
            Course Catalog
          </h1>
          <p className="mt-1 type-body text-text-secondary">
            {courses.length} courses offered in academic catalog
          </p>
        </div>
      </div>

      {/* Segmented Tabs */}
      <div className="flex gap-1 rounded-[8px] border border-border-subtle bg-bg-surface-raised p-1">
        {[
          { key: "all", label: "All Courses" },
          { key: "enrolled", label: `My Courses (${enrollments.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-[6px] px-4 py-2 text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-bg-surface text-text-primary shadow-sm font-semibold"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters (16px gap) */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search
            size={14}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or topic…"
            className="h-9 w-full rounded-[6px] border border-border-default bg-bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15"
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

      {/* Sort & Count */}
      <div className="flex items-center justify-between">
        <p className="type-body-sm text-text-secondary">
          {loading ? "Loading courses…" : `Showing ${visible.length} ${tab === "enrolled" ? "enrolled" : ""} courses`}
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
              ? "Select 'All Courses' to find courses to enroll in."
              : "Adjust your search keywords or filter criteria."
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
