export type UserRole = "super_admin" | "admin" | "member";
export type UserStatus = "active" | "suspended" | "invited";
export type AiToolType = "chatgpt" | "claude_web" | "gemini_web" | "claude_code" | "cursor";

export type User = {
  id: string;
  name: string;
  team: string;
  role: UserRole;
  email: string;
  ai_enabled?: boolean;
  ai_quota_usd?: number;
  ai_used_usd?: number;
  status?: UserStatus;
  ai_tools?: AiToolType[];
};

export type Team = {
  id: string;
  org_id: string;
  name: string;
};

export type Organization = {
  id: string;
  name: string;
  ai_budget_usd?: number;
  billing_cycle?: string;
};
