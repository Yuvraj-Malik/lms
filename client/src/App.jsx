import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { 
  BookOpen, 
  LayoutDashboard, 
  ClipboardList, 
  TrendingUp, 
  BookOpenCheck, 
  Users, 
  Settings, 
  FileCheck2, 
  User 
} from "lucide-react";

import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DashboardShell from "./components/DashboardShell.jsx";

import Login from "./pages/public/Login.jsx";
import Register from "./pages/public/Register.jsx";
import ForgotPassword from "./pages/public/ForgotPassword.jsx";
import ResetPassword from "./pages/public/ResetPassword.jsx";
import Profile from "./pages/public/Profile.jsx";
import NotFound from "./pages/public/NotFound.jsx";

import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import MyCourses from "./pages/student/MyCourses.jsx";
import CourseDetails from "./pages/student/CourseDetails.jsx";
import CourseModules from "./pages/student/CourseModules.jsx";
import StudentAssignments from "./pages/student/StudentAssignments.jsx";
import AssignmentDetail from "./pages/student/AssignmentDetail.jsx";
import Progress from "./pages/student/Progress.jsx";
import StudentSettings from "./pages/student/StudentSettings.jsx";

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import ManageCourses from "./pages/admin/ManageCourses.jsx";
import CourseEnrollments from "./pages/admin/CourseEnrollments.jsx";
import AddEditCourse from "./pages/admin/AddEditCourse.jsx";
import ManageModules from "./pages/admin/ManageModules.jsx";
import ManageAssignments from "./pages/admin/ManageAssignments.jsx";
import ViewSubmissions from "./pages/admin/ViewSubmissions.jsx";
import ManageStudents from "./pages/admin/ManageStudents.jsx";
import StudentProgress from "./pages/admin/StudentProgress.jsx";
import AdminSubmissions from "./pages/admin/AdminSubmissions.jsx";
import AdminSettings from "./pages/admin/AdminSettings.jsx";

const studentLinks = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/my-courses", label: "Courses", icon: BookOpen },
  { to: "/dashboard/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/dashboard/progress", label: "Progress", icon: TrendingUp },
  { to: "/dashboard/profile", label: "Profile", icon: User },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

const adminLinks = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/courses", label: "Courses", icon: BookOpenCheck },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/submissions", label: "Submissions", icon: FileCheck2 },
  { to: "/admin/settings", label: "Users & Settings", icon: Settings },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const isRegisterPage = location.pathname === "/register";

  if (isLoginPage) {
    return <main className="h-screen w-full overflow-hidden">{children}</main>;
  }

  if (isRegisterPage) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-pine border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              {/* Public */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Any authenticated user */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
              </Route>

              {/* Student */}
              <Route element={<ProtectedRoute role="student" />}>
                <Route element={<DashboardShell title="Student" links={studentLinks} />}>
                  <Route path="/dashboard" element={<StudentDashboard />} />
                  <Route path="/dashboard/my-courses" element={<MyCourses />} />
                  <Route path="/dashboard/my-courses/:courseId/details" element={<CourseDetails />} />
                  <Route path="/dashboard/my-courses/:courseId" element={<CourseModules />} />
                  <Route path="/dashboard/assignments" element={<StudentAssignments />} />
                  <Route path="/dashboard/assignments/:id" element={<AssignmentDetail />} />
                  <Route path="/dashboard/progress" element={<Progress />} />
                  <Route path="/dashboard/profile" element={<Profile />} />
                  <Route path="/dashboard/settings" element={<StudentSettings />} />
                </Route>
              </Route>

              {/* Admin */}
              <Route element={<ProtectedRoute role="admin" />}>
                <Route element={<DashboardShell title="Admin" links={adminLinks} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/courses" element={<ManageCourses />} />
                  <Route path="/admin/courses/new" element={<AddEditCourse />} />
                  <Route path="/admin/courses/:id/edit" element={<AddEditCourse />} />
                  <Route path="/admin/courses/:courseId/enrollments" element={<CourseEnrollments />} />
                  <Route path="/admin/courses/:courseId/modules" element={<ManageModules />} />
                  <Route path="/admin/courses/:courseId/assignments" element={<ManageAssignments />} />
                  <Route path="/admin/assignments/:assignmentId/submissions" element={<ViewSubmissions />} />
                  <Route path="/admin/submissions" element={<AdminSubmissions />} />
                  <Route path="/admin/students" element={<ManageStudents />} />
                  <Route path="/admin/students/:id" element={<StudentProgress />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
