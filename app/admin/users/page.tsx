"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Search, X, Users,
  ToggleLeft, ToggleRight, ChevronDown,
  Loader2, UserPlus, Shield, Edit3, Trash2,
} from "lucide-react";
import clsx from "clsx";
import type { User, UserRole, AiToolType } from "@/types";
import { usersApi } from "@/lib/api";

const ROLE_LABEL: Record<UserRole, { label: string; color: string }> = {
  super_admin: { label: "Super Admin", color: "bg-purple-100 text-purple-700" },
  admin:       { label: "Admin",       color: "bg-blue-100 text-blue-700" },
  member:      { label: "Member",      color: "bg-gray-100 text-gray-600" },
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active:    { label: "활성",  color: "bg-emerald-100 text-emerald-700" },
  suspended: { label: "정지",  color: "bg-red-100 text-red-600" },
  invited:   { label: "초대됨", color: "bg-amber-100 text-amber-700" },
};

const AI_TOOL_LABEL: Record<AiToolType, string> = {
  chatgpt:     "ChatGPT",
  claude_web:  "Claude 웹",
  gemini_web:  "Gemini 웹",
  claude_code: "Claude Code",
  cursor:      "Cursor",
};

const ALL_AI_TOOLS: AiToolType[] = ["chatgpt", "claude_web", "gemini_web", "claude_code", "cursor"];
const ALL_TEAMS = ["개발팀", "디자인팀", "기획팀"];

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("전체");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await usersApi.list(
      teamFilter !== "전체" ? { team: teamFilter } : undefined,
    );
    if (res.data) setUsers(res.data.users);
    setLoading(false);
  }, [teamFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = search
    ? users.filter(u =>
        u.name.includes(search) ||
        u.email.includes(search.toLowerCase())
      )
    : users;

  const toggleAi = async (user: User) => {
    await usersApi.update(user.id, { ai_enabled: !user.ai_enabled });
    fetchUsers();
  };

  const suspendUser = async (user: User) => {
    if (!confirm(`${user.name}님을 비활성화하시겠습니까?`)) return;
    await usersApi.remove(user.id);
    fetchUsers();
  };

  return (
    <main className="min-h-screen p-6" style={{ background: "var(--bg-base)" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
          style={{ background: "var(--accent)" }} />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/admin")}
              className="p-2 rounded-xl glass hover:scale-105 transition-transform">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">유저 관리</h1>
              <p className="text-sm text-gray-500">유저 추가/삭제, AI 사용 권한 관리</p>
            </div>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "var(--accent)" }}>
            <UserPlus className="w-4 h-4" />
            유저 추가
          </button>
        </div>

        {/* 필터 */}
        <div className="glass rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-gray-400">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium text-gray-600">필터</span>
          </div>
          <div className="flex gap-2">
            {["전체", ...ALL_TEAMS].map(t => (
              <button key={t} onClick={() => setTeamFilter(t)}
                className={clsx("text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
                  teamFilter === t ? "text-white" : "bg-white/60 text-gray-500 hover:bg-white/80")}
                style={teamFilter === t ? { background: "var(--accent)" } : {}}>
                {t}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 bg-white/60 rounded-xl px-3 py-1.5">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder="유저명 또는 이메일 검색"
              value={search} onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-48" />
            {search && (
              <button onClick={() => setSearch("")}>
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* 유저 테이블 */}
        <div className="glass rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/50 bg-white/20">
                    {["이름", "이메일", "팀", "역할", "AI 권한", "AI 도구", "한도 / 사용", "상태", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-16 text-center text-sm text-gray-400">
                        유저가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(user => {
                      const role = ROLE_LABEL[user.role ?? "member"];
                      const status = STATUS_LABEL[user.status ?? "active"];
                      return (
                        <tr key={user.id} className="border-b border-white/50 hover:bg-white/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                                style={{ background: "var(--accent)" }}>
                                {user.name[0]}
                              </div>
                              <span className="text-sm font-medium text-gray-800">{user.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{user.email}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">{user.team}</td>
                          <td className="px-4 py-3">
                            <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full", role.color)}>
                              {role.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => toggleAi(user)} className="flex-shrink-0">
                              {user.ai_enabled
                                ? <ToggleRight className="w-6 h-6 text-green-500" />
                                : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {(user.ai_tools ?? []).map(tool => (
                                <span key={tool} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                  {AI_TOOL_LABEL[tool]}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <span className="text-gray-700 font-medium">${(user.ai_used_usd ?? 0).toFixed(1)}</span>
                            <span className="text-gray-400"> / ${(user.ai_quota_usd ?? 0).toFixed(0)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full", status?.color)}>
                              {status?.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setEditUser(user)}
                                className="p-1.5 rounded-lg hover:bg-white/60 text-gray-400 hover:text-gray-600 transition-colors">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => suspendUser(user)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 py-3 border-t border-white/50">
            <p className="text-xs text-gray-400">{filtered.length}명 표시 · 전체 {users.length}명</p>
          </div>
        </div>
      </div>

      {/* 유저 추가 모달 */}
      {showAddModal && (
        <AddUserModal onClose={() => setShowAddModal(false)} onSuccess={fetchUsers} />
      )}

      {/* 유저 편집 모달 */}
      {editUser && (
        <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSuccess={fetchUsers} />
      )}
    </main>
  );
}

function AddUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [team, setTeam] = useState(ALL_TEAMS[0]);
  const [role, setRole] = useState<UserRole>("member");
  const [tools, setTools] = useState<Set<AiToolType>>(new Set());
  const [tempPassword, setTempPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleTool = (t: AiToolType) => {
    setTools(prev => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await usersApi.create({
      name,
      email,
      team,
      role,
      ai_tools: Array.from(tools),
      temp_password: tempPassword,
    });
    setSubmitting(false);
    onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-2xl p-6 w-[520px] max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <h3 className="text-lg font-bold text-gray-800">신규 유저 추가</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">이름</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">이메일</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">팀</label>
              <select value={team} onChange={e => setTeam(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none focus:ring-2 focus:ring-blue-200">
                {ALL_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">역할</label>
              <select value={role} onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none focus:ring-2 focus:ring-blue-200">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">AI 도구 선택</label>
            <div className="flex flex-wrap gap-2">
              {ALL_AI_TOOLS.map(t => (
                <button key={t} type="button" onClick={() => toggleTool(t)}
                  className={clsx("text-xs px-3 py-1.5 rounded-full font-medium transition-colors border",
                    tools.has(t)
                      ? "text-white border-transparent"
                      : "bg-white/60 border-white/80 text-gray-500 hover:bg-white/80")}
                  style={tools.has(t) ? { background: "var(--accent)" } : {}}>
                  {AI_TOOL_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">임시 비밀번호</label>
            <input type="text" value={tempPassword} onChange={e => setTempPassword(e.target.value)} required
              placeholder="관리자가 직접 전달"
              className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200" />
            <p className="text-[10px] text-gray-400 mt-1">첫 로그인 시 비밀번호 변경이 강제됩니다.</p>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/60 text-gray-600 hover:bg-white/80 transition-colors">
              취소
            </button>
            <button type="submit" disabled={submitting || !name || !email || !tempPassword}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: "var(--accent)" }}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose, onSuccess }: { user: User; onClose: () => void; onSuccess: () => void }) {
  const [role, setRole] = useState<UserRole>(user.role ?? "member");
  const [team, setTeam] = useState(user.team);
  const [tools, setTools] = useState<Set<AiToolType>>(new Set(user.ai_tools ?? []));
  const [quota, setQuota] = useState(String(user.ai_quota_usd ?? 50));
  const [submitting, setSubmitting] = useState(false);

  const toggleTool = (t: AiToolType) => {
    setTools(prev => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await usersApi.update(user.id, {
      role,
      team,
      ai_tools: Array.from(tools),
      ai_quota_usd: Number(quota),
    });
    setSubmitting(false);
    onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-2xl p-6 w-[480px] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <h3 className="text-lg font-bold text-gray-800">{user.name} 설정 변경</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">팀</label>
              <select value={team} onChange={e => setTeam(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none focus:ring-2 focus:ring-blue-200">
                {ALL_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">역할</label>
              <select value={role} onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none focus:ring-2 focus:ring-blue-200">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">AI 사용 한도 (USD)</label>
            <input type="number" value={quota} onChange={e => setQuota(e.target.value)} min="0" step="10"
              className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none focus:ring-2 focus:ring-blue-200" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">AI 도구</label>
            <div className="flex flex-wrap gap-2">
              {ALL_AI_TOOLS.map(t => (
                <button key={t} type="button" onClick={() => toggleTool(t)}
                  className={clsx("text-xs px-3 py-1.5 rounded-full font-medium transition-colors border",
                    tools.has(t)
                      ? "text-white border-transparent"
                      : "bg-white/60 border-white/80 text-gray-500 hover:bg-white/80")}
                  style={tools.has(t) ? { background: "var(--accent)" } : {}}>
                  {AI_TOOL_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/60 text-gray-600 hover:bg-white/80 transition-colors">
              취소
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: "var(--accent)" }}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
