"use client";

import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Light-dismiss fallback for browsers without closedby="any" (e.g. Safari)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if ("closedBy" in HTMLDialogElement.prototype) return;
    const dialog = dialogRef.current;
    if (!dialog || e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    const isDialogContent =
      r.top <= e.clientY &&
      e.clientY <= r.bottom &&
      r.left <= e.clientX &&
      e.clientX <= r.right;
    if (!isDialogContent) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: "any" } as Record<string, unknown>)}
      aria-labelledby={titleId}
      onClose={() => {
        if (open) onClose();
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={handleBackdropClick}
      className={`m-auto w-[92vw] ${maxWidth} rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 text-[var(--text-primary)] shadow-2xl`}
    >
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
        <h1 id={titleId} className="text-lg font-semibold">
          {title}
        </h1>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
