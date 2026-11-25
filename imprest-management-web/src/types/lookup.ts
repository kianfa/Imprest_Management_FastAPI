export interface LookupItem {
  id: number;
  company_id: number;
  code: string | null;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LookupCreate {
  code?: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface LookupUpdate {
  code?: string;
  name?: string;
  description?: string;
  is_active?: boolean;
}
