"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const makeQueryClient = (): QueryClient => {
  return new QueryClient();
};

let clientQueryClient: QueryClient | undefined = undefined;

export const getQueryClient = (): QueryClient => {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!clientQueryClient) clientQueryClient = makeQueryClient();
    return clientQueryClient;
  }
};

const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = getQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default QueryProvider;
