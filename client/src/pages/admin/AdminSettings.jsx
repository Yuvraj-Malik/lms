import React, { useState, useEffect, useCallback } from "react";
import { 
  Users, 
  ShieldCheck, 
  UserX, 
  Search, 
  Filter, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Megaphone,
  Send,
  Eye,
  Settings
} from "lucide-react";
import { adminApi } from "../../api/endpoints.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Card, Button, Input, Textarea, Select, Badge, Spinner, Alert } from "../../components/ui.jsx";
import { getErrorMessage } from "../../api/client.js";

export default function AdminSettings() {
  const { user: currentAdmin } = useAuth();

  // Users State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");

  // Broadcast Notification State
  const [notifForm, setNotifForm] = useState({
    title: "",
    message: "",
    audience: "all",
    link: "",
    userId: "",
  });
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifMsg, setNotifMsg] = useState("");
  const [notifErr, setNotifErr] = useState("");

  // Action Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await adminApi.users({
        search: search.trim() || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setUsers(res.data?.users || []);
    } catch (err) {
      setActionErr(getErrorMessage(err));
    } finally {
      setLoadingUsers(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleRoleChange = async (targetUser, newRole) => {
    const isSuper = newRole === "superadmin";
    const actualRole = isSuper ? "admin" : newRole;

    try {
      await adminApi.updateUserRole(targetUser._id, {
        role: actualRole,
        isSuperAdmin: isSuper,
      });
      setActionMsg(`Updated ${targetUser.name}'s role to ${newRole}.`);
      fetchUsers();
    } catch (err) {
      setActionErr(getErrorMessage(err));
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setNotifMsg("");
    setNotifErr("");

    if (!notifForm.title.trim() || !notifForm.message.trim()) {
      setNotifErr("Title and message are required.");
      return;
    }
    if (notifForm.audience === "specific" && !notifForm.userId) {
      setNotifErr("Please specify a user ID for a single recipient notification.");
      return;
    }

    try {
      setSendingNotif(true);
      const res = await adminApi.sendNotification(notifForm);
      setNotifMsg(
        `Dispatched announcement to ${res.data.count} recipient${res.data.count !== 1 ? "s" : ""}.`
      );
      setNotifForm({
        title: "",
        message: "",
        audience: "all",
        link: "",
        userId: "",
      });
    } catch (err) {
      setNotifErr(getErrorMessage(err));
    } finally {
      setSendingNotif(false);
    }
  };

  const handleDeleteUser = (targetUser) => {
    setConfirmDialog({
      title: "Delete User Record",
      message: `Permanently delete ${targetUser.name} (${targetUser.email})? This action cannot be reversed.`,
      confirmText: "Delete Record",
      confirmTone: "danger",
      action: async () => {
        try {
          await adminApi.deleteUser(targetUser._id);
          setActionMsg(`Removed ${targetUser.name} from directory.`);
          setConfirmDialog(null);
          fetchUsers();
        } catch (err) {
          setActionErr(getErrorMessage(err));
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleStatusToggle = (targetUser) => {
    const willDeactivate = targetUser.isActive !== false;
    setConfirmDialog({
      title: willDeactivate ? "Deactivate User Access" : "Reactivate User Access",
      message: willDeactivate
        ? `Deactivate ${targetUser.name}? They will be blocked from logging into Ridgeline.`
        : `Reactivate ${targetUser.name}? They will regain immediate access to their courses.`,
      confirmText: willDeactivate ? "Deactivate" : "Activate",
      confirmTone: willDeactivate ? "danger" : "primary",
      action: async () => {
        try {
          await adminApi.toggleUserStatus(targetUser._id);
          setActionMsg(`Updated access status for ${targetUser.name}.`);
          setConfirmDialog(null);
          fetchUsers();
        } catch (err) {
          setActionErr(getErrorMessage(err));
          setConfirmDialog(null);
        }
      },
    });
  };

  return (
    <div className="space-y-12">
      <div>
        <h1 className="type-display text-text-primary">
          User Directory & System Settings
        </h1>
        <p className="mt-1 type-body text-text-secondary">
          Audit platform accounts, configure administrative privileges, and broadcast institutional announcements
        </p>
      </div>

      {actionMsg && <Alert tone="success">{actionMsg}</Alert>}
      {actionErr && <Alert tone="danger">{actionErr}</Alert>}

      {/* Send Notification */}
      <Card className="p-6">
        <div className="flex items-center gap-3.5 border-b border-border-subtle pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-border-subtle bg-bg-surface-raised text-text-secondary">
            <Megaphone size={18} />
          </div>
          <div>
            <h2 className="type-h3 text-text-primary">Broadcast Institutional Announcement</h2>
            <p className="type-body-sm text-text-secondary">
              Dispatch notifications to student rosters, faculty, or individual accounts
            </p>
          </div>
        </div>

        <form onSubmit={handleSendNotification} className="mt-6 space-y-4">
          {notifErr && <Alert tone="danger">{notifErr}</Alert>}
          {notifMsg && <Alert tone="success">{notifMsg}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Notification Title"
              value={notifForm.title}
              onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
              placeholder="e.g. Scheduled Maintenance Window"
              required
            />
            <Input
              label="Destination Link (Optional)"
              value={notifForm.link}
              onChange={(e) => setNotifForm({ ...notifForm, link: e.target.value })}
              placeholder="/dashboard"
            />
          </div>

          <Textarea
            label="Message Body"
            rows={3}
            value={notifForm.message}
            onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
            placeholder="Write the institutional announcement text..."
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Target Audience"
              value={notifForm.audience}
              onChange={(e) => setNotifForm({ ...notifForm, audience: e.target.value })}
            >
              <option value="all">All Registered Users</option>
              <option value="students">Enrolled Students Only</option>
              <option value="admins">Administrators Only</option>
              <option value="specific">Specific User Account</option>
            </Select>

            {notifForm.audience === "specific" && (
              <Input
                label="Target User ID"
                value={notifForm.userId}
                onChange={(e) => setNotifForm({ ...notifForm, userId: e.target.value })}
                placeholder="User Object ID"
                required
              />
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" disabled={sendingNotif}>
              <Send size={14} className="mr-1.5" />
              {sendingNotif ? "Broadcasting…" : "Send Announcement"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Directory Management Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="type-h3 text-text-primary">
              Institutional User Directory
            </h2>
            <span className="type-caption text-text-tertiary">
              {users.length} accounts found
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email…"
                className="h-9 rounded-[6px] border border-border-default bg-bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none"
              />
            </div>

            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-auto h-9"
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="admin">Administrator</option>
            </Select>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-auto h-9"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Deactivated</option>
            </Select>

            <Button size="sm" variant="secondary" onClick={fetchUsers} title="Refresh directory">
              <RefreshCw size={14} className={loadingUsers ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>

        {loadingUsers ? (
          <div className="flex justify-center py-16">
            <Spinner size={32} />
          </div>
        ) : (
          <div className="overflow-hidden rounded-[10px] border border-border-subtle bg-bg-surface shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left type-body">
                <thead className="border-b border-border-subtle bg-bg-surface-raised text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  <tr>
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Department</th>
                    <th className="px-5 py-3.5">Joined</th>
                    <th className="px-5 py-3.5">Access</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center type-body-sm text-text-tertiary">
                        No matching user records located.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isSelf = u._id === currentAdmin?.id || u._id === currentAdmin?._id;
                      const isActive = u.isActive !== false;
                      const isProtected = u.isSuperAdmin;
                      const canManageStatus = !isSelf && !isProtected;

                      return (
                        <tr key={u._id} className="transition-colors hover:bg-bg-surface-raised/50">
                          <td className="px-5 py-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                                {u.avatar ? (
                                  <img src={u.avatar} alt={u.name} className="h-full w-full rounded-full object-cover" />
                                ) : (
                                  u.name?.[0]?.toUpperCase()
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-text-primary flex items-center gap-1.5">
                                  {u.name}
                                  {isSelf && (
                                    <span className="rounded-[4px] border border-primary-500/20 bg-primary-50 px-1.5 py-0.2 text-[10px] font-semibold text-primary-700 dark:bg-primary-600/15 dark:text-primary-400">
                                      You
                                    </span>
                                  )}
                                  {isProtected && (
                                    <span className="inline-flex items-center gap-1 rounded-[4px] border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                                      <ShieldCheck size={10} /> Super Admin
                                    </span>
                                  )}
                                </p>
                                <p className="type-body-sm text-text-secondary">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 align-middle">
                            {currentAdmin?.isSuperAdmin && !isProtected && !isSelf ? (
                              <select
                                value={u.isSuperAdmin ? "superadmin" : u.role}
                                onChange={(e) => handleRoleChange(u, e.target.value)}
                                className="w-full rounded-[6px] border border-border-default bg-bg-surface px-2 py-1.5 text-xs font-medium text-text-primary focus:border-primary-500 focus:outline-none"
                              >
                                <option value="student">Student</option>
                                <option value="admin">Administrator</option>
                                <option value="superadmin">Super Admin</option>
                              </select>
                            ) : (
                              <span className="type-caption text-text-secondary">
                                {u.isSuperAdmin ? "Super Admin" : u.role}
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 align-middle">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                Deactivated
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 align-middle type-body-sm text-text-secondary">
                            {u.department || "Computer Science"}
                          </td>

                          <td className="px-5 py-4 align-middle whitespace-nowrap type-body-sm text-text-secondary">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>

                          <td className="px-5 py-4 align-middle">
                            <Button
                              size="xs"
                              variant={isActive ? "secondary" : "primary"}
                              onClick={() => handleStatusToggle(u)}
                              disabled={!canManageStatus}
                              title={isProtected ? "Protected account" : isActive ? "Deactivate User Access" : "Activate User Access"}
                              className="w-full justify-center"
                            >
                              {isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </td>

                          <td className="px-5 py-4 align-middle text-right">
                            <Button
                              size="xs"
                              variant="danger"
                              onClick={() => handleDeleteUser(u)}
                              disabled={!canManageStatus}
                              title={isProtected ? "Protected account" : "Delete Account"}
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
      </div>

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[12px] bg-bg-surface-raised p-6 shadow-raised border border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-amber-500/20 bg-amber-500/10 text-amber-500">
                <AlertTriangle size={18} />
              </div>
              <h3 className="type-h3 text-text-primary">
                {confirmDialog.title}
              </h3>
            </div>
            <p className="mt-3 type-body-sm text-text-secondary leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <Button size="sm" variant="secondary" onClick={() => setConfirmDialog(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant={confirmDialog.confirmTone === "danger" ? "danger" : "primary"}
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
