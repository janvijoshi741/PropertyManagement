import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/apiClient';

export function useAccountBalance() {
  return useQuery({
    queryKey: ['accountBalance'],
    queryFn: async () => {
      const response = await apiClient.get('/account-balance');
      return response.data.data;
    },
  });
}

export function usePropertyBalance(propertyId: string) {
  return useQuery({
    queryKey: ['propertyBalance', propertyId],
    queryFn: async () => {
      const response = await apiClient.get(`/properties/${propertyId}/balance`);
      return response.data.data;
    },
  });
}

export function usePaymentInstructions(invoiceId: string) {
  return useQuery({
    queryKey: ['paymentInstructions', invoiceId],
    queryFn: async () => {
      const response = await apiClient.get(`/payments/instructions/${invoiceId}`);
      return response.data.data;
    },
    enabled: !!invoiceId,
  });
}
