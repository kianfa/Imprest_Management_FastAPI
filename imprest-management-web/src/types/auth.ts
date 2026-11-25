export type UserRole = "super_admin" | "admin" | "user";

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  company_id: number | null;
  is_active: boolean;
  created_at: string;
}

export interface UserCreate {
  username: string;
  full_name: string;
  role: "admin" | "user";
  password: string;
}

export interface UserUpdate {
  full_name?: string;
  role?: "admin" | "user";
  is_active?: boolean;
  password?: string;
}
