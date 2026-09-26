import { Link } from "react-router-dom";
import { Button } from "../../components/ui.jsx";
import { RidgelineMark } from "../../components/BrandLogo.jsx";

const NotFound = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
    <div className="mb-4">
      <RidgelineMark size={40} />
    </div>
    <p className="text-6xl font-bold tracking-tight text-primary-600 dark:text-primary-400">404</p>
    <h1 className="mt-3 type-h2 text-text-primary">Page not found</h1>
    <p className="mt-2 type-body text-text-secondary max-w-sm">
      The requested route or document could not be located in this directory.
    </p>
    <div className="mt-6">
      <Link to="/">
        <Button variant="primary" size="md">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  </div>
);

export default NotFound;
