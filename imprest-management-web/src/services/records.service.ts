import { apiFetch, apiDownload } from "@/lib/api-client";
import type { ExpenseRecord, RecordFilters, RecordTicket, RecordUpdate } from "@/types/record";

function buildQuery(filters: RecordFilters): string {
  const params = new URLSearchParams();
  if (filters.invoice_no) params.set("invoice_no", filters.invoice_no);
  if (filters.project_code) params.set("project_code", filters.project_code);
  if (filters.expense_center) params.set("expense_center", filters.expense_center);
  if (filters.explanation) params.set("explanation", filters.explanation);
  if (filters.start_date) params.set("start_date", filters.start_date);
  if (filters.end_date) params.set("end_date", filters.end_date);
  if (filters.skip !== undefined) params.set("skip", String(filters.skip));
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const recordsService = {
  async getAll(filters: RecordFilters = {}): Promise<ExpenseRecord[]> {
    return apiFetch<ExpenseRecord[]>(`/records/${buildQuery(filters)}`);
  },

  async create(formData: FormData): Promise<ExpenseRecord> {
    return apiFetch<ExpenseRecord>("/records/", {
      method: "POST",
      body: formData,
    });
  },

  async update(id: string, data: RecordUpdate): Promise<ExpenseRecord> {
    return apiFetch<ExpenseRecord>(`/records/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<{ detail: string }> {
    return apiFetch<{ detail: string }>(`/records/${id}`, {
      method: "DELETE",
    });
  },

  async addImages(recordId: string, formData: FormData): Promise<ExpenseRecord> {
    return apiFetch<ExpenseRecord>(`/records/${recordId}/images`, {
      method: "POST",
      body: formData,
    });
  },

  async deleteImage(recordId: string, imageId: number): Promise<{ detail: string }> {
    return apiFetch<{ detail: string }>(`/records/${recordId}/images/${imageId}`, {
      method: "DELETE",
    });
  },

  async exportExcel(filters: RecordFilters = {}): Promise<void> {
    return apiDownload(`/records/export/excel${buildQuery(filters)}`, "imprest_records.xlsx");
  },

  async exportPdf(filters: RecordFilters = {}): Promise<void> {
    return apiDownload(`/records/export/pdf${buildQuery(filters)}`, "imprest_records.pdf");
  },

  async getTickets(recordId: string): Promise<RecordTicket[]> {
    return apiFetch<RecordTicket[]>(`/records/${recordId}/tickets`);
  },

  async createTicket(recordId: string, message: string): Promise<RecordTicket> {
    return apiFetch<RecordTicket>(`/records/${recordId}/tickets`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },

  async resolveTicket(recordId: string, ticketId: number): Promise<RecordTicket> {
    return apiFetch<RecordTicket>(`/records/${recordId}/tickets/${ticketId}/resolve`, {
      method: "PATCH",
    });
  },
};
