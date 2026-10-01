import { Navigate } from "react-router-dom";
import { useAuth, homePathFor } from "../../context/AuthContext.jsx";
import { courseApi } from "../../api/endpoints.js";
import useAsync from "../../lib/useAsync.js";
import CourseCard from "../../components/CourseCard.jsx";
import { Button } from "../../components/ui.jsx";
import { usePlatform } from "../../context/PlatformContext.jsx";

const STEPS = [
  ["Enroll", "Browse the catalog and join a course in one click. Everything you join shows up on your dashboard."],
  ["Learn in order", "Each course is split into ordered modules with notes, links and a short quiz to check what stuck."],
  ["Submit and get graded", "Hand in work as text, a file, or a GitHub, Drive or project link. Marks and feedback come back to you."],
];

const FOR_INSTRUCTORS = [
  "Build courses, modules and quizzes without touching code",
  "Post assignments and grade submissions with written feedback",
  "See every student's progress, quiz results and late work",
];

export default function Home() {
  const { user, loading } = useAuth();
  const { platform } = usePlatform();
  const featured = useAsync(async () => (await courseApi.list({ sort: "newest" })).data.courses.slice(0, 3), []);

  if (!loading && user) return <Navigate to={homePathFor(user)} replace />;

  return (
    <div>
      <section className="mx-auto max-w-[1120px] px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
        <p className="text-sm font-medium text-accent-fg">{platform.platformName} learning management system</p>
        <h1 className="mt-3 max-w-2xl text-[40px] font-semibold leading-[1.1] tracking-[-0.025em] sm:text-5xl">
          Courses, quizzes and assignments, all in one place.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-fg-muted">
          Students work through modules at their own pace and always know what's due next. Instructors publish content,
          set work and grade it from a single dashboard.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {platform.registrationOpen ? (
            <Button to="/register" variant="primary" size="lg">
              Create a free account
            </Button>
          ) : (
            <Button to="/login" variant="primary" size="lg">
              Sign in
            </Button>
          )}
          <Button to="/courses" size="lg">
            Browse courses
          </Button>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-[1120px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <div key={title}>
              <div className="tabular text-[13px] text-fg-subtle">0{i + 1}</div>
              <h2 className="mt-2 text-base font-semibold">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-4 py-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold">Recently added courses</h2>
          <Button to="/courses" variant="ghost" size="sm">
            See all courses
          </Button>
        </div>
        {featured.loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-72" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(featured.data || []).map((c) => (
              <CourseCard key={c._id} course={c} to={`/courses/${c._id}`} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-[1120px] px-4 pb-20 sm:px-6">
        <div className="grid gap-8 rounded-lg border border-line bg-surface p-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold">Teaching a course?</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              Instructor accounts are created by the platform's super admin, or with an access code they share with you.
            </p>
          </div>
          <ul className="space-y-2.5 text-sm">
            {FOR_INSTRUCTORS.map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-2 h-1 w-3 shrink-0 bg-accent" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
