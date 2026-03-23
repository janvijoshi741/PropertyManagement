import apiClient from './apiClient';
import type { ApiResponse, ServiceRequest } from '@/types';

interface CreateRequestPayload {
  propertyId: string;
  requestType: string;
  notes: string;
}

export const requestsApi = {
  getAll: async (): Promise<ServiceRequest[]> => {
    const response = await apiClient.get<ApiResponse<ServiceRequest[]>>('/service-requests');
    return response.data.data;
  },

  create: async (data: CreateRequestPayload): Promise<ServiceRequest> => {
    const response = await apiClient.post<ApiResponse<ServiceRequest>>('/service-requests', data);
    return response.data.data;
  },
};
