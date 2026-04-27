import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    try {
      const current = Number(sessionStorage.getItem("sessionApiErrors") || "0");
      sessionStorage.setItem("sessionApiErrors", String(current + 1));
    } catch {
      // no-op
    }
    throw new Error(`${res.status}: ${text}`);
  }
}

export function apiRequest(url: string, options?: RequestInit): Promise<any>;
export function apiRequest(method: string, url: string, data?: unknown): Promise<any>;
export async function apiRequest(
  methodOrUrl: string,
  urlOrOptions: string | RequestInit = {},
  data?: unknown,
): Promise<any> {
  let url: string;
  let options: RequestInit;

  if (typeof urlOrOptions === "string") {
    const method = methodOrUrl;
    url = urlOrOptions;
    options = {
      method,
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    };
  } else {
    url = methodOrUrl;
    options = urlOrOptions;
  }

  const token = localStorage.getItem("auth_token");
  const hasFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(hasFormDataBody ? {} : { "Content-Type": "application/json" }),
    ...((options.headers as Record<string, string>) || {}),
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "GET",
    ...options,
    headers,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      staleTime: 5 * 60 * 1000, // Data becomes stale after 5 minutes
      gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
