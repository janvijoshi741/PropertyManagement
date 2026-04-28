-- PropertyPortal Phase 1 — Seed Data
-- Run after migration.sql

-- Tenant
INSERT INTO tenants (id, name, primary_color) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'PropertyPortal', '#059669');

-- Admin user (password: Admin1234!)
-- bcrypt hash of Admin1234! with 10 rounds
INSERT INTO users (id, tenant_id, email, password_hash, role, is_active) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'admin@propertyportal.com',
   '$2a$12$S36MDPPEBDeRtY/RHEHxKeFCzgskkGYt9WJBLhbe5NvfJjwzxiYIu',
   'master_admin', true);

-- Customer users
INSERT INTO users (id, tenant_id, email, role, is_active) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'jane.smith@example.com', 'customer', true),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
   'john.doe@example.com', 'customer', true);

-- Properties
INSERT INTO properties (id, tenant_id, external_ref, address_line1, city, postcode, property_type) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'PROP-001', '14 Maple Court', 'London', 'E1 6RF', 'Leasehold Flat'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
   'PROP-002', '7 Oak Avenue', 'Manchester', 'M2 3AB', 'Leasehold Flat'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
   'PROP-003', '22 Birch Lane', 'Bristol', 'BS1 4CD', 'Freehold House');

-- User-Property links
-- jane: Maple Court + Oak Avenue
-- john: Maple Court + Birch Lane
INSERT INTO user_properties (id, user_id, property_id) VALUES
  (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001'),
  (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002'),
  (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001'),
  (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003');

-- Invoices
INSERT INTO invoices (id, tenant_id, property_id, invoice_number, issue_date, due_date, amount, status) VALUES
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'INV-001', '2025-01-15', '2025-02-15', 1200.00, 'unpaid'),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
   'INV-002', '2025-01-15', '2025-02-15', 340.00, 'paid'),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003',
   'INV-003', '2025-01-15', '2025-02-15', 85.00, 'overdue'),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'INV-004', '2025-02-01', '2025-03-01', 35.00, 'unpaid'),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
   'INV-005', '2025-02-01', '2025-03-01', 950.00, 'paid');

-- Statements
INSERT INTO statements (id, tenant_id, property_id, statement_number, period_from, period_to, amount) VALUES
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'STMT-001', '2025-01-01', '2025-03-31', 3400.00),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
   'STMT-002', '2025-01-01', '2025-03-31', 1200.00),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003',
   'STMT-003', '2025-01-01', '2025-03-31', 2100.00);

-- Service Requests
INSERT INTO service_requests (id, tenant_id, user_id, property_id, request_type, status, notes) VALUES
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'pet_request', 'submitted', 'I would like to request permission to keep a small dog in my flat.'),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
   'alteration_request', 'in_review', 'Request to install a new kitchen countertop and replace cabinet doors.'),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003',
   'general_enquiry', 'resolved', 'Could you provide an update on the planned maintenance for the roof?');

-- Import history
INSERT INTO data_imports (id, tenant_id, filename, imported_by, status, row_count) VALUES
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001',
   'properties_feed_march.csv', 'b0000000-0000-0000-0000-000000000001',
   'success', 42);
