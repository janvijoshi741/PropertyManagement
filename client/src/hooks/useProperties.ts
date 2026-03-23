import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '@/api/properties.api';

export const useProperties = () =>
  useQuery({
    queryKey: ['properties'],
    queryFn: () => propertiesApi.getAll(),
  });

export const useProperty = (id: string) =>
  useQuery({
    queryKey: ['properties', id],
    queryFn: () => propertiesApi.getById(id),
    enabled: !!id,
  });
