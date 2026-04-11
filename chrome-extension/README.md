# Gridge AI Logger — Chrome Extension

Claude.ai / Gemini 웹에서 AI 사용 로그를 자동 수집하여 Gridge 서버로 전송하는 Chrome Extension.

## 구조

```
chrome-extension/
├── manifest.json              # Manifest V3 설정
├── background.js              # Service Worker (배치 전송, 큐 관리)
├── content-scripts/
│   ├── claude-capture.js      # claude.ai 프롬프트/응답 캡처
│   └── gemini-capture.js      # gemini.google.com 프롬프트/응답 캡처
├── popup/
│   ├── popup.html             # 팝업 UI (설정 + 상태)
│   └── popup.js               # 팝업 로직
├── icons/                     # 아이콘 (16/48/128px)
└── README.md
```

## 설치 방법 (개발 모드)

1. Chrome에서 `chrome://extensions` 접속
2. 우측 상단 **개발자 모드** 활성화
3. **압축해제된 확장 프로그램을 로드합니다** 클릭
4. `chrome-extension` 폴더 선택

## 설정

Extension 아이콘 클릭 → 팝업에서:

- **Gridge 서버 URL**: 온프레미스 서버 주소 (예: `https://gridge.company.com`)
- **API Key**: 관리자에게 발급받은 인증 키 (예: `ext_xxxxx`)
- **유저 ID**: 본인 유저 ID (예: `u-001`)

## 캡처 방식

### Claude.ai
- **프롬프트**: `contenteditable` div에서 Enter/Send 버튼 이벤트 감지
- **응답**: `MutationObserver`로 DOM 변경 감지 → 스트리밍 완료 후 텍스트 추출
- **모델**: 모델 선택기 UI에서 자동 감지

### Gemini
- **프롬프트**: `rich-textarea` 또는 `contenteditable` div 이벤트 감지
- **응답**: `model-response` 요소의 `MutationObserver`
- **모델**: UI에서 자동 감지 (기본: gemini-1.5-pro)

## 전송 방식

- 로그가 캡처되면 메모리 큐에 저장
- **10건 도달** 또는 **30초 경과** 시 자동 배치 전송
- `POST /api/logs/ingest` 엔드포인트로 전송
- 전송 실패 시 큐에 재추가 (재시도)

## 토큰 추정

tiktoken 라이브러리 없이 근사치 계산:
- 영어: ~4자 / 토큰
- 한글: ~2자 / 토큰

## 개발 참고

- Manifest V3 사용 (Service Worker 기반)
- Content Script는 isolated world에서 실행
- `chrome.storage.local`로 설정 영구 저장
- `chrome.runtime.sendMessage`로 content ↔ background 통신
