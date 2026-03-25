export interface User {
  id: number;
  name: string;
  email: string;
  role: 'rose' | 'owner' | 'rajaa' | 'accountant';
}

export interface Invoice {
  id: number;
  filename: string;
  original_name: string;
  supplier: string;
  amount: number | null;
  invoice_date: string | null;
  description: string | null;
  status: 'pending_rose' | 'pending_owner' | 'pending_rajaa' | 'validated' | 'rejected';
  uploaded_by: number;
  uploader_name: string;
  created_at: string;
  updated_at: string;
}

export interface Validation {
  id: number;
  invoice_id: number;
  validator_id: number;
  validator_name: string;
  validator_role: string;
  step: 'rose' | 'owner' | 'rajaa';
  action: 'approved' | 'rejected';
  comment: string | null;
  pdf_annotations: string | null;
  created_at: string;
}

export interface PdfEdit {
  id: number;
  invoice_id: number;
  editor_id: number;
  editor_name: string;
  filename: string;
  annotations: string | null;
  created_at: string;
}

export interface Annotation {
  type: 'text' | 'stamp';
  page: number;
  x: number;
  y: number;
  text: string;
  color?: string;
  fontSize?: number;
}
