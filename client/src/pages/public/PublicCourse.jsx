import CourseOverview from "../shared/CourseOverview.jsx";

export default function PublicCourse() {
  return (
    <div className="mx-auto max-w-[1120px] px-4 py-10 sm:px-6">
      <CourseOverview backTo="/courses" backLabel="All courses" />
    </div>
  );
}
