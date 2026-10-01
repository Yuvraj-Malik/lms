import CourseCatalog from "../shared/CourseCatalog.jsx";
import { PageHeader } from "../../components/ui.jsx";

export default function Catalog() {
  return (
    <>
      <PageHeader title="Course catalog" description="Every published course. Open one to see its syllabus and enroll." />
      <CourseCatalog linkBase="/dashboard/courses" />
    </>
  );
}
