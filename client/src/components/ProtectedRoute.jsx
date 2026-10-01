import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, homePathFor } from "../context/AuthContext.jsx";
import { Spinner } from "./ui.jsx";

const ProtectedRoute = ({ role, superOnly = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role) return <Navigate to={homePathFor(user)} replace />;
  if (superOnly && !user.isSuperAdmin) return <Navigate to="/admin" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
