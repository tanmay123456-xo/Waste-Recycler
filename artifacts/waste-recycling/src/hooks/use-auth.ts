import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useGetMe({ 
    query: { 
      retry: false,
      staleTime: 5 * 60 * 1000 // 5 minutes
    } 
  });

  const queryClient = useQueryClient();

  const invalidateAuth = () => {
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    invalidateAuth
  };
}
