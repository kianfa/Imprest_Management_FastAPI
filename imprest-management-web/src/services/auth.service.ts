import { apiFetch, setStoredToken, clearStoredToken } from "@/lib/api-client";
import type { TokenResponse, User } from "@/types/auth";

export const authService = {
  async login(username: string, password: string): Promise<TokenResponse> {
    const body = new URLSearchParams();
    body.append("username", username);
    body.append("password", password);

    const data = await apiFetch<TokenResponse>("/auth/login", {
      method: "POST",
      body,
    });
    setStoredToken(data.access_token);
    return data;
  },

  async getMe(): Promise<User> {
    return apiFetch<User>("/auth/me");
  },

  logout(): void {
    clearStoredToken();
  },
};
