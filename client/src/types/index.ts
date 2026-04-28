export interface User {
  id: string;
  email: string;
  role: 'customer' | 'admin' | 'master_admin';
  tenantId: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Property {
  id: string;
  tenant_id: string;
  external_ref: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postcode: string;
  property_type: string;
  created_at: string;
  outstanding_invoice_count?: number;
}

export interface Invoice {
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
  properties?: Property;
}

export interface Statement {
  id: string;
  tenant_id: string;
  property_id: string;
  statement_number: string;
  period_from: string;
  period_to: string;
  amount: number;
  document_url: string | null;
  created_at: string;
  properties?: Property;
}

export interface ServiceRequest {
  id: string;
  tenant_id: string;
  user_id: string;
  property_id: string;
  request_type: 'pet_request' | 'alteration_request' | 'general_enquiry';
  status: 'submitted' | 'in_review' | 'resolved';
  notes: string;
  created_at: string;
  updated_at: string;
  properties?: {
    address_line1: string;
    city: string;
    postcode: string;
  };
  users?: {
    email: string;
  };
}

export interface DataImport {
  id: string;
  tenant_id: string;
  filename: string;
  imported_by: string;
  status: 'pending' | 'success' | 'failed';
  row_count: number;
  error_log: string | null;
  created_at: string;
  users?: {
    email: string;
  };
}

export interface AdminStats {
  totalCustomers: number;
  activeProperties: number;
  openRequests: number;
  importsRun: number;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'customer' | 'admin' | 'master_admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedUsers {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export type RequestType = 'pet_request' | 'alteration_request' | 'general_enquiry';
export type InvoiceStatus = 'unpaid' | 'paid' | 'overdue';
export type RequestStatus = 'submitted' | 'in_review' | 'resolved';
export type ImportStatus = 'pending' | 'success' | 'failed';

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  pet_request: 'Pet Request',
  alteration_request: 'Alteration Request',
  general_enquiry: 'General Enquiry',
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  submitted: 'Submitted',
  in_review: 'In Review',
  resolved: 'Resolved',
};

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}
