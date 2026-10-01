import { useEffect, useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { courseApi, enrollmentApi } from "../../api/endpoints.js";
import { useAuth } from "../../context/AuthContext.jsx";
import useAsync from "../../lib/useAsync.js";
import CourseCard from "../../components/CourseCard.jsx";
import { EmptyState, ErrorState, SearchInput, Select, Segmented, cx } from "../../components/ui.jsx";

// Used both on the public /courses page and inside the student dashboard
export default function CourseCatalog({ linkBase }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sort, setSort] = useState("newest");

  // Debounce typing so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const categories = useAsync(async () => (await courseApi.categories()).data.categories, []);
  const courses = useAsync(
    async () => (await courseApi.list({ search: query || undefined, category: category || undefined, difficulty: difficulty || undefined, sort })).data.courses,
    [query, category, difficulty, sort]
  );
  const mine = useAsync(async () => (user?.role === "student" ? (await enrollmentApi.my()).data.enrollments : []), [user?._id]);

  const enrolledMap = useMemo(
    () => Object.fromEntries((mine.data || []).map((e) => [e.course._id, e])),
    [mine.data]
  );

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by title, topic or instructor" className="lg:w-80" />
        <div className="flex flex-wrap items-center gap-2">
          <Select value={category} onChange={(e) => setCategory(e.target.value)} selectClassName="w-48" aria-label="Category">
            <option value="">All categories</option>
            {(categories.data || []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Segmented
            value={difficulty}
            onChange={setDifficulty}
            options={[
              { value: "", label: "Any level" },
              { value: "Beginner", label: "Beginner" },
              { value: "Intermediate", label: "Intermediate" },
              { value: "Advanced", label: "Advanced" },
            ]}
          />
        </div>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} selectClassName="w-36" className="lg:ml-auto" aria-label="Sort">
          <option value="newest">Newest</option>
          <option value="title">A–Z</option>
          <option value="oldest">Oldest</option>
        </Select>
      </div>

      {courses.error ? (
        <ErrorState message={courses.error} onRetry={courses.reload} />
      ) : courses.loading && !courses.data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-72" />
          ))}
        </div>
      ) : courses.data.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface">
          <EmptyState icon={BookOpen} title="No courses match" description="Try a different search or clear the filters." />
        </div>
      ) : (
        <div className={cx("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", courses.loading && "opacity-60")}>
          {courses.data.map((c) => (
            <CourseCard key={c._id} course={c} to={`${linkBase}/${c._id}`} enrollment={enrolledMap[c._id]} />
          ))}
        </div>
      )}
    </div>
  );
}
