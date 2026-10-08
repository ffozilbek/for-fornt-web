"use client";

import { ApiError } from "@/lib/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // QueryClient har bir renderda qayta yaratilmasligi uchun useState ichida saqlanadi
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000, // 1 soniyagacha ma'lumotni yangi deb hisoblaydi
            refetchOnWindowFocus: false, // Oyna fokuslanganda ortiqcha so'rov yubormaslik
            retry: (failureCount, error) =>
              error instanceof ApiError && error.status && error.status < 500
                ? false
                : failureCount < 2,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
