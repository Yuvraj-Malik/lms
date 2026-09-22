import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { courseApi } from "../../api/endpoints.js";
import { Card, Badge, Select, Spinner, EmptyState } from "../../components/ui.jsx";

const difficultyTone = { Beginner: "pine", Intermediate: "amber", Advanced: "clay" };

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    courseApi.categories().then(({ data }) => setCategories(data.categories));
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
    const t = setTimeout(fetchCourses, 300); // debounce search typing
    return () => clearTimeout(t);
  }, [fetchCourses]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink dark:text-dark-ink">Courses</h1>
      <p className="mt-2 text-sm text-ink-soft dark:text-dark-ink-soft">
        {courses.length} course{courses.length !== 1 ? "s" : ""} available
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
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
        ) : courses.length === 0 ? (
          <EmptyState
            title="No courses match your filters"
            description="Try a different search term, or clear the category and difficulty filters."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Link key={c._id} to={`/courses/${c._id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
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
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
