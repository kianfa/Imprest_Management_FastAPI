"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  FileSpreadsheet,
  FolderKanban,
  MessageSquareWarning,
  Paperclip,
  Plus,
  Receipt,
  Search,
  Wallet,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { RecordFormModal } from "@/components/records/RecordFormModal";
import { ReceiptGalleryModal } from "@/components/records/ReceiptGalleryModal";
import { TicketModal } from "@/components/records/TicketModal";
import { JalaliDateInput } from "@/components/ui/JalaliDateInput";
import { HoldToDeleteButton } from "@/components/ui/HoldToDeleteButton";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { useApp } from "@/context/AppContext";
import { recordsService } from "@/services/records.service";
import { lookupsService } from "@/services/lookups.service";
import type { ExpenseRecord } from "@/types/record";
import type { LookupItem } from "@/types/lookup";

const PAGE_LIMIT = 15;

export default function RecordsPage() {
  const { t, lang } = useApp();
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [expenseCenterFilter, setExpenseCenterFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);

  // Lookups
  const [projectCodes, setProjectCodes] = useState<LookupItem[]>([]);
  const [expenseCenters, setExpenseCenters] = useState<LookupItem[]>([]);
  const [categories, setCategories] = useState<LookupItem[]>([]);

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ExpenseRecord | null>(null);
  const [galleryRecord, setGalleryRecord] = useState<ExpenseRecord | null>(null);
  const [ticketRecord, setTicketRecord] = useState<ExpenseRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadLookups = useCallback(async () => {
    try {
      const [p, ec, cat] = await Promise.all([
        lookupsService.getAll("project-codes", true),
        lookupsService.getAll("expense-centers", true),
        lookupsService.getAll("categories", true),
      ]);
      setProjectCodes(p);
      setExpenseCenters(ec);
      setCategories(cat);
    } catch {
      // Non-blocking if lookups empty
    }
  }, []);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await recordsService.getAll({
        invoice_no: searchQuery || undefined,
        project_code: projectFilter || undefined,
        expense_center: expenseCenterFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        skip: page * PAGE_LIMIT,
        limit: PAGE_LIMIT,
      });
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, projectFilter, expenseCenterFilter, startDate, endDate, page]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Keep gallery modal synced after image upload/delete
  useEffect(() => {
    if (galleryRecord) {
      const updated = records.find((r) => r.id === galleryRecord.id);
      if (updated) setGalleryRecord(updated);
    }
  }, [records, galleryRecord]);

  const confirmDeleteRecord = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await recordsService.delete(deleteTarget.id);
      setRecords((prev) => prev.filter((rec) => rec.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const totalAmount = records.reduce((acc, r) => acc + r.amount, 0);
  const formatMoney = (val: number) =>
    new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US").format(val);

  const openCreateModal = () => {
    setEditingRecord(null);
    setFormOpen(true);
  };

  return (
    <DashboardShell onAddReceiptClick={openCreateModal}>
      {/* Top KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">{t.totalExpenses}</p>
            <p className="tabular-nums mt-1.5 text-2xl font-bold">{formatMoney(totalAmount)}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
            <Wallet className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">{t.receiptCount}</p>
            <p className="tabular-nums mt-1.5 text-2xl font-bold">{records.length}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--status-success)]/15 text-[var(--status-success)]">
            <Receipt className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">{t.activeProjects}</p>
            <p className="tabular-nums mt-1.5 text-2xl font-bold">{projectCodes.length}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-navy)]/15 text-[var(--accent-navy)]">
            <FolderKanban className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Action & Filter Toolbar */}
      <search className="mb-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            loadRecords();
          }}
          className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="grid flex-1 grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-3 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="search"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-h-[42px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] ps-9 pe-3 text-sm outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            <select
              aria-label={t.projectCode}
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setPage(0);
              }}
              className="min-h-[42px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="">{t.allProjects}</option>
              {projectCodes.map((p) => (
                <option key={p.id} value={p.code || p.name}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>

            <select
              aria-label={t.expenseCenter}
              value={expenseCenterFilter}
              onChange={(e) => {
                setExpenseCenterFilter(e.target.value);
                setPage(0);
              }}
              className="min-h-[42px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="">{t.allExpenseCenters}</option>
              {expenseCenters.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <JalaliDateInput
              placeholder={t.startDate}
              value={startDate}
              onChange={setStartDate}
              className="min-h-[42px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm outline-none focus:border-[var(--accent-primary)]"
            />

            <JalaliDateInput
              placeholder={t.endDate}
              value={endDate}
              onChange={setEndDate}
              className="min-h-[42px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => recordsService.exportExcel({ invoice_no: searchQuery || undefined, project_code: projectFilter || undefined, expense_center: expenseCenterFilter || undefined, start_date: startDate || undefined, end_date: endDate || undefined })}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 text-sm font-medium hover:border-[var(--accent-primary)]"
            >
              <FileSpreadsheet className="h-4 w-4 text-[var(--status-success)]" />
              <span>{t.exportExcel}</span>
            </button>

            <button
              type="button"
              onClick={() => recordsService.exportPdf({ invoice_no: searchQuery || undefined, project_code: projectFilter || undefined, expense_center: expenseCenterFilter || undefined, start_date: startDate || undefined, end_date: endDate || undefined })}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 text-sm font-medium hover:border-[var(--accent-primary)]"
            >
              <Download className="h-4 w-4 text-[var(--accent-navy)]" />
              <span>{t.exportPdf}</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="hidden min-h-[42px] items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:bg-[var(--accent-primary-hover)] md:inline-flex"
            >
              <Plus className="h-4 w-4" />
              <span>{t.addReceipt}</span>
            </button>
          </div>
        </form>
      </search>

      {error && (
        <div role="alert" className="mb-4 rounded-xl bg-[var(--status-danger)]/10 p-4 text-sm text-[var(--status-danger)]">
          {error}
        </div>
      )}

      {/* Desktop Data Table */}
      <div
        tabIndex={0}
        role="region"
        aria-label={t.expenses}
        className="hidden overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] md:block"
      >
        <table className="w-full border-collapse text-start text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 text-xs uppercase text-[var(--text-muted)]">
              <th className="px-4 py-3.5 text-start font-semibold">{t.invoiceNo}</th>
              <th className="px-4 py-3.5 text-start font-semibold">{t.projectCode}</th>
              <th className="px-4 py-3.5 text-start font-semibold">{t.date}</th>
              <th className="px-4 py-3.5 text-start font-semibold">{t.expenseCenter}</th>
              <th className="px-4 py-3.5 text-start font-semibold">{t.category}</th>
              <th className="px-4 py-3.5 text-start font-semibold">{t.amount}</th>
              <th className="px-4 py-3.5 text-start font-semibold">{t.receipt}</th>
              <th className="px-4 py-3.5 text-end font-semibold">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12">
                  <div className="flex items-center justify-center">
                    <div
                      role="status"
                      aria-label={t.loading}
                      className="h-7 w-7 animate-spin rounded-full border-3 border-[var(--accent-primary)] border-t-transparent"
                    />
                  </div>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  {t.noRecords}
                </td>
              </tr>
            ) : (
              records.map((rec) => {
                const imgCount = rec.images?.length || 0;
                const openTicketsCount = rec.tickets?.filter((tk) => tk.status === "OPEN").length || 0;
                return (
                  <tr key={rec.id} className="hover:bg-[var(--bg-elevated)]/40">
                    <td className="px-4 py-3.5 font-medium">
                      <div className="flex items-center gap-2">
                        <span>{rec.invoice_no}</span>
                        {openTicketsCount > 0 && (
                          <span
                            title={`${openTicketsCount} ${t.openTicket}`}
                            className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-500 ring-1 ring-amber-500/30"
                          >
                            <MessageSquareWarning className="h-3 w-3" />
                            <span className="tabular-nums">{openTicketsCount}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-muted)]">{rec.project_code}</td>
                    <td className="tabular-nums px-4 py-3.5 text-[var(--text-muted)]" dir="ltr">
                      {rec.record_date}
                    </td>
                    <td className="px-4 py-3.5">{rec.expense_center || "—"}</td>
                    <td className="px-4 py-3.5">{rec.expense_type || "—"}</td>
                    <td className="tabular-nums px-4 py-3.5 font-semibold">
                      {formatMoney(rec.amount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => setGalleryRecord(rec)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                          imgCount > 0
                            ? "bg-[var(--status-success)]/15 text-[var(--status-success)]"
                            : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                        }`}
                      >
                        <Paperclip className="h-3 w-3" />
                        <span>{imgCount > 0 ? `${t.attached} (${imgCount})` : t.noAttachment}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-end">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setTicketRecord(rec)}
                          title={openTicketsCount > 0 ? `${openTicketsCount} ${t.openTicket}` : t.tickets}
                          aria-label={t.tickets}
                          className={`relative rounded-lg p-1.5 transition ${
                            openTicketsCount > 0
                              ? "bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/40"
                              : "text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-amber-500"
                          }`}
                        >
                          <MessageSquareWarning className="h-4 w-4" />
                          {openTicketsCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRecord(rec);
                            setFormOpen(true);
                          }}
                          aria-label={t.editReceipt}
                          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <HoldToDeleteButton
                          label={t.holdToDeleteHint}
                          onTrigger={() => setDeleteTarget(rec)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile PWA Card Stack */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div
              role="status"
              aria-label={t.loading}
              className="h-7 w-7 animate-spin rounded-full border-3 border-[var(--accent-primary)] border-t-transparent"
            />
          </div>
        ) : records.length === 0 ? (
          <div className="py-10 text-center text-sm text-[var(--text-muted)]">{t.noRecords}</div>
        ) : (
          records.map((rec) => {
            const imgCount = rec.images?.length || 0;
            const openTicketsCount = rec.tickets?.filter((tk) => tk.status === "OPEN").length || 0;
            return (
              <div
                key={rec.id}
                className={`rounded-2xl border bg-[var(--bg-surface)] p-4 ${
                  openTicketsCount > 0 ? "border-amber-500/40" : "border-[var(--border-subtle)]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{rec.invoice_no}</span>
                      {openTicketsCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-500 ring-1 ring-amber-500/30">
                          <MessageSquareWarning className="h-3 w-3" />
                          <span className="tabular-nums">{openTicketsCount}</span>
                        </span>
                      )}
                    </div>
                    <div className="tabular-nums mt-0.5 text-xs text-[var(--text-muted)]">
                      {rec.project_code} • {rec.record_date}
                    </div>
                  </div>
                  <div className="tabular-nums text-base font-bold text-[var(--accent-primary)]">
                    {formatMoney(rec.amount)}
                  </div>
                </div>

                {rec.explanation && (
                  <p className="mt-2 line-clamp-2 text-xs text-[var(--text-muted)]">{rec.explanation}</p>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                  <button
                    type="button"
                    onClick={() => setGalleryRecord(rec)}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      imgCount > 0
                        ? "bg-[var(--status-success)]/15 text-[var(--status-success)]"
                        : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                    }`}
                  >
                    <Paperclip className="h-3 w-3" />
                    <span>{imgCount > 0 ? `${t.attached} (${imgCount})` : t.noAttachment}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTicketRecord(rec)}
                      title={openTicketsCount > 0 ? `${openTicketsCount} ${t.openTicket}` : t.tickets}
                      aria-label={t.tickets}
                      className={`relative rounded-lg p-2 transition ${
                        openTicketsCount > 0
                          ? "bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/40"
                          : "bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-amber-500"
                      }`}
                    >
                      <MessageSquareWarning className="h-4 w-4" />
                      {openTicketsCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRecord(rec);
                        setFormOpen(true);
                      }}
                      className="rounded-lg bg-[var(--bg-elevated)] p-2 text-[var(--text-primary)]"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <HoldToDeleteButton
                      label={t.holdToDeleteHint}
                      onTrigger={() => setDeleteTarget(rec)}
                      className="bg-[var(--status-danger)]/10"
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2 text-sm disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4 ltr:rotate-180" />
          <span>{t.prevPage}</span>
        </button>

        <span className="tabular-nums text-xs text-[var(--text-muted)]">
          {page + 1}
        </span>

        <button
          type="button"
          disabled={records.length < PAGE_LIMIT}
          onClick={() => setPage((p) => p + 1)}
          className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2 text-sm disabled:opacity-40"
        >
          <span>{t.nextPage}</span>
          <ChevronLeft className="h-4 w-4 ltr:rotate-180" />
        </button>
      </div>

      {/* Modals */}
      <RecordFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={loadRecords}
        editingRecord={editingRecord}
        projectCodes={projectCodes}
        expenseCenters={expenseCenters}
        categories={categories}
      />

      <ReceiptGalleryModal
        record={galleryRecord}
        onClose={() => setGalleryRecord(null)}
        onUpdated={loadRecords}
      />

      <TicketModal
        record={ticketRecord}
        onClose={() => setTicketRecord(null)}
        onUpdated={loadRecords}
      />

      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteRecord}
        itemName={deleteTarget ? `${t.invoiceNo}: ${deleteTarget.invoice_no}` : undefined}
        loading={deleting}
      />
    </DashboardShell>
  );
}
