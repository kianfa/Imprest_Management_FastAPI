"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { JalaliDateInput } from "@/components/ui/JalaliDateInput";
import { useApp } from "@/context/AppContext";
import { recordsService } from "@/services/records.service";
import type { ExpenseRecord } from "@/types/record";
import type { LookupItem } from "@/types/lookup";

interface RecordFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingRecord: ExpenseRecord | null;
  projectCodes: LookupItem[];
  expenseCenters: LookupItem[];
  categories: LookupItem[];
}

export function RecordFormModal({
  open,
  onClose,
  onSuccess,
  editingRecord,
  projectCodes,
  expenseCenters,
  categories,
}: RecordFormModalProps) {
  const { t } = useApp();
  const [invoiceNo, setInvoiceNo] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [amount, setAmount] = useState("");
  const [recordDate, setRecordDate] = useState("");
  const [expenseCenter, setExpenseCenter] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [explanation, setExplanation] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingRecord) {
      setInvoiceNo(editingRecord.invoice_no);
      setProjectCode(editingRecord.project_code);
      setAmount(String(editingRecord.amount));
      setRecordDate(editingRecord.record_date);
      setExpenseCenter(editingRecord.expense_center || "");
      setExpenseType(editingRecord.expense_type || "");
      setExplanation(editingRecord.explanation || "");
    } else {
      setInvoiceNo("");
      setProjectCode(projectCodes[0]?.code || "");
      setAmount("");
      setRecordDate("");
      setExpenseCenter(expenseCenters[0]?.name || "");
      setExpenseType(categories[0]?.name || "");
      setExplanation("");
    }
    setFiles(null);
    setError("");
  }, [editingRecord, open, projectCodes, expenseCenters, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (editingRecord) {
        await recordsService.update(editingRecord.id, {
          invoice_no: invoiceNo.trim(),
          project_code: projectCode.trim(),
          amount: Number(amount),
          record_date: recordDate.trim(),
          expense_center: expenseCenter || undefined,
          expense_type: expenseType || undefined,
          explanation: explanation || undefined,
        });
      } else {
        const fd = new FormData();
        fd.append("invoice_no", invoiceNo.trim());
        fd.append("project_code", projectCode.trim());
        fd.append("amount", amount);
        fd.append("record_date", recordDate.trim());
        if (expenseCenter) fd.append("expense_center", expenseCenter);
        if (expenseType) fd.append("expense_type", expenseType);
        if (explanation) fd.append("explanation", explanation);
        if (files) {
          Array.from(files).forEach((file) => fd.append("images", file));
        }
        await recordsService.create(fd);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save record");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingRecord ? t.editReceipt : t.addReceipt}
    >
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-[var(--status-danger)]/40 bg-[var(--status-danger)]/10 px-3.5 py-2.5 text-sm text-[var(--status-danger)]"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="rec-invoice" className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
              {t.invoiceNo} *
            </label>
            <input
              id="rec-invoice"
              type="text"
              required
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-base outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <div>
            <label htmlFor="rec-date" className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
              {t.date} * (1403/08/03)
            </label>
            <JalaliDateInput
              id="rec-date"
              required
              placeholder="1403/08/03"
              value={recordDate}
              onChange={setRecordDate}
              className="min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-base outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="rec-project" className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
              {t.projectCode} *
            </label>
            {projectCodes.length > 0 ? (
              <select
                id="rec-project"
                required
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-base outline-none focus:border-[var(--accent-primary)]"
              >
                {projectCodes.map((p) => (
                  <option key={p.id} value={p.code || p.name}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="rec-project"
                type="text"
                required
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-base outline-none focus:border-[var(--accent-primary)]"
              />
            )}
          </div>

          <div>
            <label htmlFor="rec-amount" className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
              {t.amount} *
            </label>
            <input
              id="rec-amount"
              type="text"
              inputMode="numeric"
              required
              dir="ltr"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="tabular-nums min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-base outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="rec-center" className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
              {t.expenseCenter}
            </label>
            {expenseCenters.length > 0 ? (
              <select
                id="rec-center"
                value={expenseCenter}
                onChange={(e) => setExpenseCenter(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-base outline-none focus:border-[var(--accent-primary)]"
              >
                <option value="">—</option>
                {expenseCenters.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="rec-center"
                type="text"
                value={expenseCenter}
                onChange={(e) => setExpenseCenter(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-base outline-none focus:border-[var(--accent-primary)]"
              />
            )}
          </div>

          <div>
            <label htmlFor="rec-cat" className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
              {t.category}
            </label>
            {categories.length > 0 ? (
              <select
                id="rec-cat"
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-base outline-none focus:border-[var(--accent-primary)]"
              >
                <option value="">—</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="rec-cat"
                type="text"
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-base outline-none focus:border-[var(--accent-primary)]"
              />
            )}
          </div>
        </div>

        <div>
          <label htmlFor="rec-exp" className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
            {t.explanation}
          </label>
          <textarea
            id="rec-exp"
            rows={2}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 text-base outline-none focus:border-[var(--accent-primary)]"
          />
        </div>

        {!editingRecord && (
          <div>
            <label htmlFor="rec-images" className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
              {t.uploadImages}
            </label>
            <input
              id="rec-images"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setFiles(e.target.files)}
              className="w-full rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 text-sm"
            />
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-subtle)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--bg-elevated)]"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-primary-hover)] disabled:opacity-60"
          >
            {saving ? t.loading : t.save}
          </button>
        </div>
      </form>
    </Modal>
  );
}
