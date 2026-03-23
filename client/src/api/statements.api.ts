import apiClient from './apiClient';
import type { ApiResponse, Statement } from '@/types';

export const statementsApi = {
  getByProperty: async (propertyId: string): Promise<Statement[]> => {
    const response = await apiClient.get<ApiResponse<Statement[]>>(`/properties/${propertyId}/statements`);
    return response.data.data;
  },

  getById: async (id: string): Promise<Statement> => {
    const response = await apiClient.get<ApiResponse<Statement>>(`/statements/${id}`);
    return response.data.data;
  },

  getAllForUser: async (): Promise<Statement[]> => {
    const response = await apiClient.get<ApiResponse<Statement[]>>('/documents/statements');
    return response.data.data;
  },
};
