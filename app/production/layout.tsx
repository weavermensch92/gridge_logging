"use client";

import { AuthProvider } from "@/lib/auth/AuthContext";
import { QueryProvider } from "@/lib/query-provider";

export default function ProductionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}
