# Gridge System HTTPS Proxy

모든 AI 데스크탑 앱(Claude Desktop, ChatGPT Desktop 등)의 트래픽을 인터셉트하여 **회사 계정 트래픽만** 로그를 수집합니다.

## 아키텍처

```
Claude Desktop / ChatGPT Desktop / 브라우저
        │
        ▼
   시스템 프록시 (localhost:9090)
        │
        ├─ AI 서비스 도메인? ──YES──► MITM (중간자)
        │                              │
        │                    회사 API Key/세션? ──YES──► 로그 캡처 → Gridge
        │                              │
        │                    개인 계정? ──────────────► 그냥 통과 (캡처 안 함)
        │
        └─ 다른 도메인? ────────────► 투명 터널링 (인터셉트 안 함)
```

## 설치 (3단계)

```bash
# 1. CA 인증서 생성
node gen-cert.js

# 2. 시스템에 인증서 설치 (관리자 권한 필요)
node install-cert.js

# 3. 프록시 시작 + 시스템 프록시 설정
node proxy.js &
node set-system-proxy.js on
```

## 해제

```bash
node set-system-proxy.js off
```

## 선택적 캡처 (config.json)

```json
{
  "captureMode": "company_only",
  
  "companyApiKeys": [
    "sk-ant-company-xxxx"    // 이 API Key로 호출된 것만 캡처
  ],
  
  "companySessionPatterns": [
    "company-session-"       // 이 패턴이 포함된 세션만 캡처
  ]
}
```

- `captureMode: "company_only"` → 회사 API Key / 세션만 캡처, 개인은 패스
- `captureMode: "all"` → 모든 트래픽 캡처

## 인터셉트 대상

| 도메인 | 서비스 | 캡처 대상 |
|--------|--------|----------|
| api.anthropic.com | Claude API (Desktop/Code) | `x-api-key` 헤더 → 회사 키 확인 |
| api.openai.com | OpenAI API (Desktop/Code) | `Authorization` 헤더 → 회사 키 확인 |
| claude.ai | Claude 웹 | 쿠키 세션 → 회사 계정 확인 |
| chatgpt.com | ChatGPT 웹 | 쿠키 세션 → 회사 계정 확인 |

다른 모든 도메인(Google, GitHub 등)은 **투명 터널링**되어 인터셉트하지 않습니다.
