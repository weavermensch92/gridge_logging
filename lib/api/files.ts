import { api, isMockMode } from "./client";
import type { SharedFile } from "@/types";
import { SHARED_FILES } from "@/lib/mockData";

export const filesApi = {
  async list(params?: { team?: string; status?: string; page?: number; limit?: number }) {
    if (isMockMode()) {
      let filtered = [...SHARED_FILES];
      if (params?.team) filtered = filtered.filter(f => f.creatorTeam === params.team);
      if (params?.status) filtered = filtered.filter(f => f.status === params.status);
      return { data: { files: filtered, total: filtered.length } };
    }
    const query = new URLSearchParams();
    if (params?.team) query.set("team", params.team);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    return api.get<{ files: SharedFile[]; total: number }>(`/api/files?${query}`);
  },

  async upload(formData: FormData) {
    if (isMockMode()) return { data: { id: `file-${Date.now()}`, success: true } };
    // 실제 업로드는 multipart/form-data
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/files/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    return { data: await res.json() };
  },

  async download(id: string) {
    if (isMockMode()) return { data: { url: `#mock-download-${id}` } };
    return api.get<{ url: string }>(`/api/files/${id}/download`);
  },

  async update(id: string, payload: Partial<SharedFile>) {
    if (isMockMode()) return { data: { success: true } };
    return api.put<{ success: boolean }>(`/api/files/${id}`, payload);
  },

  async remove(id: string) {
    if (isMockMode()) return { data: { success: true } };
    return api.delete<{ success: boolean }>(`/api/files/${id}`);
  },
};
