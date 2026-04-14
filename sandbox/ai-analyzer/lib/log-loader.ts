/**
 * Mock/DB 로그 로더 (추상화)
 */
import type { Log } from "./types";
import path from "path";

export function loadLogs(source: "mock" | "db", orgId?: string): Log[] {
  if (source === "mock") {
    // 동적 require로 mockData 로드 (TS → JS 호환)
    const mockPath = path.resolve(__dirname, "../../../lib/mockData.ts");
    // vitest에서는 ts import 가능, 런타임에서는 require
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const data = require(mockPath);
      return data.MOCK_LOGS || [];
    } catch {
      // fallback: 직접 파싱
      const fs = require("fs");
      const content = fs.readFileSync(mockPath, "utf-8");
      const match = content.match(/export const MOCK_LOGS[^=]*=\s*\[([\s\S]*?)\n\];/);
      if (!match) return [];
      try {
        return JSON.parse(`[${match[1]}]`);
      } catch {
        return [];
      }
    }
  }

  // DB 모드 (미래)
  throw new Error("DB 모드는 아직 미구현");
}

export function loadRiskRules(source: "mock" | "db") {
  if (source === "mock") {
    const mockPath = path.resolve(__dirname, "../../../lib/mockData.ts");
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const data = require(mockPath);
      return (data.MOCK_RISK_RULES || []).filter((r: { enabled: boolean }) => r.enabled);
    } catch {
      return [];
    }
  }
  throw new Error("DB 모드는 아직 미구현");
}
