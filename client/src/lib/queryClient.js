import { QueryClient } from "@tanstack/react-query";

// Create a function to throw error if response is not OK
async function throwIfResNotOk(res) {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Something went wrong");
  }
  return res;
}

// Create a reusable API request function
export async function apiRequest(method, path, data) {
  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  return throwIfResNotOk(res);
}

// Create a query function generator
export const getQueryFn = ({ on401 } = {}) => async ({ queryKey }) => {
  const [path] = queryKey;
  const res = await fetch(path);
  
  if (res.status === 401 && on401 === "returnNull") {
    return null;
  }
  
  await throwIfResNotOk(res);
  return res.json();
};

// Create and export the query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn(),
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});