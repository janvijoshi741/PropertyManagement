import apiClient from './apiClient';
import type { ApiResponse, Property } from '@/types';

export const propertiesApi = {
  getAll: async (): Promise<Property[]> => {
    const response = await apiClient.get<ApiResponse<Property[]>>('/properties');
    return response.data.data;
  },

  getById: async (id: string): Promise<Property> => {
    const response = await apiClient.get<ApiResponse<Property>>(`/properties/${id}`);
    return response.data.data;
  },
};
