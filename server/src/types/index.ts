export interface JwtPayload {
  userId: string;
  email: string;
  role: 'customer' | 'admin' | 'master_admin';
  tenantId: string;
}

export interface UserRecord {
  id: string;
  tenant_id: string;
  email: string;
  password_hash: string | null;
  role: 'customer' | 'admin' | 'master_admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyRecord {
  id: string;
  tenant_id: string;
  external_ref: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postcode: string;
  property_type: string;
  created_at: string;
}

export interface InvoiceRecord {
  id: string;
  tenant_id: string;
  property_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'overdue';
  document_url: string | null;
  created_at: string;
}

export interface StatementRecord {
  id: string;
  tenant_id: string;
  property_id: string;
  statement_number: string;
  period_from: string;
  period_to: string;
  amount: number;
  document_url: string | null;
  created_at: string;
}

export interface ServiceRequestRecord {
  id: string;
  tenant_id: string;
  user_id: string;
  property_id: string;
  request_type: 'pet_request' | 'alteration_request' | 'general_enquiry';
  status: 'submitted' | 'in_review' | 'resolved';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface DataImportRecord {
  id: string;
  tenant_id: string;
  filename: string;
  imported_by: string;
  status: 'pending' | 'success' | 'failed';
  row_count: number;
  error_log: string | null;
  created_at: string;
}
