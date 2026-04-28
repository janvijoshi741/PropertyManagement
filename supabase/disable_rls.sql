-- PropertyPortal — Disable RLS on all tables
-- Run this in the Supabase SQL Editor if queries return empty data
-- The service_role key should bypass RLS, but we disable it
-- explicitly to avoid any issues.

ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE statements DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_imports DISABLE ROW LEVEL SECURITY;

-- Verify: list tables with RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
