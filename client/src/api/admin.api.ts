import apiClient from './apiClient';
import type { ApiResponse, PaginatedUsers, AdminUser, ServiceRequest, AdminStats, DataImport } from '@/types';

export const adminApi = {
  getUsers: async (search?: string, page?: number): Promise<PaginatedUsers> => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (page) params.set('page', page.toString());
    const response = await apiClient.get<ApiResponse<PaginatedUsers>>(`/admin/users?${params}`);
    return response.data.data;
  },

  toggleUser: async (id: string, isActive: boolean): Promise<AdminUser> => {
    const response = await apiClient.patch<ApiResponse<AdminUser>>(`/admin/users/${id}`, { is_active: isActive });
    return response.data.data;
  },

  getServiceRequests: async (status?: string): Promise<ServiceRequest[]> => {
    const params = status ? `?status=${status}` : '';
    const response = await apiClient.get<ApiResponse<ServiceRequest[]>>(`/admin/service-requests${params}`);
    return response.data.data;
  },

  updateRequestStatus: async (id: string, status: string): Promise<ServiceRequest> => {
    const response = await apiClient.patch<ApiResponse<ServiceRequest>>(`/admin/service-requests/${id}`, { status });
    return response.data.data;
  },

  importData: async (data: { filename: string; rows: Record<string, unknown>[] }): Promise<{
    importId: string;
    status: string;
    rowsImported: number;
    errors: string[];
  }> => {
    const response = await apiClient.post<ApiResponse<{
      importId: string;
      status: string;
      rowsImported: number;
      errors: string[];
    }>>('/admin/import', data);
    return response.data.data;
  },

  getImports: async (): Promise<DataImport[]> => {
    const response = await apiClient.get<ApiResponse<DataImport[]>>('/admin/imports');
    return response.data.data;
  },

  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get<ApiResponse<AdminStats>>('/admin/stats');
    return response.data.data;
  },
};
