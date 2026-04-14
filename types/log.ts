// 에이전트 모드 타입
export type ToolCallType = "file_read" | "file_write" | "bash" | "grep" | "glob" | "edit" | "web_search";

export type ToolCall = {
  id: string;
  type: ToolCallType;
  input: string;
  output_summary: string;
  timestamp: string;
  duration_ms: number;
};

export type FileChange = {
  path: string;
  action: "created" | "modified" | "deleted";
  additions: number;
  deletions: number;
  language: string;
};

export type AgentStep = {
  step: number;
  phase: "plan" | "execute" | "verify" | "iterate";
  description: string;
  tool_calls: ToolCall[];
  timestamp: string;
};

export type AgentDetail = {
  session_id: string;
  session_duration_ms: number;
  total_steps: number;
  total_tool_calls: number;
  files_changed: FileChange[];
  steps: AgentStep[];
  code_artifacts: { filename: string; language: string; snippet: string }[];
  summary: string;
};

// 로그 타입
export type Log = {
  id: string;
  user_id: string;
  user_name: string;
  team: string;
  channel: "anthropic" | "openai" | "gemini" | "extension" | "crawler";
  model: string;
  prompt: string;
  response: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  latency_ms: number;
  timestamp: string;
  mode?: "chat" | "agent";
  agent_detail?: AgentDetail;
};
