import { useState } from "react";
import { Link } from "react-router-dom";
import { History } from "lucide-react";
import { adminApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import useAsync from "../../lib/useAsync.js";
import { fmtDateTime } from "../../lib/format.js";
import { Badge, Button, EmptyState, ErrorState, PageHeader, PageLoader, Select, Table, Td, Th, cx, useFeedback } from "../../components/ui.jsx";

const AREAS = [
  ["", "Everything"],
  ["course", "Courses"],
  ["module", "Modules"],
  ["assignment", "Assignments"],
  ["submission", "Grading"],
  ["enrollment", "Enrollments"],
  ["user", "Users and roles"],
  ["notification", "Announcements"],
  ["settings", "Platform settings"],
];
const AREA_LABEL = Object.fromEntries(AREAS.filter(([k]) => k));
const TONE = { delete: "danger", deactivate: "danger", role: "accent", password: "warn", publish: "ok", transfer: "accent" };

export default function ActivityLog() {
  const { toast } = useFeedback();
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");
  const [more, setMore] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const { data, loading, error, reload } = useAsync(async () => {
    const res = (await adminApi.audit({ action: action || undefined, actor: actor || undefined })).data;
    setMore([]);
    setHasMore(res.hasMore);
    return res;
  }, [action, actor]);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !data) return <PageLoader />;

  const entries = [...data.entries, ...more];

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = (await adminApi.audit({ action: action || undefined, actor: actor || undefined, before: entries[entries.length - 1].createdAt })).data;
      setMore((m) => [...m, ...res.entries]);
      setHasMore(res.hasMore);
    } catch (err) {
      toast(getErrorMessage(err), "danger");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <PageHeader title="Activity log" description="Every change made by instructors and admins: courses, grading, enrollments, users and settings." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Select value={action} onChange={(e) => setAction(e.target.value)} selectClassName="sm:w-52" aria-label="Area">
          {AREAS.map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </Select>
        <Select value={actor} onChange={(e) => setActor(e.target.value)} selectClassName="sm:w-52" aria-label="Person">
          <option value="">Anyone</option>
          {data.actors.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>
      <div className={cx("overflow-hidden rounded-lg border border-line bg-surface", loading && "opacity-60")}>
        {entries.length === 0 ? (
          <EmptyState icon={History} title="Nothing recorded yet" description="Actions appear here as admins and instructors make changes." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th className="w-44">When</Th>
                <Th>What happened</Th>
                <Th className="hidden md:table-cell">Who</Th>
                <Th className="hidden lg:table-cell">Area</Th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const [area, verb] = e.action.split(".");
                return (
                  <tr key={e._id}>
                    <Td className="whitespace-nowrap text-fg-muted">{fmtDateTime(e.createdAt)}</Td>
                    <Td>
                      {e.link ? (
                        <Link to={e.link} className="hover:underline hover:underline-offset-4">
                          {e.summary}
                        </Link>
                      ) : (
                        e.summary
                      )}
                      <div className="text-xs text-fg-muted md:hidden">{e.actorName}</div>
                    </Td>
                    <Td className="hidden whitespace-nowrap md:table-cell">{e.actorName}</Td>
                    <Td className="hidden lg:table-cell">
                      <Badge tone={TONE[verb] || "neutral"}>{AREA_LABEL[area] || area}</Badge>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </div>
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button onClick={loadMore} loading={loadingMore}>
            Load older activity
          </Button>
        </div>
      )}
    </>
  );
}
