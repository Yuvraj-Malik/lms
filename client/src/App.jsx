import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import {
  BookOpen,
  ClipboardList,
  Compass,
  FileCheck2,
  Home,
  LayoutDashboard,
  Megaphone,
  Settings,
  ShieldCheck,
  TrendingUp,
  User,
  Users as UsersIcon,
  Library,
} from "lucide-react";

import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { FeedbackProvider } from "./components/ui.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AppShell from "./components/AppShell.jsx";
import PublicLayout from "./components/PublicLayout.jsx";

import Home_ from "./pages/public/Home.jsx";
import PublicCatalog from "./pages/public/PublicCatalog.jsx";
import PublicCourse from "./pages/public/PublicCourse.jsx";
import Login from "./pages/public/Login.jsx";
import Register from "./pages/public/Register.jsx";
import ForgotPassword from "./pages/public/ForgotPassword.jsx";
import ResetPassword from "./pages/public/ResetPassword.jsx";
import VerifyCertificate from "./pages/public/VerifyCertificate.jsx";
import NotFound from "./pages/public/NotFound.jsx";

import StudentHome from "./pages/student/StudentHome.jsx";
import MyCourses from "./pages/student/MyCourses.jsx";
import Catalog from "./pages/student/Catalog.jsx";
import StudentCourse from "./pages/student/StudentCourse.jsx";
import Learn from "./pages/student/Learn.jsx";
import Assignments from "./pages/student/Assignments.jsx";
import AssignmentDetail from "./pages/student/AssignmentDetail.jsx";
import Progress from "./pages/student/Progress.jsx";
import Profile from "./pages/student/Profile.jsx";
import CertificatePage from "./pages/student/CertificatePage.jsx";
import AccountSettings from "./pages/shared/AccountSettings.jsx";

import AdminOverview from "./pages/admin/AdminOverview.jsx";
import AdminCourses from "./pages/admin/AdminCourses.jsx";
import CourseEditor, { NewCourse } from "./pages/admin/CourseEditor.jsx";
import AdminSubmissions from "./pages/admin/AdminSubmissions.jsx";
import AdminStudents from "./pages/admin/AdminStudents.jsx";
import StudentDetail from "./pages/admin/StudentDetail.jsx";
import Announcements from "./pages/admin/Announcements.jsx";
import Users from "./pages/admin/Users.jsx";

const studentNav = [
  {
    items: [
      { to: "/dashboard", label: "Home", icon: Home, end: true },
      { to: "/dashboard/courses", label: "My courses", icon: BookOpen },
      { to: "/dashboard/assignments", label: "Assignments", icon: ClipboardList },
      { to: "/dashboard/progress", label: "Progress", icon: TrendingUp },
    ],
  },
  {
    title: "Explore",
    items: [{ to: "/dashboard/catalog", label: "Course catalog", icon: Compass }],
  },
  {
    title: "You",
    items: [
      { to: "/dashboard/profile", label: "Profile & certificates", icon: User },
      { to: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

const adminNav = (isSuper) => [
  {
    items: [
      { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/admin/courses", label: "Courses", icon: Library },
      { to: "/admin/submissions", label: "Submissions", icon: FileCheck2 },
      { to: "/admin/students", label: "Students", icon: UsersIcon },
      { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
    ],
  },
  ...(isSuper ? [{ title: "Super admin", items: [{ to: "/admin/users", label: "Users & roles", icon: ShieldCheck }] }] : []),
  { title: "You", items: [{ to: "/admin/settings", label: "Settings", icon: Settings }] },
];

// Old URLs that may still be in notifications from before the redesign
const LegacyCourseRedirect = () => {
  const { courseId } = useParams();
  return <Navigate to={`/dashboard/courses/${courseId}/learn`} replace />;
};

const AdminShell = () => {
  const { isSuper } = useAuth();
  return <AppShell sections={adminNav(isSuper)} />;
};

export default function App() {
  return (
    <ThemeProvider>
      <FeedbackProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home_ />} />
                <Route path="/courses" element={<PublicCatalog />} />
                <Route path="/courses/:courseId" element={<PublicCourse />} />
                <Route path="/verify" element={<VerifyCertificate />} />
                <Route path="/verify/:credentialId" element={<VerifyCertificate />} />
              </Route>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              <Route element={<ProtectedRoute role="student" />}>
                <Route element={<AppShell sections={studentNav} />}>
                  <Route path="/dashboard" element={<StudentHome />} />
                  <Route path="/dashboard/courses" element={<MyCourses />} />
                  <Route path="/dashboard/catalog" element={<Catalog />} />
                  <Route path="/dashboard/courses/:courseId" element={<StudentCourse />} />
                  <Route path="/dashboard/courses/:courseId/learn" element={<Learn />} />
                  <Route path="/dashboard/assignments" element={<Assignments />} />
                  <Route path="/dashboard/assignments/:id" element={<AssignmentDetail />} />
                  <Route path="/dashboard/progress" element={<Progress />} />
                  <Route path="/dashboard/profile" element={<Profile />} />
                  <Route path="/dashboard/certificates/:enrollmentId" element={<CertificatePage />} />
                  <Route path="/dashboard/settings" element={<AccountSettings />} />
                  <Route path="/dashboard/my-courses" element={<Navigate to="/dashboard/courses" replace />} />
                  <Route path="/dashboard/my-courses/:courseId/*" element={<LegacyCourseRedirect />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute role="admin" />}>
                <Route element={<AdminShell />}>
                  <Route path="/admin" element={<AdminOverview />} />
                  <Route path="/admin/courses" element={<AdminCourses />} />
                  <Route path="/admin/courses/new" element={<NewCourse />} />
                  <Route path="/admin/courses/:courseId" element={<CourseEditor />} />
                  <Route path="/admin/submissions" element={<AdminSubmissions />} />
                  <Route path="/admin/students" element={<AdminStudents />} />
                  <Route path="/admin/students/:id" element={<StudentDetail />} />
                  <Route path="/admin/announcements" element={<Announcements />} />
                  <Route path="/admin/settings" element={<AccountSettings />} />
                  <Route element={<ProtectedRoute role="admin" superOnly />}>
                    <Route path="/admin/users" element={<Users />} />
                  </Route>
                </Route>
              </Route>

              <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </FeedbackProvider>
    </ThemeProvider>
  );
}
