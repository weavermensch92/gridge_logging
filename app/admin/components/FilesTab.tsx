"use client";

import { useState, useMemo } from "react";
import {
  FileText, FileSpreadsheet, Presentation, FileType2, Database,
  Eye, Download, MessageSquare, Search, X,
  Share2, Layers,
} from "lucide-react";
import clsx from "clsx";
import type { FileType, FileStatus, SharedFile } from "@/types";
import { SHARED_FILES } from "@/lib/mockData";

const FILE_TYPE_META: Record<FileType, { icon: React.ReactNode; color: string; bg: string }> = {
  PDF:  { icon: <FileText        className="w-4 h-4" />, color: "text-red-600",    bg: "bg-red-50 border-red-200"    },
  XLSX: { icon: <FileSpreadsheet className="w-4 h-4" />, color: "text-green-600",  bg: "bg-green-50 border-green-200"  },
  PPTX: { icon: <Presentation    className="w-4 h-4" />, color: "text-orange-600", bg: "bg-orange-50 border-orange-200"},
  DOCX: { icon: <FileType2       className="w-4 h-4" />, color: "text-blue-600",   bg: "bg-blue-50 border-blue-200"   },
  CSV:  { icon: <Database        className="w-4 h-4" />, color: "text-purple-600", bg: "bg-purple-50 border-purple-200"},
};

const STATUS_BADGE: Record<FileStatus, string> = {
  "공유중": "bg-emerald-100 text-emerald-700",
  "초안":   "bg-amber-100  text-amber-700",
  "만료":   "bg-gray-100   text-gray-500",
};

function FileRow({ file }: { file: SharedFile }) {
  const meta   = FILE_TYPE_META[file.fileType];
  const sharedDate = new Date(file.sharedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
  const updatedDate = new Date(file.updatedAt).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });

  return (
    <tr className="border-b border-white/50 hover:bg-white/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={clsx("p-1.5 rounded-lg border", meta.bg, meta.color)}>{meta.icon}</span>
          <div className="min-w-0">
            <p className="text-sm text-gray-800 font-medium leading-tight truncate max-w-[220px]">{file.title}</p>
            <p className="text-xs text-gray-400">{file.sizeMb} MB</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full border", meta.bg, meta.color)}>
          {file.fileType}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-700 whitespace-nowrap">{file.creator}</p>
        <p className="text-xs text-gray-400">{file.creatorTeam}</p>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 border border-white/80 text-gray-600 whitespace-nowrap">
          {file.sharedTo}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", STATUS_BADGE[file.status])}>
          {file.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
        <p>{sharedDate}</p>
        <p className="text-gray-400">업데이트 {updatedDate}</p>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{file.viewCount}</span>
          <span className="flex items-center gap-1"><Download className="w-3 h-3" />{file.downloadCount}</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{file.commentCount}</span>
        </div>
      </td>
    </tr>
  );
}

