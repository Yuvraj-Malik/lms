import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../api/client.js";

// Loads data for a page and exposes { data, loading, error, reload, setData }.
// `loader` should return the parsed payload (e.g. `async () => (await api.x()).data`).
export default function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const alive = useRef(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps);

  const reload = useCallback(
    async ({ quiet = false } = {}) => {
      if (!quiet) setState((s) => ({ ...s, loading: true, error: "" }));
      try {
        const data = await run();
        if (alive.current) setState({ data, loading: false, error: "" });
        return data;
      } catch (err) {
        if (alive.current) setState((s) => ({ ...s, loading: false, error: getErrorMessage(err) }));
        return null;
      }
    },
    [run]
  );

  useEffect(() => {
    alive.current = true;
    reload();
    return () => {
      alive.current = false;
    };
  }, [reload]);

  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === "function" ? updater(s.data) : updater }));
  }, []);

  return { ...state, reload, setData };
}
