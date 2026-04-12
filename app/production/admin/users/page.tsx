"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, X, Users,
  ToggleLeft, ToggleRight,
  Loader2, UserPlus, Shield, Edit3, Trash2,
} from "lucide-react";
import clsx from "clsx";
import type { User, UserRole, AiToolType, Team } from "@/types";
import { usersApi, teamsApi } from "@/lib/api";

const ROLE_LABEL: Record<UserRole, { label: string; color: string }> = {
  super_admin: { label: "Super Admin", color: "bg-purple-100 text-purple-700" },
  admin:       { label: "Admin",       color: "bg-blue-100 text-blue-700" },
  team_lead:   { label: "팀장",         color: "bg-indigo-100 text-indigo-700" },
  member:      { label: "Member",      color: "bg-gray-100 text-gray-600" },
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active:    { label: "활성",  color: "bg-emerald-100 text-emerald-700" },
  suspended: { label: "정지",  color: "bg-red-100 text-red-600" },
  invited:   { label: "온보딩 중", color: "bg-amber-100 text-amber-700" },
};

const ONBOARDING_LABEL: Record<string, string> = {
  password_change: "비밀번호 변경 대기",
  tool_install: "도구 설치 중",
  complete: "",
};

const AI_TOOL_LABEL: Record<AiToolType, string> = {
  chatgpt:     "ChatGPT",
  claude_web:  "Claude 웹",
  gemini_web:  "Gemini 웹",
  claude_code: "Claude Code",
  cursor:      "Cursor",
};

