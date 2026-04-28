-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  changes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extended Tenant configuration
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS secondary_color TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS font_family TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS min_payment_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_payment_amount NUMERIC(10,2) DEFAULT 5000.00;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS bank_sort_code TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS bank_account_number TEXT;

-- Infrastructure for Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  invoice_id UUID REFERENCES invoices(id),
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Invoice enhancement
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_due_reminder_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
