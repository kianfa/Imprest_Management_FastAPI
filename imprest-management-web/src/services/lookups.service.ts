import { apiFetch } from "@/lib/api-client";
import type { LookupCreate, LookupItem, LookupUpdate } from "@/types/lookup";

export type LookupEndpoint = "project-codes" | "expense-centers" | "categories";

export const lookupsService = {
  async getAll(endpoint: LookupEndpoint, activeOnly?: boolean): Promise<LookupItem[]> {
    const query = activeOnly !== undefined ? `?is_active=${activeOnly}` : "";
    return apiFetch<LookupItem[]>(`/${endpoint}/${query}`);
  },

  async create(endpoint: LookupEndpoint, data: LookupCreate): Promise<LookupItem> {
    return apiFetch<LookupItem>(`/${endpoint}/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(endpoint: LookupEndpoint, id: number, data: LookupUpdate): Promise<LookupItem> {
    return apiFetch<LookupItem>(`/${endpoint}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(endpoint: LookupEndpoint, id: number): Promise<{ detail: string }> {
    return apiFetch<{ detail: string }>(`/${endpoint}/${id}`, {
      method: "DELETE",
    });
  },
};
