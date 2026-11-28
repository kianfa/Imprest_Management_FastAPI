"use client";

import React, { useState } from "react";
import { Upload } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { HoldToDeleteButton } from "@/components/ui/HoldToDeleteButton";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { compressImages } from "@/lib/imageCompression";
import { useApp } from "@/context/AppContext";
import { recordsService } from "@/services/records.service";
import type { ExpenseRecord, RecordImage } from "@/types/record";

interface ReceiptGalleryModalProps {
  record: ExpenseRecord | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function ReceiptGalleryModal({ record, onClose, onUpdated }: ReceiptGalleryModalProps) {
  const { t } = useApp();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<RecordImage | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!record) return null;

  const handleUploadMore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");
    try {
      const optimized = await compressImages(files);
      const fd = new FormData();
      optimized.forEach((f) => fd.append("images", f));
      await recordsService.addImages(record.id, fd);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const confirmDeleteImage = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      await recordsService.deleteImage(record.id, deleteTarget.id);
      setDeleteTarget(null);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const images = record.images || [];

  return (
    <Modal open={!!record} onClose={onClose} title={`${t.receiptGallery} (${record.invoice_no})`} maxWidth="max-w-2xl">
      {error && (
        <div role="alert" className="mb-4 rounded-xl bg-[var(--status-danger)]/10 p-3 text-sm text-[var(--status-danger)]">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-primary-hover)]">
          <Upload className="h-4 w-4" />
          <span>{uploading ? t.loading : t.addMoreImages}</span>
          <input type="file" multiple accept="image/*" onChange={handleUploadMore} className="hidden" disabled={uploading} />
        </label>
      </div>

      {images.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">{t.noAttachment}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {images.map((img) => (
            <div key={img.id} className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              <a href={img.file_path} target="_blank" rel="noreferrer">
                <img src={img.file_path} alt={img.file_name} className="h-48 w-full object-cover" />
              </a>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="truncate text-xs text-[var(--text-muted)]">{img.file_name}</span>
                <HoldToDeleteButton
                  label={t.holdToDeleteHint}
                  onTrigger={() => setDeleteTarget(img)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteImage}
        itemName={deleteTarget?.file_name}
        loading={deleting}
      />
    </Modal>
  );
}
