import { useQuery, useMutation } from '@tanstack/react-query';
import { requestsApi } from '@/api/requests.api';
import { queryClient } from '@/lib/queryClient';
import { toast } from 'sonner';
import axios from 'axios';

export const useServiceRequests = () =>
  useQuery({
    queryKey: ['service-requests'],
    queryFn: () => requestsApi.getAll(),
  });

export const useCreateRequest = () =>
  useMutation({
    mutationFn: requestsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      toast.success('Request submitted successfully');
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Failed to submit request');
      }
    },
  });
