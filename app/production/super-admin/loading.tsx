import { Loader2 } from "lucide-react";
export default function SuperAdminLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}
