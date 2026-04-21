import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !!localStorage.getItem('auth_token'), // Only run query if token exists
  });

  // Debug auth state
  console.log('🔐 useAuth Debug:', { 
    user, 
    isLoading, 
    error: error?.message,
    hasToken: !!localStorage.getItem('auth_token'),
    isAuthenticated: !!user 
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}