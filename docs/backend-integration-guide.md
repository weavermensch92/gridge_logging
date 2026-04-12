# 백엔드 연동 실행 가이드

> **전제**: API 스펙은 `docs/backend-requirements.md` 참조. 이 문서는 **실행 순서와 연동 방법**에 집중.

## 1. 연동 전환 (1분)

```bash
# .env.local
NEXT_PUBLIC_API_MODE=real
NEXT_PUBLIC_API_URL=http://localhost:4000
```

이것만으로 프론트엔드의 모든 `isMockMode()` 분기가 실제 fetch로 전환됨.

## 2. 백엔드 구현 순서 (우선도)

### Phase 1: 인증 (1일)

```
POST /api/auth/login
  → bcrypt 비밀번호 확인
  → JWT 생성 (payload: { user_id, role, org_id })
  → Set-Cookie: gridge_session=<JWT>; HttpOnly; Secure; SameSite=Strict
  → Set-Cookie: gridge_role=<role>; SameSite=Strict
  → Response: { user: User, token: string }

GET  /api/auth/me        → JWT 검증 → User 반환
POST /api/auth/logout     → 쿠키 삭제
POST /api/auth/change-password → bcrypt 재해싱
```

**프론트가 기대하는 쿠키:**
- `gridge_session`: HttpOnly (JS 접근 불가)
- `gridge_role`: JS 접근 가능 (middleware에서 읽음)

**CORS 필수 설정:**
```javascript
app.use(cors({
  origin: "http://localhost:3001",
  credentials: true,
}));
```

### Phase 2: CRUD (2일)

구현 순서: Users → Teams → Org Settings

```
GET    /api/users?team_id=&status=&page=&limit=
POST   /api/users          → 임시 비밀번호 bcrypt 해싱
PUT    /api/users/:id
DELETE /api/users/:id       → status="suspended"

GET    /api/teams           → member_count JOIN 집계
POST   /api/teams
PUT    /api/teams/:id
DELETE /api/teams/:id

GET    /api/org/settings
PUT    /api/org/settings
GET    /api/org/cost-summary → 팀별/유저별 SUM 집계
```

### Phase 3: 로그 수집 (2일)

```
POST /api/logs/ingest      → API Key 인증 (쿠키 아님)
  → 암호화된 경우: RSA 복호화 → AES 복호화
  → Zod 검증 (logIngestBulkSchema)
  → Bull Queue에 적재 → 202 반환
  → 워커: INSERT logs + UPDATE users.ai_used_usd

GET  /api/logs?team=&channel=&mode=&page=&limit=
GET  /api/logs/:id         → agent_detail JSONB 포함
GET  /api/logs/stats       → COUNT, SUM, AVG 집계
```

**암호화 복호화 (선택적):**
```javascript
// 요청 본문에 encrypted:true 있으면
const { encryptedKey, iv, authTag, ciphertext } = req.body;
const aesKey = crypto.privateDecrypt(
  { key: PRIVATE_KEY, padding: RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
  Buffer.from(encryptedKey, "base64")
);
const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, Buffer.from(iv, "base64"));
decipher.setAuthTag(Buffer.from(authTag, "base64"));
const payload = JSON.parse(Buffer.concat([
  decipher.update(Buffer.from(ciphertext, "base64")),
  decipher.final()
]).toString());
// payload = { logs: [...], api_key: "..." }
```

### Phase 4: 보안 + 성숙도 + 파일 (3일)

```
GET/POST/PUT/DELETE /api/risk-rules
GET    /api/risk-alerts?severity=&team=
PUT    /api/risk-alerts/:id/dismiss
GET/POST/DELETE /api/risk-exceptions

GET    /api/maturity/:userId    → maturity_assessments 캐시 조회 (AI 미호출)
GET    /api/reports?user_id=
GET    /api/reports/:id

GET    /api/files?team=&status=
POST   /api/files/upload        → multipart/form-data → MinIO/로컬 저장
GET    /api/files/:id/download
PUT    /api/files/:id
DELETE /api/files/:id

GET    /api/quota-requests
POST   /api/quota-requests
PUT    /api/quota-requests/:id

GET    /api/orgs               → super_admin 전용
POST   /api/orgs
DELETE /api/orgs/:id
PUT    /api/orgs/:id/admin
```

## 3. 응답 포맷 (반드시 준수)

```javascript
// 성공
res.json({ field1: value1, field2: value2 });
// 예: res.json({ users: [...], total: 50, page: 1, limit: 20 });

// 에러
res.status(401).json({ error: "INVALID_CREDENTIALS", message: "이메일 또는 비밀번호가 올바르지 않습니다." });
```

프론트의 `lib/api/client.ts`가 `res.ok` 여부로 성공/에러를 판별.
401 응답 시 자동으로 `/production/login`으로 리다이렉트.

## 4. DB 마이그레이션 (Prisma 권장)

```bash
npx prisma init
# schema.prisma 작성 후:
npx prisma migrate dev --name init
npx prisma db seed   # mockData 기반 시드
```

테이블 13개: `docs/backend-requirements.md` 4장 참조.

## 5. 검증 체크리스트

```
□ POST /api/auth/login → 쿠키 설정 확인
□ GET  /api/auth/me → 유저 정보 반환 확인
□ 프론트 로그인 → 역할별 페이지 이동 확인
□ GET  /api/users → 유저 목록 표시 확인
□ GET  /api/teams → 팀 목록 + member_count 확인
□ POST /api/logs/ingest → 로그 저장 확인
□ GET  /api/logs → 저장된 로그 조회 확인
□ 암호화 전송 → 복호화 → 로그 저장 확인
```
