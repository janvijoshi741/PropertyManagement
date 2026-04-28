import apiClient from './apiClient';

export const settingsApi = {
  updateBranding: async (data: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    font_family?: string;
  }) => {
    const response = await apiClient.patch('/me/tenant-config', data);
    return response.data.data;
  },

  getUsers: async () => {
    const response = await apiClient.get('/me/users');
    return response.data.data;
  },

  importData: async (filename: string, rows: any[]) => {
    const response = await apiClient.post('/me/import', { filename, rows });
    return response.data.data;
  },
};
