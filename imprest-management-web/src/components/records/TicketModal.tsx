"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Send,
  User,
  Check,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useApp } from "@/context/AppContext";
import { recordsService } from "@/services/records.service";
import type { ExpenseRecord, RecordTicket } from "@/types/record";

interface TicketModalProps {
  record: ExpenseRecord | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export function TicketModal({ record, onClose, onUpdated }: TicketModalProps) {
  const { t } = useApp();
  const [tickets, setTickets] = useState<RecordTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!record) {
      setTickets([]);
      setMessage("");
      setError("");
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError("");

    recordsService
      .getTickets(record.id)
      .then((data) => {
        if (isMounted) setTickets(data);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load tickets");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [record]);

  if (!record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || submitting) return;

    setSubmitting(true);
    setError("");
    try {
      const newTicket = await recordsService.createTicket(record.id, message.trim());
      setTickets((prev) => [newTicket, ...prev]);
      setMessage("");
      onUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (ticketId: number) => {
    if (resolvingId !== null) return;
    setResolvingId(ticketId);
    setError("");
    try {
      const updated = await recordsService.resolveTicket(record.id, ticketId);
      setTickets((prev) =>
        prev.map((item) => (item.id === ticketId ? updated : item))
      );
      onUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve ticket");
    } finally {
      setResolvingId(null);
    }
  };

  const openTicketsCount = tickets.filter((t) => t.status === "OPEN").length;

  return (
    <Modal open={!!record} onClose={onClose} title={t.ticketsTitle} maxWidth="max-w-2xl">
      <div className="space-y-4 p-5">
        {/* Record Context Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 text-xs">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[var(--text-muted)]">{t.invoiceNo}: </span>
              <span className="font-semibold">{record.invoice_no}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">{t.projectCode}: </span>
              <span className="font-medium">{record.project_code}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="tabular-nums font-bold text-[var(--accent-primary)]">
              {Number(record.amount).toLocaleString()} {t.amount.split("(")[1]?.replace(")", "") || ""}
            </span>
            {openTicketsCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 font-medium text-amber-500">
                <AlertCircle className="h-3 w-3" />
                <span>
                  {openTicketsCount} {t.openTicket}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-medium text-emerald-500">
                <CheckCircle2 className="h-3 w-3" />
                <span>{t.resolved}</span>
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-[var(--status-danger)]/30 bg-[var(--status-danger)]/10 p-3 text-xs text-[var(--status-danger)]">
            {error}
          </div>
        )}

        {/* Tickets Thread List */}
        <div className="max-h-[340px] space-y-3 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div
                role="status"
                aria-label={t.loading}
                className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent"
              />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm text-[var(--text-muted)]">{t.noTickets}</p>
            </div>
          ) : (
            tickets.map((item) => {
              const isOpen = item.status === "OPEN";
              const isResolving = resolvingId === item.id;
              const dateStr = item.created_at
                ? new Date(item.created_at).toLocaleDateString("fa-IR")
                : "";

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-3.5 transition-colors ${
                    isOpen
                      ? "border-amber-500/30 bg-amber-500/[0.04]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-surface)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <span>{item.created_by.full_name || item.created_by.username}</span>
                          <span className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-normal text-[var(--text-muted)]">
                            {item.created_by.role === "admin" ? t.adminRole : t.userRole}
                          </span>
                        </div>
                        <div className="tabular-nums flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                          <Clock className="h-3 w-3" />
                          <span>{dateStr}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          isOpen
                            ? "bg-amber-500/15 text-amber-500"
                            : "bg-emerald-500/15 text-emerald-500"
                        }`}
                      >
                        {isOpen ? (
                          <>
                            <AlertCircle className="h-3 w-3" />
                            <span>{t.openTicket}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            <span>{t.resolved}</span>
                          </>
                        )}
                      </span>

                      {isOpen && (
                        <button
                          type="button"
                          onClick={() => handleResolve(item.id)}
                          disabled={isResolving}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-500 hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>{isResolving ? t.loading : t.markResolved}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">
                    {item.message}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* New Ticket Form (Admin) */}
        <form onSubmit={handleSubmit} className="border-t border-[var(--border-subtle)] pt-4">
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]">
            {t.addTicket}
          </label>
          <div className="flex gap-2">
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.ticketPlaceholder}
              className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]"
              disabled={submitting}
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={!message.trim() || submitting}
              className="inline-flex self-end items-center gap-1.5 rounded-xl bg-[var(--accent-primary)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{submitting ? t.submitting : t.addTicket}</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
