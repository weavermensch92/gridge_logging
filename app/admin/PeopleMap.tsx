"use client";

import { useCallback, useState, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeProps,
  Handle,
  Position,
  MarkerType,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { X, Mail, Calendar, Star, Users, Zap, Network, Bot } from "lucide-react";
import clsx from "clsx";
import {
  PEOPLE_NODES, RELATION_EDGES, AI_COLLAB_EDGES,
  PersonNode, MOCK_LOGS,
} from "@/lib/mockData";

// ─── 뷰 모드 ─────────────────────────────────────────────────
type ViewMode = "people" | "ai";

// ─── 인맥 관계 스타일 ─────────────────────────────────────────
const PEOPLE_EDGE_STYLE: Record<string, { color: string }> = {
  협업:     { color: "#1722E8" },
  멘토링:   { color: "#8b5cf6" },
  보고:     { color: "#f59e0b" },
  프로젝트: { color: "#10b981" },
};

// ─── AI 관계 스타일 ───────────────────────────────────────────
const AI_EDGE_STYLE: Record<string, { color: string }> = {
  "공동작업":     { color: "#1722E8" },
  "AI 멘토링":    { color: "#8b5cf6" },
  "리뷰":         { color: "#10b981" },
  "프롬프트 공유": { color: "#f59e0b" },
};

// ─── AI 도구 색상 ─────────────────────────────────────────────
const TOOL_COLOR: Record<string, string> = {
  "claude-sonnet-4": "#d97706",
  "claude-haiku":    "#92400e",
  "gpt-4o":          "#16a34a",
  "gpt-4o-mini":     "#15803d",
  "gemini-1.5-pro":  "#1d4ed8",
};

const AIMI_COLOR: Record<number, string> = {
  1: "#f59e0b",
  2: "#3b82f6",
  3: "#8b5cf6",
};

const INITIAL_POSITIONS: Record<string, { x: number; y: number }> = {
  "u-005": { x: 380, y: 180 },
  "u-001": { x: 180, y: 60 },
  "u-002": { x: 580, y: 60 },
  "u-007": { x: 600, y: 300 },
  "u-003": { x: 160, y: 320 },
  "u-004": { x: 380, y: 380 },
  "u-008": { x: 50,  y: 480 },
  "u-006": { x: 550, y: 490 },
};

// ─── 유저별 AI 사용 통계 (MOCK_LOGS 집계) ────────────────────
const USER_AI_STATS = PEOPLE_NODES.reduce<Record<string, { count: number; tokens: number; topTool: string }>>((acc, p) => {
  const logs = MOCK_LOGS.filter((l) => l.user_id === p.id);
  const toolCount: Record<string, number> = {};
  logs.forEach((l) => { toolCount[l.model] = (toolCount[l.model] ?? 0) + 1; });
  const topTool = Object.entries(toolCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  acc[p.id] = {
    count: logs.length,
    tokens: logs.reduce((s, l) => s + l.input_tokens + l.output_tokens, 0),
    topTool,
  };
  return acc;
}, {});

// ─── 커스텀 노드 ─────────────────────────────────────────────
function PersonNodeCard({ data }: NodeProps) {
  const person = data.person as PersonNode;
  const mode = data.mode as ViewMode;
  const aiStats = USER_AI_STATS[person.id];

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: person.teamColor, border: "none", width: 6, height: 6 }} />
      <div
        className={clsx(
          "glass rounded-2xl px-3 py-2.5 cursor-pointer transition-all duration-200 select-none",
          data.selected ? "" : "hover:scale-105",
        )}
        style={{
          width: 152,
          borderLeft: `3px solid ${mode === "ai" ? (TOOL_COLOR[aiStats?.topTool] ?? "#6b7280") : person.teamColor}`,
          boxShadow: data.selected
            ? `0 0 0 2px ${person.teamColor}70, 0 8px 24px rgba(0,0,0,0.15)`
            : "0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: person.teamColor }}
          >
            {person.name[0]}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-800 truncate">{person.name}</div>
            <div className="text-[10px] text-gray-500 truncate">{person.role}</div>
          </div>
        </div>

        {mode === "people" ? (
          <div className="flex items-center justify-between">
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: `${person.teamColor}18`, color: person.teamColor }}>
              {person.team}
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: `${AIMI_COLOR[person.aimiLevel]}20`, color: AIMI_COLOR[person.aimiLevel] }}>
              Lv.{person.aimiLevel}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-gray-500 flex items-center gap-0.5">
              <Bot size={9} /> {aiStats?.count ?? 0}회
            </span>
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full truncate max-w-[72px]"
              style={{ background: `${TOOL_COLOR[aiStats?.topTool] ?? "#6b7280"}18`, color: TOOL_COLOR[aiStats?.topTool] ?? "#6b7280" }}>
              {aiStats?.topTool?.split("-")[0] ?? "-"}
            </span>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: person.teamColor, border: "none", width: 6, height: 6 }} />
    </>
  );
}

