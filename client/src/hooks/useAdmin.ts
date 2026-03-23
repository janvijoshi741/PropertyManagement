import { useQuery, useMutation } from '@tanstack/react-query';
import { adminApi } from '@/api/admin.api';
import { queryClient } from '@/lib/queryClient';
import { toast } from 'sonner';
import axios from 'axios';
import type { PaginatedUsers } from '@/types';

export const useAdminStats = () =>
  useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats(),
  });

export const useAdminUsers = (search?: string, page?: number) =>
  useQuery({
    queryKey: ['admin', 'users', search, page],
    queryFn: () => adminApi.getUsers(search, page),
  });

export const useToggleUser = () =>
  useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.toggleUser(id, isActive),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'users'] });
      const previousData = queryClient.getQueriesData<PaginatedUsers>({ queryKey: ['admin', 'users'] });
      
      queryClient.setQueriesData<PaginatedUsers>(
        { queryKey: ['admin', 'users'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            users: old.users.map((u) =>
              u.id === id ? { ...u, is_active: isActive } : u
            ),
          };
        }
      );
      return { previousData };
    },
    onError: (_error, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      toast.error('Failed to update user');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onSuccess: (_data, { isActive }) => {
      toast.success(isActive ? 'User activated' : 'User deactivated');
    },
  });

export const useAdminServiceRequests = (status?: string) =>
  useQuery({
    queryKey: ['admin', 'service-requests', status],
    queryFn: () => adminApi.getServiceRequests(status),
  });

export const useUpdateRequestStatus = () =>
  useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateRequestStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Request status updated');
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Failed to update request');
      }
    },
  });

export const useImportData = () =>
  useMutation({
    mutationFn: adminApi.importData,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'imports'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success(`Import complete — ${data.rowsImported} rows imported`);
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Import failed');
      }
    },
  });

export const useImportHistory = () =>
  useQuery({
    queryKey: ['admin', 'imports'],
    queryFn: () => adminApi.getImports(),
  });