export default function FilesTab() {
  const [typeFilter,   setTypeFilter]   = useState<string>("전체");
  const [teamFilter,   setTeamFilter]   = useState<string>("전체");
  const [statusFilter, setStatusFilter] = useState<string>("전체");
  const [search,       setSearch]       = useState("");

  const filtered = useMemo(() => SHARED_FILES.filter(f => {
    if (typeFilter   !== "전체" && f.fileType    !== typeFilter)   return false;
    if (teamFilter   !== "전체" && f.sharedTo    !== teamFilter && f.creatorTeam !== teamFilter) return false;
    if (statusFilter !== "전체" && f.status      !== statusFilter) return false;
    if (search && !f.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [typeFilter, teamFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const total     = SHARED_FILES.length;
    const thisMonth = SHARED_FILES.filter(f => f.createdAt >= "2026-03-01").length;
    const totalViews = SHARED_FILES.reduce((s, f) => s + f.viewCount, 0);
    const totalDl    = SHARED_FILES.reduce((s, f) => s + f.downloadCount, 0);
    return { total, thisMonth, totalViews, totalDl };
  }, []);

  const typeCount = useMemo(() => {
    const m: Record<string, number> = {};
    SHARED_FILES.forEach(f => { m[f.fileType] = (m[f.fileType] ?? 0) + 1; });
    return m;
  }, []);

  const maxCount = Math.max(...Object.values(typeCount));
  const FILE_TYPES: FileType[] = ["PDF", "XLSX", "PPTX", "DOCX", "CSV"];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <Layers className="w-4 h-4"/>,     label: "총 공유 파일",  value: `${stats.total}개` },
          { icon: <Share2 className="w-4 h-4"/>,     label: "이번 달 신규",  value: `${stats.thisMonth}개` },
          { icon: <Eye className="w-4 h-4"/>,        label: "누적 열람",     value: stats.totalViews.toLocaleString() },
          { icon: <Download className="w-4 h-4"/>,   label: "누적 다운로드", value: stats.totalDl.toLocaleString() },
        ].map(({ icon, label, value }) => (
          <div key={label} className="glass rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-400 text-sm">{icon}<span>{label}</span></div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase mb-4 tracking-wider">파일 유형별 분포</p>
        <div className="flex items-end gap-4">
          {FILE_TYPES.map(type => {
            const count = typeCount[type] ?? 0;
            const meta  = FILE_TYPE_META[type];
            const pct   = Math.round((count / maxCount) * 100);
            return (
              <div key={type} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-sm font-bold text-gray-700">{count}</span>
                <div className="w-full rounded-t-lg" style={{ height: `${Math.max(8, pct * 0.8)}px`, background: "var(--accent)", opacity: 0.15 + (pct / 100) * 0.85 }} />
                <div className={clsx("p-1.5 rounded-lg border", meta.bg, meta.color)}>{meta.icon}</div>
                <span className="text-xs text-gray-500 font-medium">{type}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-white/50 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="파일명 검색..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-white/50 border border-white/60 focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder:text-gray-400"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {["전체", ...FILE_TYPES].map(t => {
                const meta = t !== "전체" ? FILE_TYPE_META[t as FileType] : null;
                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={clsx(
                      "text-xs px-2.5 py-1 rounded-full transition-colors border flex items-center gap-1",
                      typeFilter === t
                        ? "text-white border-transparent"
                        : meta
                          ? clsx("border-transparent", meta.bg, meta.color)
                          : "bg-white/40 border-white/60 text-gray-500 hover:bg-white/60"
                    )}
                    style={typeFilter === t ? { background: "var(--accent)" } : {}}
                  >
                    {meta && <span className={typeFilter === t ? "text-white" : meta.color}>{meta.icon}</span>}
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">대상</span>
              {["전체", "전체(공유대상)", "개발팀", "디자인팀", "기획팀"].map(t => {
                const label = t === "전체(공유대상)" ? "전사공유" : t;
                const val   = t === "전체(공유대상)" ? "전체" : t;
                return (
                  <button
                    key={t}
                    onClick={() => setTeamFilter(val)}
                    className={clsx(
                      "text-xs px-2.5 py-1 rounded-full transition-colors border",
                      teamFilter === val && t !== "전체"
                        ? "text-white border-transparent"
                        : teamFilter === val
                        ? "text-white border-transparent"
                        : "bg-white/40 border-white/60 text-gray-500 hover:bg-white/60"
                    )}
                    style={(teamFilter === val) ? { background: "var(--accent)" } : {}}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs text-gray-400">상태</span>
              {(["전체", "공유중", "초안", "만료"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={clsx(
                    "text-xs px-2.5 py-1 rounded-full transition-colors border",
                    statusFilter === s
                      ? "text-white border-transparent"
                      : "bg-white/40 border-white/60 text-gray-500 hover:bg-white/60"
                  )}
                  style={statusFilter === s ? { background: "var(--accent)" } : {}}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/50 bg-white/20">
                {["파일명", "유형", "생성자", "공유 대상", "상태", "공유일", "활동"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0
                ? filtered.map(f => <FileRow key={f.id} file={f} />)
                : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                      조건에 맞는 파일이 없습니다
                    </td>
                  </tr>
                )
              }
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-white/50">
          <p className="text-xs text-gray-400">{filtered.length}개 표시 · 전체 {SHARED_FILES.length}개</p>
        </div>
      </div>
    </div>
  );
}
