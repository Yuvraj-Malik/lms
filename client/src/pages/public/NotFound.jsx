import { Button } from "../../components/ui.jsx";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="tabular text-sm text-fg-subtle">404</p>
      <h1 className="mt-2 text-xl font-semibold">This page doesn't exist</h1>
      <p className="mt-1.5 text-sm text-fg-muted">The link may be old, or the page was moved.</p>
      <Button to="/" variant="primary" className="mt-6">
        Go home
      </Button>
    </div>
  );
}
