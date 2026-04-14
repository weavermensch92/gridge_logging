import { describe, it, expect } from "vitest";
import { validate, loginSchema, createUserSchema, riskRuleSchema, logIngestSchema } from "../validations";

describe("loginSchema", () => {
  it("유효한 로그인", () => {
    const result = validate(loginSchema, { email: "test@gridge.io", password: "123456" });
    expect(result.success).toBe(true);
  });

  it("이메일 형식 오류", () => {
    const result = validate(loginSchema, { email: "invalid", password: "123456" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors[0].field).toBe("email");
  });

  it("비밀번호 6자 미만", () => {
    const result = validate(loginSchema, { email: "test@gridge.io", password: "123" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors[0].field).toBe("password");
  });
});

describe("createUserSchema", () => {
  it("유효한 유저 생성", () => {
    const result = validate(createUserSchema, {
      name: "홍길동",
      email: "hong@company.com",
      team_id: "team-001",
      role: "member",
      ai_tools: ["chatgpt", "claude_code"],
      temp_password: "temp1234",
    });
    expect(result.success).toBe(true);
  });

  it("이름 빈 문자열", () => {
    const result = validate(createUserSchema, {
      name: "",
      email: "hong@company.com",
      team_id: "team-001",
      role: "member",
      ai_tools: [],
      temp_password: "temp1234",
    });
    expect(result.success).toBe(false);
  });

  it("잘못된 역할", () => {
    const result = validate(createUserSchema, {
      name: "홍길동",
      email: "hong@company.com",
      team_id: "team-001",
      role: "superuser",
      ai_tools: [],
      temp_password: "temp1234",
    });
    expect(result.success).toBe(false);
  });
});

describe("riskRuleSchema", () => {
  it("유효한 규칙", () => {
    const result = validate(riskRuleSchema, {
      name: "API Key 노출",
      category: "confidential",
      severity: "critical",
      match_field: "prompt",
      patterns: ["sk-proj-", "sk-ant-"],
    });
    expect(result.success).toBe(true);
  });

  it("패턴 빈 배열", () => {
    const result = validate(riskRuleSchema, {
      name: "빈 규칙",
      category: "custom",
      severity: "info",
      match_field: "both",
      patterns: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("logIngestSchema", () => {
  it("유효한 chat 로그", () => {
    const result = validate(logIngestSchema, {
      user_id: "u-001",
      channel: "anthropic",
      model: "claude-sonnet-4",
      prompt: "hello",
      response: "hi there",
      input_tokens: 10,
      output_tokens: 20,
      cost_usd: 0.01,
      latency_ms: 500,
    });
    expect(result.success).toBe(true);
  });

  it("음수 토큰", () => {
    const result = validate(logIngestSchema, {
      user_id: "u-001",
      channel: "anthropic",
      model: "test",
      prompt: "hello",
      response: "hi",
      input_tokens: -1,
      output_tokens: 20,
      cost_usd: 0,
      latency_ms: 100,
    });
    expect(result.success).toBe(false);
  });
});