const ALL_AI_TOOLS: AiToolType[] = ["chatgpt", "claude_web", "gemini_web", "claude_code", "cursor"];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("전체");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const fetchTeams = useCallback(async () => {
    const res = await teamsApi.list();
    if (res.data) setTeams(res.data.teams);
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const selectedTeamId = teams.find(t => t.name === teamFilter)?.id;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await usersApi.list(
      selectedTeamId ? { team_id: selectedTeamId } : undefined,
    );
    if (res.data) setUsers(res.data.users);
    setLoading(false);
  }, [selectedTeamId]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = search
    ? users.filter(u =>
        u.name.includes(search) ||
        u.email.includes(search.toLowerCase())
      )
    : users;

  const teamNames = teams.map(t => t.name);

  const toggleAi = async (user: User) => {
    await usersApi.update(user.id, { ai_enabled: !user.ai_enabled });
    fetchUsers();
  };

  const suspendUser = async (user: User) => {
    if (!confirm(`${user.name}님을 비활성화하시겠습니까?`)) return;
    await usersApi.remove(user.id);
    fetchUsers();
  };

  // 승인 대기 유저 + AI 도구 승인 대기
  const pendingApproval = users.filter(u => u.status === "pending_approval");
  const pendingAiTools = users.filter(u =>
    u.ai_connections?.some(c => c.status === "pending_approval")
  );

  const approveUser = async (user: User) => {
    await usersApi.update(user.id, { status: "invited" } as Record<string, unknown>);
    fetchUsers();
  };

  const rejectUser = async (user: User) => {
    if (!confirm(`${user.name}님의 가입을 거절하시겠습니까?`)) return;
    await usersApi.remove(user.id);
    fetchUsers();
  };

  return (
    <div className="p-6 max-w-6xl">
        {/* 승인 대기 배너 */}
        {(pendingApproval.length > 0 || pendingAiTools.length > 0) && (
          <div className="mb-6 space-y-3">
            {pendingApproval.length > 0 && (
              <div className="glass rounded-2xl p-4 border-l-4 border-amber-400">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-amber-700 uppercase">가입 승인 대기</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">{pendingApproval.length}건</span>
                </div>
                <div className="space-y-2">
                  {pendingApproval.map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/40">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px]" style={{ background: "var(--accent)" }}>{u.name[0]}</div>
                      <div className="flex-1"><p className="text-sm font-medium text-gray-800">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></div>
                      <button onClick={() => approveUser(u)} className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg" style={{ background: "var(--accent)" }}>승인</button>
                      <button onClick={() => rejectUser(u)} className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200">거절</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {pendingAiTools.length > 0 && (
              <div className="glass rounded-2xl p-4 border-l-4" style={{ borderLeftColor: "var(--accent)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase" style={{ color: "var(--accent)" }}>AI 도구 승인 대기</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">{pendingAiTools.length}건</span>
                </div>
                <div className="space-y-2">
                  {pendingAiTools.map(u => {
                    const pending = u.ai_connections?.filter(c => c.status === "pending_approval") ?? [];
                    return (
                      <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/40">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{u.name}</p>
                          <p className="text-xs text-gray-400">신청: {pending.map(c => c.tool).join(", ")}</p>
                        </div>
                        <button onClick={() => { usersApi.update(u.id, {}); fetchUsers(); }}
                          className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg" style={{ background: "var(--accent)" }}>승인</button>
                        <button className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200">거절</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">유저 관리</h1>
            <p className="text-sm text-gray-500">유저 추가/삭제, AI 사용 권한 관리</p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "var(--accent)" }}>
            <UserPlus className="w-4 h-4" />
            유저 추가
          </button>
        </div>

        <div className="glass rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-gray-400">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium text-gray-600">필터</span>
          </div>
          <div className="flex gap-2">
            {["전체", ...teamNames].map(t => (
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
                    {["이름", "이메일", "팀", "역할", "AI 권한", "AI 도구", "한도 / 사용", "상태", "온보딩", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-16 text-center text-sm text-gray-400">
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
                          <td className="px-4 py-3 text-xs text-gray-600">{user.team_name}</td>
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
                            {user.onboarding_step !== "complete" && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                                {ONBOARDING_LABEL[user.onboarding_step]}
                              </span>
                            )}
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

      {showAddModal && (
        <AddUserModal teams={teams} onClose={() => setShowAddModal(false)} onSuccess={fetchUsers} />
      )}
      {editUser && (
        <EditUserModal user={editUser} teams={teams} onClose={() => setEditUser(null)} onSuccess={fetchUsers} />
      )}
    </div>
  );
}

const TOOL_INSTALL_GUIDE: Record<AiToolType, { method: string; desc: string }> = {
  chatgpt:     { method: "공유 계정", desc: "그릿지 제공 공유 계정이 자동 할당됩니다." },
  claude_web:  { method: "Chrome Extension", desc: "Chrome Extension을 설치해야 합니다." },
  gemini_web:  { method: "Chrome Extension", desc: "Chrome Extension을 설치해야 합니다." },
  claude_code: { method: "로컬 프록시", desc: "로컬 인터셉트 서비스를 설치해야 합니다." },
  cursor:      { method: "로컬 프록시", desc: "로컬 인터셉트 서비스를 설치해야 합니다." },
};

function AddUserModal({ teams, onClose, onSuccess }: { teams: Team[]; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
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
      name, email, team_id: teamId, role,
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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
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
              <label className="block text-xs font-medium text-gray-500 mb-1">팀 배정</label>
              <select value={teamId} onChange={e => setTeamId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none focus:ring-2 focus:ring-blue-200">
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">역할</label>
              <select value={role} onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none focus:ring-2 focus:ring-blue-200">
                <option value="member">Member</option>
                <option value="team_lead">팀장</option>
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
                    tools.has(t) ? "text-white border-transparent" : "bg-white/60 border-white/80 text-gray-500 hover:bg-white/80")}
                  style={tools.has(t) ? { background: "var(--accent)" } : {}}>
                  {AI_TOOL_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
          {/* 온보딩 설치 안내 (선택된 도구 기준) */}
          {tools.size > 0 && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
              <p className="text-xs font-semibold text-blue-700 mb-2">온보딩 시 설치 안내 (유저에게 자동 표시)</p>
              <div className="space-y-1.5">
                {Array.from(tools).map(t => {
                  const guide = TOOL_INSTALL_GUIDE[t];
                  return (
                    <div key={t} className="flex items-center gap-2 text-xs">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 font-medium">{AI_TOOL_LABEL[t]}</span>
                      <span className="text-gray-500">{guide.method}</span>
                      <span className="text-gray-400">— {guide.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">임시 비밀번호</label>
            <input type="text" value={tempPassword} onChange={e => setTempPassword(e.target.value)} required
              placeholder="관리자가 직접 전달"
              className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200" />
            <p className="text-[10px] text-gray-400 mt-1">첫 로그인 시 비밀번호 변경 → AI 도구 설치 안내 → 온보딩 완료</p>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/60 text-gray-600 hover:bg-white/80 transition-colors">취소</button>
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

function EditUserModal({ user, teams, onClose, onSuccess }: { user: User; teams: Team[]; onClose: () => void; onSuccess: () => void }) {
  const [role, setRole] = useState<UserRole>(user.role ?? "member");
  const [teamId, setTeamId] = useState(user.team_id);
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
      role, team_id: teamId,
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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">팀</label>
              <select value={teamId} onChange={e => setTeamId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none focus:ring-2 focus:ring-blue-200">
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">역할</label>
              <select value={role} onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-white/60 border border-white/80 text-gray-700 outline-none focus:ring-2 focus:ring-blue-200">
                <option value="member">Member</option>
                <option value="team_lead">팀장</option>
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
                    tools.has(t) ? "text-white border-transparent" : "bg-white/60 border-white/80 text-gray-500 hover:bg-white/80")}
                  style={tools.has(t) ? { background: "var(--accent)" } : {}}>
                  {AI_TOOL_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/60 text-gray-600 hover:bg-white/80 transition-colors">취소</button>
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
