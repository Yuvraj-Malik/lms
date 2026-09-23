import React, { useEffect, useState } from "react";
import { 
  Users, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Trash2, 
  Filter, 
  CheckCircle,
  AlertTriangle,
  Send,
  Megaphone
} from "lucide-react";
import { adminApi } from "../../api/endpoints.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { getErrorMessage } from "../../api/client.js";
import { Card, Button, Input, Textarea, Badge, Spinner, Alert } from "../../components/ui.jsx";

export default function AdminSettings() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null); // { type, user, action }

  // Notification composer state
  const [notifForm, setNotifForm] = useState({ title: "", message: "", link: "", audience: "all", userId: "" });
  const [notifMsg, setNotifMsg] = useState("");
  const [notifErr, setNotifErr] = useState("");
  const [sendingNotif, setSendingNotif] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.users({
        search: search || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
      setActionErr(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    adminApi.users({}).then((res) => setAllUsers(res.data.users || [])).catch(() => {});
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setNotifErr("");
    setNotifMsg("");

    if (!notifForm.title.trim() || !notifForm.message.trim()) {
      setNotifErr("Title and message are required.");
      return;
    }
    if (notifForm.audience === "specific" && !notifForm.userId) {
      setNotifErr("Select a user to notify.");
      return;
    }

    setSendingNotif(true);
    try {
      const res = await adminApi.sendNotification(notifForm);
      setNotifMsg(res.data.message);
      setNotifForm({ title: "", message: "", link: "", audience: "all", userId: "" });
    } catch (err) {
      setNotifErr(getErrorMessage(err));
    } finally {
      setSendingNotif(false);
    }
  };

  const handleRoleChange = (targetUser, newRoleValue) => {
    const roleLabels = { student: "Student", admin: "Admin", superadmin: "Super Admin" };
    const currentValue = targetUser.isSuperAdmin ? "superadmin" : targetUser.role;
    if (newRoleValue === currentValue) return;
    setConfirmDialog({
      title: "Change User Role",
      message: `Change ${targetUser.name}'s role from "${roleLabels[currentValue]}" to "${roleLabels[newRoleValue]}"?`,
      confirmText: `Confirm ${roleLabels[newRoleValue]}`,
      confirmTone: newRoleValue === "superadmin" ? "amber" : "pine",
      action: async () => {
        try {
          setActionErr("");
          await adminApi.updateUserRole(targetUser._id, newRoleValue);
          setActionMsg(`Successfully changed ${targetUser.name}'s role to ${roleLabels[newRoleValue]}.`);
          fetchUsers();
        } catch (err) {
          setActionErr(getErrorMessage(err));
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleStatusToggle = (targetUser) => {
    const willDeactivate = targetUser.isActive !== false;
    setConfirmDialog({
      title: `${willDeactivate ? "Deactivate" : "Reactivate"} Account`,
      message: willDeactivate
        ? `Are you sure you want to deactivate ${targetUser.name}'s account? They will be unable to log in until reactivated.`
        : `Reactivate ${targetUser.name}'s account to restore full access?`,
      confirmText: willDeactivate ? "Deactivate Account" : "Reactivate Account",
      confirmTone: willDeactivate ? "clay" : "pine",
      action: async () => {
        try {
          setActionErr("");
          const res = await adminApi.toggleUserStatus(targetUser._id);
          setActionMsg(res.data.message);
          fetchUsers();
        } catch (err) {
          setActionErr(getErrorMessage(err));
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleDeleteUser = (targetUser) => {
    setConfirmDialog({
      title: "Delete User Account",
      message: `CAUTION: Are you sure you want to permanently delete ${targetUser.name} (${targetUser.email})? This action cannot be undone.`,
      confirmText: "Delete Permanently",
      confirmTone: "clay",
      action: async () => {
        try {
          setActionErr("");
          await adminApi.deleteUser(targetUser._id);
          setActionMsg(`Account for ${targetUser.name} was permanently deleted.`);
          fetchUsers();
        } catch (err) {
          setActionErr(getErrorMessage(err));
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink dark:text-dark-ink sm:text-3xl">
          User Management & System Settings
        </h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-dark-ink-soft">
          Audit all platform accounts, configure administrative privileges, toggle access status, and maintain student rosters.
        </p>
      </div>

      {actionMsg && <Alert tone="pine">{actionMsg}</Alert>}
      {actionErr && <Alert tone="clay">{actionErr}</Alert>}

      {/* Send Notification */}
      <Card>
        <div className="flex items-center gap-3 border-b border-border/70 pb-4 dark:border-dark-border/70">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pine/10 text-pine dark:bg-pine-light/10 dark:text-pine-light">
            <Megaphone size={20} />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-ink dark:text-dark-ink">Send Notification</h2>
            <p className="text-xs text-ink-soft dark:text-dark-ink-soft">
              Broadcast an announcement to everyone, all students, all admins, or a specific person.
            </p>
          </div>
        </div>

        <form onSubmit={handleSendNotification} className="mt-5 space-y-4">
          {notifErr && <Alert tone="clay">{notifErr}</Alert>}
          {notifMsg && <Alert tone="pine">{notifMsg}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Title"
              value={notifForm.title}
              onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
              placeholder="e.g. Scheduled maintenance tonight"
              required
            />
            <Input
              label="Link (optional)"
              value={notifForm.link}
              onChange={(e) => setNotifForm({ ...notifForm, link: e.target.value })}
              placeholder="/dashboard"
            />
          </div>

          <Textarea
            label="Message"
            rows={3}
            value={notifForm.message}
            onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
            placeholder="Write the notification message..."
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink dark:text-dark-ink">Send to</label>
              <select
                value={notifForm.audience}
                onChange={(e) => setNotifForm({ ...notifForm, audience: e.target.value, userId: "" })}
                className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-pine dark:border-dark-border dark:bg-dark-surface-raised dark:text-dark-ink"
              >
                <option value="all">Everyone</option>
                <option value="students">All Students</option>
                <option value="admins">All Admins</option>
                <option value="specific">Specific Person</option>
              </select>
            </div>

            {notifForm.audience === "specific" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink dark:text-dark-ink">Person</label>
                <select
                  value={notifForm.userId}
                  onChange={(e) => setNotifForm({ ...notifForm, userId: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-pine dark:border-dark-border dark:bg-dark-surface-raised dark:text-dark-ink"
                >
                  <option value="">-- Select a person --</option>
                  {allUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" tone="pine" disabled={sendingNotif}>
              <Send size={16} className="mr-1.5" />
              {sendingNotif ? "Sending..." : "Send Notification"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Search and Filters */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 text-ink-soft dark:text-dark-ink-soft" size={16} />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-sm text-ink focus:border-pine focus:outline-none dark:border-dark-border dark:bg-dark-surface dark:text-dark-ink"
            />
          </div>

          <div className="flex w-full sm:w-auto items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-ink focus:border-pine focus:outline-none dark:border-dark-border dark:bg-dark-surface dark:text-dark-ink"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="admin">Administrators</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-ink focus:border-pine focus:outline-none dark:border-dark-border dark:bg-dark-surface dark:text-dark-ink"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="deactivated">Deactivated Only</option>
            </select>

            <Button type="submit" size="sm" tone="secondary">
              Filter
            </Button>
          </div>
        </form>
      </Card>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={32} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm dark:border-dark-border dark:bg-dark-surface">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="border-b border-border bg-surface-sunken/60 text-xs font-semibold text-ink-soft uppercase dark:border-dark-border dark:bg-dark-surface-sunken/60 dark:text-dark-ink-soft">
                <tr>
                  <th className="w-[22%] px-5 py-3.5 align-middle">User</th>
                  <th className="w-[14%] px-5 py-3.5 align-middle whitespace-nowrap">Role</th>
                  <th className="w-[10%] px-5 py-3.5 align-middle whitespace-nowrap">Status</th>
                  <th className="w-[20%] px-5 py-3.5 align-middle">Department</th>
                  <th className="w-[10%] px-5 py-3.5 align-middle whitespace-nowrap">Joined</th>
                  <th className="w-[16%] px-5 py-3.5 align-middle whitespace-nowrap">Actions</th>
                  <th className="w-[8%] px-5 py-3.5 align-middle text-right whitespace-nowrap">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-dark-border/60">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-sm text-ink-soft dark:text-dark-ink-soft">
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = u._id === currentAdmin?.id || u._id === currentAdmin?._id;
                    const isActive = u.isActive !== false;
                    const isProtected = u.isSuperAdmin;
                    const canManageStatus = !isSelf && !isProtected;

                    return (
                      <tr key={u._id} className="transition-colors hover:bg-surface-sunken/40 dark:hover:bg-dark-surface-sunken/40">
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-pine/10 font-bold text-pine dark:bg-pine-light/10 dark:text-pine-light">
                              {u.avatar ? (
                                <img src={u.avatar} alt={u.name} className="h-full w-full rounded-full object-cover" />
                              ) : (
                                u.name?.[0]?.toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-ink dark:text-dark-ink flex items-center gap-1.5">
                                {u.name}
                                {isSelf && (
                                  <span className="rounded bg-pine/10 px-1.5 py-0.2 text-[10px] font-bold text-pine dark:bg-pine-light/10 dark:text-pine-light">
                                    You
                                  </span>
                                )}
                                {isProtected && (
                                  <span
                                    className="inline-flex items-center gap-1 rounded bg-amber/15 px-1.5 py-0.2 text-[10px] font-bold text-amber dark:text-amber-light"
                                    title="Super admin — protected account"
                                  >
                                    <ShieldCheck size={10} /> Super Admin
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-ink-soft dark:text-dark-ink-soft">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          {currentAdmin?.isSuperAdmin && !isProtected && !isSelf ? (
                            <select
                              value={u.isSuperAdmin ? "superadmin" : u.role}
                              onChange={(e) => handleRoleChange(u, e.target.value)}
                              className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs font-medium text-ink focus:border-pine focus:outline-none dark:border-dark-border dark:bg-dark-surface dark:text-dark-ink"
                            >
                              <option value="student">Student</option>
                              <option value="admin">Admin</option>
                              <option value="superadmin">Super Admin</option>
                            </select>
                          ) : (
                            <Badge tone={u.isSuperAdmin || u.role === "admin" ? "amber" : "neutral"} className="capitalize">
                              {u.isSuperAdmin ? "Super Admin" : u.role}
                            </Badge>
                          )}
                        </td>

                        <td className="px-5 py-4 align-middle">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              Deactivated
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 align-middle text-xs leading-snug text-ink-soft dark:text-dark-ink-soft">
                          {u.department || "Computer Science"}
                        </td>

                        <td className="px-5 py-4 align-middle whitespace-nowrap text-xs text-ink-soft dark:text-dark-ink-soft">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <Button
                            size="xs"
                            tone={isActive ? "secondary" : "pine"}
                            onClick={() => handleStatusToggle(u)}
                            disabled={!canManageStatus}
                            title={isProtected ? "Super admin account is protected" : isActive ? "Deactivate User Access" : "Activate User Access"}
                            className="w-full justify-center"
                          >
                            {isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </td>

                        <td className="px-5 py-4 align-middle text-right">
                          <Button
                            size="xs"
                            tone="clay"
                            onClick={() => handleDeleteUser(u)}
                            disabled={!canManageStatus}
                            title={isProtected ? "Super admin account is protected" : "Delete Account"}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl dark:bg-dark-surface border border-border dark:border-dark-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/15 text-amber">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-display text-base font-bold text-ink dark:text-dark-ink">
                {confirmDialog.title}
              </h3>
            </div>
            <p className="mt-3 text-xs sm:text-sm text-ink-soft dark:text-dark-ink-soft leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <Button size="sm" tone="secondary" onClick={() => setConfirmDialog(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                tone={confirmDialog.confirmTone || "pine"}
                onClick={confirmDialog.action}
              >
                {confirmDialog.confirmText || "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
