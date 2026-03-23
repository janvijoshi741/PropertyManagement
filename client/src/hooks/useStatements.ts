import { useQuery } from '@tanstack/react-query';
import { statementsApi } from '@/api/statements.api';

export const usePropertyStatements = (propertyId: string) =>
  useQuery({
    queryKey: ['statements', propertyId],
    queryFn: () => statementsApi.getByProperty(propertyId),
    enabled: !!propertyId,
  });

export const useStatement = (id: string) =>
  useQuery({
    queryKey: ['statement', id],
    queryFn: () => statementsApi.getById(id),
    enabled: !!id,
  });

export const useAllStatements = () =>
  useQuery({
    queryKey: ['documents', 'statements'],
    queryFn: () => statementsApi.getAllForUser(),
  });
