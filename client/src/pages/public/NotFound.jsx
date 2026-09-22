import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
    <p className="font-display text-6xl font-semibold text-pine dark:text-pine-light">404</p>
    <p className="mt-3 text-base text-ink-soft dark:text-dark-ink-soft">
      There's no trail here. This page doesn't exist.
    </p>
    <Link to="/" className="mt-6 text-sm font-medium text-pine dark:text-amber-light">
      Back to home
    </Link>
  </div>
);

export default NotFound;
