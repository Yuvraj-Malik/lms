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
  AlertTriangle
} from "lucide-react";
import { adminApi } from "../../api/endpoints.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { getErrorMessage } from "../../api/client.js";
import { Card, Button, Input, Badge, Spinner, Alert } from "../../components/ui.jsx";

export default function AdminSettings() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null); // { type, user, action }

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleRoleToggle = (targetUser) => {
    const nextRole = targetUser.role === "admin" ? "student" : "admin";
    setConfirmDialog({
      title: `${nextRole === "admin" ? "Promote" : "Demote"} User Role`,
      message: `Are you sure you want to change ${targetUser.name}'s role from "${targetUser.role}" to "${nextRole}"?`,
      confirmText: `Confirm ${nextRole.toUpperCase()}`,
      action: async () => {
        try {
          setActionErr("");
          await adminApi.updateUserRole(targetUser._id, nextRole);
          setActionMsg(`Successfully changed ${targetUser.name}'s role to ${nextRole}.`);
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
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-sunken/60 text-xs font-semibold text-ink-soft uppercase dark:border-dark-border dark:bg-dark-surface-sunken/60 dark:text-dark-ink-soft">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Joined Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-dark-border/60">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-ink-soft dark:text-dark-ink-soft">
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = u._id === currentAdmin?.id || u._id === currentAdmin?._id;
                    const isActive = u.isActive !== false;

                    return (
                      <tr key={u._id} className="transition-colors hover:bg-surface-sunken/40 dark:hover:bg-dark-surface-sunken/40">
                        <td className="px-5 py-4">
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
                              </p>
                              <p className="text-xs text-ink-soft dark:text-dark-ink-soft">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <Badge tone={u.role === "admin" ? "amber" : "neutral"} className="capitalize">
                            {u.role}
                          </Badge>
                        </td>

                        <td className="px-5 py-4">
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

                        <td className="px-5 py-4 text-xs text-ink-soft dark:text-dark-ink-soft">
                          {u.department || "Computer Science"}
                        </td>

                        <td className="px-5 py-4 text-xs text-ink-soft dark:text-dark-ink-soft">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Role Toggle Button */}
                            <Button
                              size="xs"
                              tone="secondary"
                              onClick={() => handleRoleToggle(u)}
                              disabled={isSelf}
                              title={u.role === "admin" ? "Demote to Student" : "Promote to Admin"}
                            >
                              {u.role === "admin" ? "Make Student" : "Make Admin"}
                            </Button>

                            {/* Deactivation Toggle */}
                            <Button
                              size="xs"
                              tone={isActive ? "secondary" : "pine"}
                              onClick={() => handleStatusToggle(u)}
                              disabled={isSelf}
                              title={isActive ? "Deactivate User Access" : "Activate User Access"}
                            >
                              {isActive ? "Deactivate" : "Activate"}
                            </Button>

                            {/* Delete User */}
                            <Button
                              size="xs"
                              tone="clay"
                              onClick={() => handleDeleteUser(u)}
                              disabled={isSelf}
                              title="Delete Account"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
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
