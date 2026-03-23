import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '@/api/invoices.api';

export const usePropertyInvoices = (propertyId: string) =>
  useQuery({
    queryKey: ['invoices', propertyId],
    queryFn: () => invoicesApi.getByProperty(propertyId),
    enabled: !!propertyId,
  });

export const useInvoice = (id: string) =>
  useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.getById(id),
    enabled: !!id,
  });

export const useAllInvoices = () =>
  useQuery({
    queryKey: ['documents', 'invoices'],
    queryFn: () => invoicesApi.getAllForUser(),
  });
