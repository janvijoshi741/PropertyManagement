import { useMutation } from '@tanstack/react-query';
import { settingsApi } from '@/api/settings.api';
import { useTheme } from '@/context/ThemeContext';
import { toast } from 'sonner';

export const useUpdateSettings = () => {
  const { refreshBranding } = useTheme();

  return useMutation({
    mutationFn: settingsApi.updateBranding,
    onSuccess: async () => {
      await refreshBranding();
      toast.success('Settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to update settings');
    },
  });
};
