import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Trash2, UserPlus } from "lucide-react";
import { adminApi } from "../../api/endpoints.js";
import { getErrorMessage } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import useAsync from "../../lib/useAsync.js";
import { fmtDate, timeAgo } from "../../lib/format.js";
import { Avatar, Badge, Button, Dialog, EmptyState, ErrorState, IconButton, Input, Notice, PageHeader, PageLoader, SearchInput, Select, Table, Td, Th, cx, useFeedback } from "../../components/ui.jsx";

const roleOf = (u) => (u.isSuperAdmin ? "superadmin" : u.role);
const ROLE_LABEL = { student: "Student", admin: "Instructor", superadmin: "Super admin" };

const CreateUserDialog = ({ onClose, onCreated }) => {
  const { toast } = useFeedback();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "admin" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const { data } = await adminApi.createUser(form);
      toast(data.message);
      onCreated();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Add a user"
      description="Share the temporary password with them. They can change it in Account settings."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={busy}>
            Create account
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Full name" value={form.name} onChange={set("name")} />
        <Input label="Email" type="email" value={form.email} onChange={set("email")} />
        <Input label="Temporary password" value={form.password} onChange={set("password")} hint="At least 6 characters." />
        <Select label="Role" value={form.role} onChange={set("role")}>
          <option value="student">Student</option>
          <option value="admin">Instructor — manages their own courses</option>
          <option value="superadmin">Super admin — full control</option>
        </Select>
        {error && <Notice tone="danger">{error}</Notice>}
      </div>
    </Dialog>
  );
};

export default function Users() {
  const { user: me } = useAuth();
  const { toast, confirm } = useFeedback();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") || "");
  const [query, setQuery] = useState(search);
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data, loading, error, reload, setData } = useAsync(
    async () => (await adminApi.users({ search: query || undefined, role: role || undefined, status: status || undefined })).data.users,
    [query, role, status]
  );

  const replace = (u) => setData((list) => list.map((x) => (x._id === u._id ? { ...x, ...u } : x)));

  const changeRole = async (u, next) => {
    if (next === roleOf(u)) return;
    const demotingAdmin = u.role === "admin" && next === "student" && u.courseCount > 0;
    const ok = await confirm({
      title: `Make ${u.name} ${next === "admin" ? "an instructor" : next === "superadmin" ? "a super admin" : "a student"}?`,
      description:
        next === "superadmin"
          ? "Super admins can edit every course and manage every account, including yours."
          : demotingAdmin
            ? `Their ${u.courseCount} course${u.courseCount === 1 ? "" : "s"} will be transferred to you.`
            : undefined,
      confirmLabel: "Change role",
      danger: next === "superadmin",
    });
    if (!ok) return;
    try {
      const { data: res } = await adminApi.setRole(u._id, next);
      replace(res.user);
      toast(res.message);
      if (demotingAdmin) reload({ quiet: true });
    } catch (err) {
      toast(getErrorMessage(err), "danger");
    }
  };

  const toggle = async (u) => {
    const deactivating = u.isActive !== false;
    if (deactivating) {
      const ok = await confirm({
        title: `Deactivate ${u.name}?`,
        description: "They're signed out immediately and can't sign in until you reactivate them. Their data is kept.",
        confirmLabel: "Deactivate",
        danger: true,
      });
      if (!ok) return;
    }
    try {
      const { data: res } = await adminApi.toggleStatus(u._id);
      replace(res.user);
      toast(res.message);
    } catch (err) {
      toast(getErrorMessage(err), "danger");
    }
  };

  const remove = async (u) => {
    const ok = await confirm({
      title: `Permanently delete ${u.name}?`,
      description: `This deletes their account, enrollments, submissions, quiz attempts and posts.${u.courseCount ? ` Their ${u.courseCount} course${u.courseCount === 1 ? "" : "s"} will be transferred to you.` : ""} This can't be undone.`,
      confirmLabel: "Delete account",
      danger: true,
    });
    if (!ok) return;
    try {
      const { data: res } = await adminApi.deleteUser(u._id);
      setData((list) => list.filter((x) => x._id !== u._id));
      toast(res.message);
    } catch (err) {
      toast(getErrorMessage(err), "danger");
    }
  };

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !data) return <PageLoader />;

  return (
    <>
      <PageHeader
        title="Users"
        description="Every account on the platform. Only super admins can see this page."
        actions={
          <Button variant="primary" icon={UserPlus} onClick={() => setCreating(true)}>
            Add user
          </Button>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email" className="sm:w-72" />
        <Select value={role} onChange={(e) => setRole(e.target.value)} selectClassName="sm:w-44" aria-label="Role">
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="admin">Instructors and admins</option>
          <option value="superadmin">Super admins</option>
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} selectClassName="sm:w-40" aria-label="Status">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="deactivated">Deactivated</option>
        </Select>
      </div>
      <Notice tone="info" className="mb-4">
        Instructors can only edit courses they created. Super admins can edit everything and manage every account.
      </Notice>
      <div className={cx("overflow-hidden rounded-lg border border-line bg-surface", loading && "opacity-60")}>
        {data.length === 0 ? (
          <EmptyState title="No users match" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Role</Th>
                <Th align="right" className="hidden md:table-cell">Courses owned</Th>
                <Th className="hidden lg:table-cell">Joined</Th>
                <Th className="hidden lg:table-cell">Last active</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.map((u) => {
                const self = u._id === me._id;
                return (
                  <tr key={u._id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar user={u} size={28} />
                        <div className="min-w-0">
                          <div className="truncate font-medium">
                            {u.name} {self && <span className="font-normal text-fg-muted">(you)</span>}
                          </div>
                          <div className="truncate text-xs text-fg-muted">{u.email}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      {self ? (
                        <Badge tone="accent">{ROLE_LABEL[roleOf(u)]}</Badge>
                      ) : (
                        <Select value={roleOf(u)} onChange={(e) => changeRole(u, e.target.value)} selectClassName="h-8 w-36 text-[13px]" aria-label={`Role for ${u.name}`}>
                          <option value="student">Student</option>
                          <option value="admin">Instructor</option>
                          <option value="superadmin">Super admin</option>
                        </Select>
                      )}
                    </Td>
                    <Td align="right" className="tabular hidden text-fg-muted md:table-cell">{u.role === "admin" ? u.courseCount : "—"}</Td>
                    <Td className="hidden whitespace-nowrap text-fg-muted lg:table-cell">{fmtDate(u.createdAt)}</Td>
                    <Td className="hidden whitespace-nowrap text-fg-muted lg:table-cell">{timeAgo(u.lastLogin)}</Td>
                    <Td>
                      <Badge tone={u.isActive !== false ? "ok" : "danger"} dot>
                        {u.isActive !== false ? "Active" : "Deactivated"}
                      </Badge>
                    </Td>
                    <Td align="right" className="whitespace-nowrap">
                      {!self && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => toggle(u)}>
                            {u.isActive !== false ? "Deactivate" : "Reactivate"}
                          </Button>
                          <IconButton icon={Trash2} size={15} label={`Delete ${u.name}`} onClick={() => remove(u)} className="hover:text-danger" />
                        </>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </div>
      {creating && (
        <CreateUserDialog
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            reload({ quiet: true });
          }}
        />
      )}
    </>
  );
}
