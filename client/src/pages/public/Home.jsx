import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { courseApi } from "../../api/endpoints.js";
import { Card, Badge } from "../../components/ui.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const Home = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    courseApi.list({ sort: "newest" }).then(({ data }) => setCourses(data.courses.slice(0, 3)));
  }, []);

  return (
    <div>
      <section className="border-b border-border dark:border-dark-border">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center">
            <span className="mb-4 w-fit rounded-full border border-border px-3 py-1 text-xs font-medium text-ink-soft dark:border-dark-border dark:text-dark-ink-soft">
              A learning platform for people who finish what they start
            </span>
            <h1 className="font-display text-4xl font-semibold leading-[1.1] text-ink sm:text-5xl dark:text-dark-ink">
              Every course is a
              <br />
              <span className="text-pine dark:text-amber-light">ridgeline to climb.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft dark:text-dark-ink-soft">
              Enroll in a course, work through it module by module, submit your assignments, and
              watch your progress trail fill in as you go. No noise — just the next module ahead of you.
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                to="/courses"
                className="rounded-lg bg-pine px-5 py-2.5 text-sm font-medium text-white hover:bg-pine-light"
              >
                Browse courses
              </Link>
              {!user && (
                <Link
                  to="/register"
                  className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-ink hover:bg-surface-sunken dark:border-dark-border dark:text-dark-ink dark:hover:bg-dark-surface-sunken"
                >
                  Create an account
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <svg viewBox="0 0 360 260" className="w-full max-w-sm">
              <polygon points="0,260 60,120 110,180 170,60 240,180 300,100 360,260" fill="var(--color-surface-sunken)" className="dark:opacity-20" />
              <polygon points="0,260 60,120 110,180 170,60 200,110 150,260" fill="var(--color-pine)" opacity="0.9" />
              <polygon points="150,260 200,110 240,180 300,100 360,260" fill="var(--color-amber)" opacity="0.85" />
              <circle cx="170" cy="60" r="6" fill="var(--color-ink)" className="dark:fill-[var(--color-dark-ink)]" />
              <path d="M20,240 Q120,150 170,60" stroke="var(--color-ink)" strokeWidth="1.5" strokeDasharray="4 5" fill="none" opacity="0.4" />
            </svg>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink dark:text-dark-ink">Recently added</h2>
          <Link to="/courses" className="text-sm font-medium text-pine dark:text-amber-light">
            View all courses
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link key={c._id} to={`/courses/${c._id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <Badge tone="pine">{c.category}</Badge>
                <h3 className="mt-3 font-display text-lg font-semibold text-ink dark:text-dark-ink">{c.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-ink-soft dark:text-dark-ink-soft">{c.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-ink-soft dark:text-dark-ink-soft">
                  <span>{c.instructor}</span>
                  <span>{c.duration}</span>
                </div>
              </Card>
            </Link>
          ))}
          {courses.length === 0 && (
            <p className="text-sm text-ink-soft dark:text-dark-ink-soft">
              No courses yet — check back soon, or log in as an admin to add the first one.
            </p>
          )}
        </div>
      </section>

      <section className="border-t border-border py-16 dark:border-dark-border">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-3">
          {[
            { title: "Structured modules", body: "Content is broken into an ordered sequence, so you always know what's next." },
            { title: "Real deadlines", body: "Assignments have deadlines and marks — submit text, a link, or a file." },
            { title: "Visible progress", body: "A live progress trail shows completion for every course you're enrolled in." },
          ].map((f) => (
            <div key={f.title}>
              <h3 className="font-display text-base font-semibold text-ink dark:text-dark-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft dark:text-dark-ink-soft">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
