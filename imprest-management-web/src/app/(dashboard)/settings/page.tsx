"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { HoldToDeleteButton } from "@/components/ui/HoldToDeleteButton";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { useApp } from "@/context/AppContext";
import { lookupsService, type LookupEndpoint } from "@/services/lookups.service";
import { usersService } from "@/services/users.service";
import type { LookupItem } from "@/types/lookup";
import type { User } from "@/types/auth";

type TabType = LookupEndpoint | "users";

export default function SettingsPage() {
  const { t, user } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>("project-codes");
  const [lookups, setLookups] = useState<LookupItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");

  // Quick Add Forms
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin">("user");
  const [deleteTarget, setDeleteTarget] = useState<{ type: "user" | LookupEndpoint; id: number; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const loadTab = useCallback(async () => {
    if (!isAdmin) return;
    setError("");
    try {
      if (activeTab === "users") {
        setUsers(await usersService.getAll());
      } else {
        setLookups(await lookupsService.getAll(activeTab));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading data");
    }
  }, [activeTab, isAdmin]);

  useEffect(() => {
    loadTab();
  }, [loadTab]);

  const handleAddLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "users") return;
    setError("");
    try {
      await lookupsService.create(activeTab, {
        code: newCode.trim() || undefined,
        name: newName.trim(),
      });
      setNewCode("");
      setNewName("");
      await loadTab();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await usersService.create({
        username: newUsername.trim(),
        full_name: newName.trim(),
        password: newPassword,
        role: newRole,
      });
      setNewUsername("");
      setNewName("");
      setNewPassword("");
      await loadTab();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    }
  };

  if (!isAdmin) {
    return (
      <DashboardShell>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center text-[var(--text-muted)]">
          {t.adminOnly}
        </div>
      </DashboardShell>
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: "project-codes", label: t.projectCodesTab },
    { id: "expense-centers", label: t.expenseCentersTab },
    { id: "categories", label: t.categoriesTab },
    { id: "users", label: t.usersTab },
  ];

  return (
    <DashboardShell>
      {/* Tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-[var(--accent-primary)] text-white"
                : "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-xl bg-[var(--status-danger)]/10 p-3 text-sm text-[var(--status-danger)]">
          {error}
        </div>
      )}

      {/* Add Form */}
      {activeTab === "users" ? (
        <form
          onSubmit={handleAddUser}
          className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:grid-cols-5"
        >
          <input
            type="text"
            required
            placeholder={t.username}
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="min-h-[42px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm outline-none focus:border-[var(--accent-primary)]"
          />
          <input
            type="text"
            required
            placeholder={t.fullName}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="min-h-[42px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm outline-none focus:border-[var(--accent-primary)]"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder={t.password}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="min-h-[42px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm outline-none focus:border-[var(--accent-primary)]"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as "user" | "admin")}
            className="min-h-[42px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm outline-none"
          >
            <option value="user">{t.userRole}</option>
            <option value="admin">{t.adminRole}</option>
          </select>
          <button
            type="submit"
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-primary-hover)]"
          >
            <Plus className="h-4 w-4" />
            <span>{t.addNew}</span>
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleAddLookup}
          className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:grid-cols-3"
        >
          <input
            type="text"
            required={activeTab !== "categories"}
            placeholder={t.code}
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            className="min-h-[42px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm outline-none focus:border-[var(--accent-primary)]"
          />
          <input
            type="text"
            required
            placeholder={t.name}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="min-h-[42px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm outline-none focus:border-[var(--accent-primary)]"
          />
          <button
            type="submit"
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-primary-hover)]"
          >
            <Plus className="h-4 w-4" />
            <span>{t.addNew}</span>
          </button>
        </form>
      )}

      {/* List Table */}
      <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        {activeTab === "users" ? (
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 text-xs text-[var(--text-muted)]">
                <th className="px-4 py-3 text-start">{t.username}</th>
                <th className="px-4 py-3 text-start">{t.fullName}</th>
                <th className="px-4 py-3 text-start">{t.role}</th>
                <th className="px-4 py-3 text-start">{t.status}</th>
                <th className="px-4 py-3 text-end">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium">{u.username}</td>
                  <td className="px-4 py-3">{u.full_name}</td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs ${
                        u.is_active
                          ? "bg-[var(--status-success)]/15 text-[var(--status-success)]"
                          : "bg-[var(--status-danger)]/15 text-[var(--status-danger)]"
                      }`}
                    >
                      {u.is_active ? t.active : t.inactive}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <HoldToDeleteButton
                      label={t.holdToDeleteHint}
                      onTrigger={() => setDeleteTarget({ type: "user", id: u.id, label: u.username })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 text-xs text-[var(--text-muted)]">
                <th className="px-4 py-3 text-start">{t.code}</th>
                <th className="px-4 py-3 text-start">{t.name}</th>
                <th className="px-4 py-3 text-start">{t.status}</th>
                <th className="px-4 py-3 text-end">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {lookups.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium">{item.code || "—"}</td>
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs ${
                        item.is_active
                          ? "bg-[var(--status-success)]/15 text-[var(--status-success)]"
                          : "bg-[var(--status-danger)]/15 text-[var(--status-danger)]"
                      }`}
                    >
                      {item.is_active ? t.active : t.inactive}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <HoldToDeleteButton
                      label={t.holdToDeleteHint}
                      onTrigger={() =>
                        setDeleteTarget({
                          type: activeTab as LookupEndpoint,
                          id: item.id,
                          label: item.name,
                        })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        itemName={deleteTarget?.label}
        loading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          setError("");
          try {
            if (deleteTarget.type === "user") {
              const res = await usersService.delete(deleteTarget.id);
              if (res.detail.includes("deactivated")) {
                setUsers((prev) =>
                  prev.map((u) => (u.id === deleteTarget.id ? { ...u, is_active: false } : u))
                );
              } else {
                setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
              }
            } else {
              await lookupsService.delete(deleteTarget.type, deleteTarget.id);
              setLookups((prev) => prev.filter((l) => l.id !== deleteTarget.id));
            }
            setDeleteTarget(null);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed");
          } finally {
            setDeleting(false);
          }
        }}
      />
    </DashboardShell>
  );
}
