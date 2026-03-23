import apiClient from './apiClient';
import type { ApiResponse, Invoice } from '@/types';

export const invoicesApi = {
  getByProperty: async (propertyId: string): Promise<Invoice[]> => {
    const response = await apiClient.get<ApiResponse<Invoice[]>>(`/properties/${propertyId}/invoices`);
    return response.data.data;
  },

  getById: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return response.data.data;
  },

  getAllForUser: async (): Promise<Invoice[]> => {
    const response = await apiClient.get<ApiResponse<Invoice[]>>('/documents/invoices');
    return response.data.data;
  },
};
