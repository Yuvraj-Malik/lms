import { Link } from "react-router-dom";
import { Badge, ProgressBar, cx } from "./ui.jsx";
import { plural } from "../lib/format.js";

export const CourseCover = ({ course, className }) =>
  course.image ? (
    <img src={course.image} alt="" loading="lazy" className={cx("aspect-[16/9] w-full object-cover", className)} />
  ) : (
    <div className={cx("flex aspect-[16/9] w-full items-end bg-muted p-3", className)}>
      <span className="text-xs font-medium text-fg-muted">{course.category}</span>
    </div>
  );

export default function CourseCard({ course, to, enrollment }) {
  return (
    <Link to={to} className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-colors hover:border-line-strong">
      <CourseCover course={course} className="border-b border-line" />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-xs text-fg-muted">
          <span>{course.category}</span>
          <span className="text-fg-subtle">·</span>
          <span>{course.difficulty}</span>
          {enrollment && (
            <Badge tone={enrollment.status === "completed" ? "ok" : "accent"} className="ml-auto">
              {enrollment.status === "completed" ? "Completed" : "Enrolled"}
            </Badge>
          )}
        </div>
        <h3 className="mt-1.5 text-[15px] font-semibold leading-snug text-fg group-hover:underline group-hover:underline-offset-4">{course.title}</h3>
        <p className="mt-1 text-[13px] text-fg-muted">{course.instructor}</p>
        <div className="mt-auto pt-4">
          {enrollment ? (
            <div className="flex items-center gap-3">
              <ProgressBar value={enrollment.progress} size="sm" tone={enrollment.status === "completed" ? "ok" : "accent"} />
              <span className="tabular text-xs text-fg-muted">{enrollment.progress}%</span>
            </div>
          ) : (
            <div className="text-xs text-fg-muted">
              {plural(course.moduleCount ?? 0, "module")} · {course.duration}
              {course.enrolledCount ? ` · ${plural(course.enrolledCount, "learner")}` : ""}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
