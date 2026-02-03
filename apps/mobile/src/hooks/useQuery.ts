import { useQuery as useReactQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient from '../lib/api-client';

// Re-export useQuery with default API client configuration
export function useQuery<TData = any, TError = any>(
  options: Omit<UseQueryOptions<TData, TError>, 'queryFn'> & {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    data?: any;
  }
) {
  const { url, method = 'GET', data, ...queryOptions } = options;

  return useReactQuery<TData, TError>({
    ...queryOptions,
    queryFn: async () => {
      let response;
      switch (method) {
        case 'POST':
          response = await apiClient.post(url, data);
          break;
        case 'PUT':
          response = await apiClient.put(url, data);
          break;
        case 'DELETE':
          response = await apiClient.delete(url);
          break;
        case 'PATCH':
          response = await apiClient.patch(url, data);
          break;
        default:
          response = await apiClient.get(url);
      }
      return response.data;
    },
  });
}
