"use client";

import { getQueryClient } from "@/lib/config/query";
import { QueryClientProvider } from "@tanstack/react-query";

const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = getQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default QueryProvider;
