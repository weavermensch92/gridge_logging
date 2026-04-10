"use client";

import { AuthProvider } from "@/lib/auth/AuthContext";

export default function ProductionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
