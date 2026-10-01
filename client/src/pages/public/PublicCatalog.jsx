import CourseCatalog from "../shared/CourseCatalog.jsx";

export default function PublicCatalog() {
  return (
    <div className="mx-auto max-w-[1120px] px-4 py-10 sm:px-6">
      <h1 className="text-[26px] font-semibold tracking-tight">Courses</h1>
      <p className="mb-8 mt-1 text-sm text-fg-muted">Every published course on Ridgeline. Create an account to enroll.</p>
      <CourseCatalog linkBase="/courses" />
    </div>
  );
}
