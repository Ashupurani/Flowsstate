import { useQuery } from "@tanstack/react-query";

type AuthUser = {
  id?: number;
  name?: string;
  email?: string;
  profileImageUrl?: string;
};

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !!localStorage.getItem('auth_token'), // Only run query if token exists
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}