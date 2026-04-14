"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function MemberIndex() {
  const router = useRouter();
  useEffect(() => { router.replace("/production/member/dashboard"); }, [router]);
  return null;
}
