import { apiFetch } from "@/lib/api-client";
import type { User, UserCreate, UserUpdate } from "@/types/auth";

export const usersService = {
  async getAll(isActive?: boolean): Promise<User[]> {
    const query = isActive !== undefined ? `?is_active=${isActive}` : "";
    return apiFetch<User[]>(`/users/${query}`);
  },

  async create(data: UserCreate): Promise<User> {
    return apiFetch<User>("/users/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: UserUpdate): Promise<User> {
    return apiFetch<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<{ detail: string }> {
    return apiFetch<{ detail: string }>(`/users/${id}`, {
      method: "DELETE",
    });
  },
};
