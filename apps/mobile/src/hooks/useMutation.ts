import { useMutation as useReactMutation, UseMutationOptions } from '@tanstack/react-query';
import apiClient from '../lib/api-client';

// Re-export useMutation with default API client configuration
export function useMutation<TData = any, TError = any, TVariables = any>(
  options: UseMutationOptions<TData, TError, TVariables> & {
    url: string;
    method?: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  }
) {
  const { url, method = 'POST', ...mutationOptions } = options;

  return useReactMutation<TData, TError, TVariables>({
    ...mutationOptions,
    mutationFn: async (variables: TVariables) => {
      let response;
      switch (method) {
        case 'PUT':
          response = await apiClient.put(url, variables);
          break;
        case 'DELETE':
          response = await apiClient.delete(url);
          break;
        case 'PATCH':
          response = await apiClient.patch(url, variables);
          break;
        default:
          response = await apiClient.post(url, variables);
      }
      return response.data;
    },
  });
}
