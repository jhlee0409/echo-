# Soulmate API Routes

이 디렉토리는 Vercel Serverless Functions로 구현된 API 엔드포인트들을 포함합니다.

## 📁 디렉토리 구조
```
src/api/
├── auth/              # 인증 관련 API
│   ├── signin.ts     # 로그인
│   ├── signup.ts     # 회원가입  
│   ├── refresh.ts    # 토큰 갱신
│   ├── signout.ts    # 로그아웃
│   └── types.ts      # 인증 타입 정의
├── ai/               # AI 대화 API
│   ├── chat.ts       # AI 대화 생성
│   ├── health.ts     # AI 서비스 상태
│   ├── usage.ts      # 사용량 조회
│   └── types.ts      # AI API 타입 정의
├── game/             # 게임 데이터 API
│   ├── save.ts       # 게임 저장
│   ├── load.ts       # 게임 로드
│   ├── saves.ts      # 세이브 목록
│   ├── stats.ts      # 게임 통계
│   └── types.ts      # 게임 API 타입 정의
├── user/             # 사용자 관리 API
│   ├── profile.ts    # 프로필 관리
│   └── types.ts      # 사용자 타입 정의
└── README.md         # 이 파일
```

## 🚀 배포 방식

### Vercel Serverless Functions
각 TypeScript 파일은 자동으로 API 엔드포인트로 변환됩니다:

- `src/api/auth/signin.ts` → `https://your-app.vercel.app/api/auth/signin`
- `src/api/ai/chat.ts` → `https://your-app.vercel.app/api/ai/chat`
- `src/api/game/save.ts` → `https://your-app.vercel.app/api/game/save`

### execution-plan.md 준수
모든 API는 execution-plan.md에서 정의한 설계 원칙을 따릅니다:

```javascript
// execution-plan.md에서 명시한 API 비용 절감 전략
const cachedResponses = new Map();

const getCachedOrGenerate = async (input, context) => {
  const cacheKey = `${input}_${context.mood}_${context.relationshipLevel}`;
  
  if (cachedResponses.has(cacheKey)) {
    return cachedResponses.get(cacheKey);
  }
  
  const response = await generateAIResponse(input, context);
  cachedResponses.set(cacheKey, response);
  return response;
};
```

## 📖 사용법

### 1. 개발 환경 설정
```bash
# 환경 변수 설정
cp .env.example .env.local

# 개발 서버 실행
npm run dev
```

### 2. API 테스트
```bash
# 로그인 테스트
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# AI 대화 테스트
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"messages":[{"role":"user","content":"안녕하세요"}],"context":{...}}'
```

## 🔒 보안

### 인증 방식
- **JWT Bearer Token**: 모든 보호된 엔드포인트에서 필요
- **Rate Limiting**: 사용자별/IP별 요청 제한
- **Input Validation**: 모든 입력값 검증 및 정제

### 보안 헤더
```typescript
res.setHeader('X-Content-Type-Options', 'nosniff');
res.setHeader('X-Frame-Options', 'DENY');
res.setHeader('X-XSS-Protection', '1; mode=block');
```

## 📊 모니터링

### 로깅
모든 API 요청은 구조화된 로그로 기록됩니다:

```json
{
  "requestId": "req_123456",
  "timestamp": "2024-08-07T12:00:00Z",
  "method": "POST",
  "endpoint": "/api/ai/chat",
  "userId": "user_789",
  "responseTime": 1250,
  "statusCode": 200,
  "cacheHit": true
}
```

### 에러 처리
표준화된 에러 응답 형식:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {...},
    "timestamp": 1691404800000,
    "requestId": "req_123456"
  }
}
```

## 🧪 테스트

### 단위 테스트
```bash
# API 테스트 실행
npm run test:api

# 커버리지 확인
npm run test:coverage
```

### 통합 테스트
```bash
# E2E API 테스트
npm run test:e2e
```

## 🔗 관련 문서

- [API Documentation](../docs/API_DOCUMENTATION.md) - 완전한 API 명세
- [Technical Documentation](../docs/TECHNICAL_DOCUMENTATION.md) - 기술적 구현 세부사항
- [execution-plan.md](../execution-plan.md) - 프로젝트 전체 계획