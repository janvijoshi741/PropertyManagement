import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { queryClient } from '@/lib/queryClient';

// Layouts
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';

// Guards
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { AdminRoute } from '@/components/shared/AdminRoute';

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { AdminLoginPage } from '@/pages/auth/AdminLoginPage';

// Customer pages
import { DashboardPage } from '@/pages/customer/DashboardPage';
import { PropertyDetailPage } from '@/pages/customer/PropertyDetailPage';
import { DocumentsPage } from '@/pages/customer/DocumentsPage';
import { InvoiceDetailPage } from '@/pages/customer/InvoiceDetailPage';
import { StatementDetailPage } from '@/pages/customer/StatementDetailPage';
import { RequestsPage } from '@/pages/customer/RequestsPage';
import { NewRequestPage } from '@/pages/customer/NewRequestPage';

// Admin pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminRequestsPage } from '@/pages/admin/AdminRequestsPage';
import { AdminImportPage } from '@/pages/admin/AdminImportPage';
import { AdminAuditPage } from '@/pages/admin/AdminAuditPage';
import { AdminClientsPage } from '@/pages/admin/AdminClientsPage';
import { CustomerSettingsPage } from '@/pages/customer/CustomerSettingsPage';
import { CustomerImportPage } from '@/pages/customer/CustomerImportPage';
import { CustomerUsersPage } from '@/pages/customer/CustomerUsersPage';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              {/* Public auth routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Customer routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <CustomerLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/properties/:id" element={<PropertyDetailPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
                <Route path="/statements/:id" element={<StatementDetailPage />} />
                <Route path="/requests" element={<RequestsPage />} />
                <Route path="/requests/new" element={<NewRequestPage />} />
                <Route path="/settings" element={<CustomerSettingsPage />} />
                <Route path="/import" element={<CustomerImportPage />} />
                <Route path="/users" element={<CustomerUsersPage />} />
              </Route>

              {/* Admin routes */}
              <Route
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/clients" element={<AdminClientsPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/requests" element={<AdminRequestsPage />} />
                <Route path="/admin/audit" element={<AdminAuditPage />} />
              </Route>

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