const nodeTypes = { person: PersonNodeCard };

// ─── 상세 패널 ───────────────────────────────────────────────
function DetailPanel({ person, mode, onClose }: { person: PersonNode; mode: ViewMode; onClose: () => void }) {
  const aiStats = USER_AI_STATS[person.id];
  const aiEdges = AI_COLLAB_EDGES.filter((e) => e.source === person.id || e.target === person.id);

  return (
    <div className="glass rounded-2xl p-5 w-64 shadow-xl">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base"
            style={{ background: person.teamColor }}>
            {person.name[0]}
          </div>
          <div>
            <div className="font-semibold text-gray-800">{person.name}</div>
            <div className="text-xs text-gray-500">{person.role}</div>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={16} />
        </button>
      </div>

      {mode === "people" ? (
        <>
          <div className="rounded-xl px-3 py-2 mb-3 flex items-center justify-between"
            style={{ background: `${AIMI_COLOR[person.aimiLevel]}12` }}>
            <div>
              <div className="text-xs text-gray-500">AIMI Score</div>
              <div className="font-bold text-lg" style={{ color: AIMI_COLOR[person.aimiLevel] }}>{person.aimiScore}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">레벨</div>
              <div className="font-semibold text-sm" style={{ color: AIMI_COLOR[person.aimiLevel] }}>
                Lv.{person.aimiLevel} · {person.aimiLabel}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mb-3 leading-relaxed">{person.bio}</p>
          <div className="mb-3">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Zap size={10} /> 주요 스킬
            </div>
            <div className="flex flex-wrap gap-1">
              {person.skills.map((s) => (
                <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>
          <div className="space-y-1.5 text-xs text-gray-500">
            <div className="flex items-center gap-2"><Users size={11} style={{ color: person.teamColor }} /><span style={{ color: person.teamColor }}>{person.team}</span></div>
            <div className="flex items-center gap-2"><Mail size={11} /><span className="truncate">{person.email}</span></div>
            <div className="flex items-center gap-2"><Calendar size={11} /><span>{person.joinDate} 입사</span></div>
          </div>
        </>
      ) : (
        <>
          {/* AI 사용 현황 */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-white/60 rounded-xl p-2 text-center">
              <div className="text-base font-bold text-gray-800">{aiStats?.count ?? 0}</div>
              <div className="text-[10px] text-gray-500">AI 쿼리</div>
            </div>
            <div className="bg-white/60 rounded-xl p-2 text-center">
              <div className="text-base font-bold" style={{ color: "#1722E8" }}>
                {((aiStats?.tokens ?? 0) / 1000).toFixed(0)}K
              </div>
              <div className="text-[10px] text-gray-500">총 토큰</div>
            </div>
          </div>
          <div className="mb-3">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">주 사용 도구</div>
            <span className="text-xs font-medium px-2 py-1 rounded-lg"
              style={{ background: `${TOOL_COLOR[aiStats?.topTool ?? ""] ?? "#6b7280"}18`, color: TOOL_COLOR[aiStats?.topTool ?? ""] ?? "#6b7280" }}>
              {aiStats?.topTool ?? "-"}
            </span>
          </div>
          {/* AI 협업 관계 */}
          {aiEdges.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Bot size={10} /> AI 협업 관계
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {aiEdges.map((e) => {
                  const partnerId = e.source === person.id ? e.target : e.source;
                  const partner = PEOPLE_NODES.find((p) => p.id === partnerId);
                  const isSource = e.source === person.id;
                  return (
                    <div key={e.id} className="flex items-center gap-2 text-xs">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                        style={{ background: partner?.teamColor ?? "#ccc" }}>
                        {partner?.name[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-700 truncate">{partner?.name}</div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] px-1 py-0.5 rounded"
                            style={{ background: `${AI_EDGE_STYLE[e.aiType]?.color}18`, color: AI_EDGE_STYLE[e.aiType]?.color }}>
                            {isSource ? "→" : "←"} {e.aiType}
                          </span>
                          <span className="text-[9px] text-gray-400">{e.sessions}회</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────
export default function PeopleMap() {
  const [viewMode, setViewMode] = useState<ViewMode>("people");
  const [selectedTeam, setSelectedTeam] = useState<string>("전체");
  const [selectedEdgeType, setSelectedEdgeType] = useState<string>("전체");
  const [selectedPerson, setSelectedPerson] = useState<PersonNode | null>(null);

  const teams = ["전체", "개발팀", "디자인팀", "기획팀"];

  const peopleEdgeTypes = ["전체", "협업", "멘토링", "보고", "프로젝트"];
  const aiEdgeTypes = ["전체", "공동작업", "AI 멘토링", "리뷰", "프롬프트 공유"];
  const edgeTypes = viewMode === "people" ? peopleEdgeTypes : aiEdgeTypes;
  const edgeStyleMap = viewMode === "people" ? PEOPLE_EDGE_STYLE : AI_EDGE_STYLE;

  const filteredPersonIds = useMemo(
    () => selectedTeam === "전체"
      ? PEOPLE_NODES.map((p) => p.id)
      : PEOPLE_NODES.filter((p) => p.team === selectedTeam).map((p) => p.id),
    [selectedTeam],
  );

  // 노드
  const buildNodes = useCallback(
    (mode: ViewMode, selectedId: string | null): Node[] =>
      PEOPLE_NODES.map((p) => ({
        id: p.id,
        type: "person",
        position: INITIAL_POSITIONS[p.id] ?? { x: 0, y: 0 },
        data: { person: p, mode, selected: p.id === selectedId },
        hidden: !filteredPersonIds.includes(p.id),
      })),
    [filteredPersonIds],
  );

  // 엣지
  const buildEdges = useCallback(
    (mode: ViewMode, edgeType: string): Edge[] => {
      if (mode === "people") {
        return RELATION_EDGES
          .filter((e) =>
            filteredPersonIds.includes(e.source) &&
            filteredPersonIds.includes(e.target) &&
            (edgeType === "전체" || e.type === edgeType),
          )
          .map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            label: e.label,
            labelStyle: { fontSize: 9, fill: "#6b7280" },
            labelBgStyle: { fill: "#f9fafb", fillOpacity: 0.85 },
            style: { stroke: PEOPLE_EDGE_STYLE[e.type].color, strokeWidth: 1.8, opacity: 0.75 },
            markerEnd: { type: MarkerType.ArrowClosed, color: PEOPLE_EDGE_STYLE[e.type].color, width: 14, height: 14 },
            animated: e.type === "멘토링",
          }));
      } else {
        return AI_COLLAB_EDGES
          .filter((e) =>
            filteredPersonIds.includes(e.source) &&
            filteredPersonIds.includes(e.target) &&
            (edgeType === "전체" || e.aiType === edgeType),
          )
          .map((e) => {
            const w = Math.min(1 + e.sessions / 4, 5); // sessions → strokeWidth
            const color = AI_EDGE_STYLE[e.aiType].color;
            return {
              id: e.id,
              source: e.source,
              target: e.target,
              label: `${e.topic} · ${e.sessions}회`,
              labelStyle: { fontSize: 9, fill: "#6b7280" },
              labelBgStyle: { fill: "#f0f9ff", fillOpacity: 0.9 },
              style: { stroke: color, strokeWidth: w, opacity: 0.8 },
              markerEnd: { type: MarkerType.ArrowClosed, color, width: 12, height: 12 },
              animated: e.aiType === "AI 멘토링",
            };
          });
      }
    },
    [filteredPersonIds],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes(viewMode, null));
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges(viewMode, selectedEdgeType));

  // 뷰모드 or 필터 변경 시 노드·엣지 재생성
  useEffect(() => {
    setNodes(buildNodes(viewMode, selectedPerson?.id ?? null));
    setEdges(buildEdges(viewMode, selectedEdgeType));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, filteredPersonIds, selectedEdgeType]);

  // 뷰모드 전환 시 엣지 타입 필터 초기화
  const switchMode = (mode: ViewMode) => {
    setViewMode(mode);
    setSelectedEdgeType("전체");
    setSelectedPerson(null);
  };

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const person = PEOPLE_NODES.find((p) => p.id === node.id) ?? null;
      setSelectedPerson((prev) => (prev?.id === node.id ? null : person));
      setNodes((ns) => ns.map((n) => ({ ...n, data: { ...n.data, selected: n.id === node.id } })));
    },
    [setNodes],
  );

  const onPaneClick = useCallback(() => {
    setSelectedPerson(null);
    setNodes((ns) => ns.map((n) => ({ ...n, data: { ...n.data, selected: false } })));
  }, [setNodes]);

  const stats = useMemo(() => {
    const visible = PEOPLE_NODES.filter((p) => filteredPersonIds.includes(p.id));
    const avgAimi = visible.reduce((s, p) => s + p.aimiScore, 0) / (visible.length || 1);
    const totalAiSessions = AI_COLLAB_EDGES
      .filter((e) => filteredPersonIds.includes(e.source) && filteredPersonIds.includes(e.target))
      .reduce((s, e) => s + e.sessions, 0);
    return { count: visible.length, avgAimi: avgAimi.toFixed(1), totalAiSessions };
  }, [filteredPersonIds]);

  return (
    <div className="flex gap-4 h-[680px]">
      {/* ── 사이드바 ── */}
      <div className="flex flex-col gap-3 w-52 flex-shrink-0">
        {/* 뷰 모드 토글 */}
        <div className="glass rounded-2xl p-1.5 flex gap-1">
          <button
            onClick={() => switchMode("people")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl font-medium transition-all",
              viewMode === "people" ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700",
            )}
            style={viewMode === "people" ? { background: "#1722E8" } : {}}
          >
            <Network size={12} /> 인맥 관계
          </button>
          <button
            onClick={() => switchMode("ai")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl font-medium transition-all",
              viewMode === "ai" ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700",
            )}
            style={viewMode === "ai" ? { background: "#7c3aed" } : {}}
          >
            <Bot size={12} /> AI 관계도
          </button>
        </div>

        {/* 통계 */}
        <div className="glass rounded-2xl p-3">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Overview</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/60 rounded-xl p-2 text-center">
              <div className="text-lg font-bold text-gray-800">{stats.count}</div>
              <div className="text-[10px] text-gray-500">구성원</div>
            </div>
            {viewMode === "people" ? (
              <div className="bg-white/60 rounded-xl p-2 text-center">
                <div className="text-lg font-bold" style={{ color: "#1722E8" }}>{stats.avgAimi}</div>
                <div className="text-[10px] text-gray-500">평균 AIMI</div>
              </div>
            ) : (
              <div className="bg-white/60 rounded-xl p-2 text-center">
                <div className="text-lg font-bold" style={{ color: "#7c3aed" }}>{stats.totalAiSessions}</div>
                <div className="text-[10px] text-gray-500">AI 협업 세션</div>
              </div>
            )}
          </div>
        </div>

        {/* 팀 필터 */}
        <div className="glass rounded-2xl p-3">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">팀 필터</div>
          <div className="flex flex-col gap-1">
            {teams.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTeam(t)}
                className={clsx(
                  "text-xs px-3 py-1.5 rounded-xl text-left transition-all font-medium",
                  selectedTeam === t ? "text-white shadow-sm" : "bg-white/50 text-gray-600 hover:bg-white/80",
                )}
                style={selectedTeam === t ? { background: viewMode === "ai" ? "#7c3aed" : "#1722E8" } : {}}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 관계 타입 필터 */}
        <div className="glass rounded-2xl p-3">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
            {viewMode === "people" ? "관계 타입" : "AI 협업 유형"}
          </div>
          <div className="flex flex-col gap-1">
            {edgeTypes.map((et) => (
              <button
                key={et}
                onClick={() => setSelectedEdgeType(et)}
                className={clsx(
                  "text-xs px-3 py-1.5 rounded-xl text-left transition-all font-medium flex items-center gap-2",
                  selectedEdgeType === et ? "bg-white/80 shadow-sm" : "bg-white/40 hover:bg-white/60",
                )}
              >
                {et !== "전체" && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: edgeStyleMap[et]?.color }} />
                )}
                <span className={selectedEdgeType === et ? "text-gray-800" : "text-gray-500"}>{et}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 범례 */}
        <div className="glass rounded-2xl p-3">
          {viewMode === "people" ? (
            <>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Star size={10} /> AIMI 레벨
              </div>
              {[{ lv: 1, label: "Starter", color: "#f59e0b" }, { lv: 2, label: "Reviewer", color: "#3b82f6" }, { lv: 3, label: "Architect", color: "#8b5cf6" }].map(({ lv, label, color }) => (
                <div key={lv} className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>Lv.{lv}</span>
                  <span className="text-[10px] text-gray-500">{label}</span>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Bot size={10} /> AI 도구 (노드 색)
              </div>
              {Object.entries(TOOL_COLOR).slice(0, 4).map(([tool, color]) => (
                <div key={tool} className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-[9px] text-gray-500 truncate">{tool}</span>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="text-[9px] text-gray-400">엣지 두께 = 협업 세션 수</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── 캔버스 ── */}
      <div className="flex-1 glass rounded-2xl overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.4}
          maxZoom={2}
          attributionPosition="bottom-right"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
          <Controls showInteractive={false} className="!shadow-none !border-0" />
          <MiniMap
            nodeColor={(n) => PEOPLE_NODES.find((x) => x.id === n.id)?.teamColor ?? "#ccc"}
            className="!rounded-xl !border-0 !shadow-lg"
          />

          {/* 캔버스 상단 뷰 모드 배지 */}
          <Panel position="top-left">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1.5 rounded-full text-white shadow-sm"
              style={{ background: viewMode === "ai" ? "#7c3aed" : "#1722E8" }}>
              {viewMode === "ai" ? <Bot size={10} /> : <Network size={10} />}
              {viewMode === "ai" ? "AI 협업 관계도" : "인맥 관계도"}
            </div>
          </Panel>

          {/* 상세 패널 */}
          {selectedPerson && (
            <Panel position="top-right">
              <DetailPanel
                person={selectedPerson}
                mode={viewMode}
                onClose={() => {
                  setSelectedPerson(null);
                  setNodes((ns) => ns.map((n) => ({ ...n, data: { ...n.data, selected: false } })));
                }}
              />
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}
