"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function TeamLeadIndex() {
  const router = useRouter();
  useEffect(() => { router.replace("/production/team-lead/dashboard"); }, [router]);
  return null;
}
