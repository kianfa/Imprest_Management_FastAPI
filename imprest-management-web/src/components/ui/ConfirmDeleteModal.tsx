"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useApp } from "@/context/AppContext";

interface ConfirmDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
  loading?: boolean;
}

export function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  itemName,
  loading = false,
}: ConfirmDeleteModalProps) {
  const { t } = useApp();

  return (
    <Modal open={open} onClose={onClose} title={t.confirmDeleteTitle} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--status-danger)]/15 text-[var(--status-danger)]">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <p className="text-sm text-[var(--text-primary)]">{t.confirmDelete}</p>
        {itemName && (
          <p className="mt-1.5 rounded-lg bg-[var(--bg-elevated)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
            {itemName}
          </p>
        )}

        <div className="mt-6 flex w-full gap-2.5">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2.5 text-sm font-medium hover:opacity-90"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-[var(--status-danger)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? t.loading : t.delete}
          </button>
        </div>
      </div>
    </Modal>
  );
}
