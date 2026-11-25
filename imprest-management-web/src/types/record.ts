export interface RecordImage {
  id: number;
  file_name: string;
  file_path: string;
}

export interface ExpenseRecord {
  id: string;
  company_id: number;
  invoice_no: string;
  project_code: string;
  amount: number;
  record_date: string; // Shamsi "YYYY/MM/DD"
  explanation: string | null;
  expense_center: string | null;
  expense_type: string | null;
  source_pc: string | null;
  created_by_id: number;
  created_by_name: string;
  deleted: boolean;
  created_at: string;
  last_modified: string;
  images: RecordImage[] | null;
}

export interface RecordUpdate {
  invoice_no?: string;
  project_code?: string;
  amount?: number;
  record_date?: string;
  explanation?: string;
  expense_center?: string;
  expense_type?: string;
}

export interface RecordFilters {
  invoice_no?: string;
  project_code?: string;
  explanation?: string;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}
