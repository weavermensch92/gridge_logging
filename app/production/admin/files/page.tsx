"use client";

import { useState } from "react";
import { Share2, Search, X, Download, Eye } from "lucide-react";
import clsx from "clsx";
import { SHARED_FILES } from "@/lib/mockData";

const FILE_TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  pdf:  { bg: "bg-red-100",    text: "text-red-600" },
  xlsx: { bg: "bg-green-100",  text: "text-green-600" },
  pptx: { bg: "bg-orange-100", text: "text-orange-600" },
  docx: { bg: "bg-blue-100",   text: "text-blue-600" },
  csv:  { bg: "bg-gray-100",   text: "text-gray-600" },
};

export default function FilesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = SHARED_FILES.filter(f => {
    if (statusFilter !== "전체" && f.status !== statusFilter) return false;
    if (search && !f.title.includes(search)) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">공유 파일</h1>
        <p className="text-sm text-gray-500">팀 간 공유 파일 관리</p>
      </div>

      {/* 필터 */}
      <div className="glass rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3">
        <Share2 className="w-4 h-4 text-gray-400" />
        <div className="flex gap-2">
          {["전체", "공유중", "초안", "만료"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={clsx("text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
                statusFilter === s ? "text-white" : "bg-white/60 text-gray-500 hover:bg-white/80")}
              style={statusFilter === s ? { background: "var(--accent)" } : {}}>
              {s}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 bg-white/60 rounded-xl px-3 py-1.5">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="파일명 검색" value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-40" />
          {search && <button onClick={() => setSearch("")}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
        </div>
      </div>

      {/* 파일 목록 */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/50 bg-white/20">
                {["파일", "유형", "공유자", "상태", "태그", "공유일", ""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">파일이 없습니다.</td></tr>
              ) : filtered.map(file => {
                const style = FILE_TYPE_STYLE[file.fileType] ?? FILE_TYPE_STYLE.csv;
                return (
                  <tr key={file.id} className="border-b border-white/50 hover:bg-white/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-800">{file.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded uppercase", style.bg, style.text)}>
                        {file.fileType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{file.creator}</td>
                    <td className="px-4 py-3">
                      <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        file.status === "공유중" ? "bg-emerald-100 text-emerald-600" :
                        file.status === "초안" ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-500")}>
                        {file.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {file.tags.map(tag => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{file.sharedAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-white/60 text-gray-400 hover:text-gray-600">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-white/60 text-gray-400 hover:text-gray-600">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-white/50">
          <p className="text-xs text-gray-400">{filtered.length}개 파일</p>
        </div>
      </div>
    </div>
  );
}
