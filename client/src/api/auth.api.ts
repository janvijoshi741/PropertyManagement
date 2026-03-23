import apiClient from './apiClient';
import type { ApiResponse, AuthResponse } from '@/types';

export const authApi = {
  requestOtp: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/request-otp', { email });
    return response.data.data;
  },

  verifyOtp: async (email: string, code: string): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/verify-otp', { email, code });
    return response.data.data;
  },

  adminLogin: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/admin/login', { email, password });
    return response.data.data;
  },
};
