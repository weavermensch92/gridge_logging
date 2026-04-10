"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProductionEntry() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/production/login");
  }, [router]);

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg-base)" }}
    >
      <p className="text-sm text-gray-400">리다이렉트 중...</p>
    </main>
  );
}
