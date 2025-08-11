# Echo AI Companion Game (Soulmate) - Project Guide

## 📋 프로젝트 개요

**Echo**는 Claude API를 활용한 한국어 AI 컴패니언 RPG 게임입니다. 사용자는 AI 컴패니언 "아리아"와 실시간으로 대화하며 관계를 발전시켜 나갈 수 있습니다.

### 핵심 특징
- 🤖 **Claude API 기반 실시간 채팅**: 자연스러운 한국어 대화
- 🎭 **개성 있는 AI 컴패니언**: 성격 특성과 감정 상태 기반 응답
- 📈 **관계 발전 시스템**: 대화를 통한 경험치 및 친밀도 증가
- 🔄 **지능형 Fallback**: API 장애 시 Mock Provider 자동 전환
- ⚡ **성능 최적화**: 응답 캐싱, 토큰 관리, 서킷 브레이커 패턴

---

## 🏗️ 프로젝트 구조

```
src/
├── components/          # React 컴포넌트
│   ├── screens/         # 게임 화면 컴포넌트
│   ├── chat/           # 채팅 UI 컴포넌트
│   └── ui/             # 공통 UI 컴포넌트
├── store/              # Zustand 상태 관리
│   └── gameStore.ts    # 메인 게임 상태 (채팅 로직 포함)
├── services/           # 비즈니스 로직 서비스
│   ├── ai/            # AI 서비스 (핵심)
│   ├── auth/          # 인증 서비스
│   └── database/      # DB 서비스
├── types/              # TypeScript 타입 정의
├── config/            # 환경 설정
└── hooks/             # React 커스텀 훅
```

### 🧠 AI 시스템 아키텍처

**Provider Hierarchy**: Claude API → Mock Provider (Fallback)

```
AIManager (src/services/ai/AIManager.ts)
├── ClaudeProvider: Claude API 통신
├── MockProvider: 템플릿 기반 응답 (Fallback)
├── CostOptimizer: 비용/성능 최적화
└── SimpleCache: 응답 캐싱
```

---

## 🚀 개발 환경 설정

### 1. 환경 변수 설정
```bash
# .env.local 파일 생성
VITE_CLAUDE_API_KEY=sk-ant-api03-...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

### 2. 개발 서버 실행
```bash
npm install
npm run dev          # 개발 서버 시작 (포트 5173)
npm run build        # 프로덕션 빌드
npm run type-check   # TypeScript 검증
npm run lint         # ESLint 검사
npm run test         # 테스트 실행
```

### 3. Vite Proxy 설정
- Claude API 호출은 Vite proxy를 통해 CORS 우회 (`/api/claude/*`)
- API 키는 proxy 설정에서 자동으로 헤더에 추가

---

## 💬 핵심 채팅 시스템

### 데이터 플로우
1. **사용자 입력** → `gameStore.sendMessage()`
2. **Context 구성** → 컴패니언 상태, 관계 정보, 최근 대화 주제
3. **AI 요청** → `AIManager.generateResponse()`
4. **Provider 선택** → Claude API (우선) → Mock (Fallback)
5. **응답 처리** → 메시지 추가, 감정 업데이트, 경험치 증가

### 주요 코드 위치

**gameStore.ts:248-381** - 채팅 메시지 처리 로직
```typescript
// 컨텍스트 구성
const buildContext = () => ({
  companionName: state.companion!.name,
  companionPersonality: state.companion!.personalityTraits,
  relationshipLevel: state.companion!.relationshipStatus.level,
  // ... 기타 컨텍스트
})

// AI 서비스 호출
const aiResponse = await aiManager.generateResponse(aiRequest)
```

**AIManager.ts:160-206** - AI 응답 생성 메인 로직
```typescript
// 캐싱 확인 → Provider 선택 → Fallback 처리 → 응답 캐싱
async generateResponse(request: AIRequest): Promise<AIResponse>
```

---

## 🔧 중요한 컴포넌트들

### 1. GameStore (`src/store/gameStore.ts`)
- **책임**: 전체 게임 상태 관리 및 채팅 시스템 통합
- **주요 기능**: 
  - 컴패니언 상태 관리 (감정, 성격, 관계도)
  - 대화 기록 관리
  - AI 서비스 통합
  - 경험치 및 레벨 관리

### 2. AIManager (`src/services/ai/AIManager.ts`)
- **책임**: AI Provider 관리 및 요청 라우팅
- **주요 기능**:
  - Provider selection (Claude → Mock)
  - 응답 캐싱 (5분 TTL)
  - 서킷 브레이커 패턴 (5회 실패 시 차단)
  - 재시도 로직 (3회 시도, 지수 백오프)

### 3. ClaudeProvider (`src/services/ai/providers/ClaudeProvider.ts`)
- **책임**: Claude API와의 실제 통신
- **주요 기능**:
  - API 요청/응답 처리
  - 한국어 시스템 프롬프트 생성
  - 감정 분석 및 신뢰도 계산
  - 오류 처리 및 분류

### 4. 환경 설정 (`src/config/env.ts`)
- **책임**: 환경 변수 로딩 및 검증
- **특징**: API 키 형식 검증, 개발/운영 환경 분리

---

## 🎯 일반적인 작업 패턴

### AI 채팅 관련 수정
1. **컨텍스트 수정**: `gameStore.ts`의 `buildContext()` 함수
2. **응답 처리 수정**: `applyAIResponse()` 함수
3. **프롬프트 수정**: `ClaudeProvider.ts`의 `buildSystemPrompt()`

### 새로운 Provider 추가
1. `AIProvider` 인터페이스 구현
2. `AIManager.initializeProviders()`에 등록
3. 우선순위 및 Fallback 체인 설정

### 상태 관리 확장
1. 타입 정의: `src/types/index.ts`
2. 상태 추가: `gameStore.ts`의 interface 및 initial state
3. 액션 추가: store actions

---

## 📊 성능 및 모니터링

### 주요 메트릭
- **응답 시간**: Claude API <2000ms, Mock <100ms, Cache <50ms
- **캐시 적중률**: >30% 목표
- **토큰 사용량**: 평균 105 토큰/대화 (45 입력 + 60 출력)
- **오류율**: <10% 목표

### 로깅
```typescript
console.log('🤖 Sending request to AI service...')
console.log('✅ AI Response received from ${provider}')
console.log('🏥 AI Manager Health Status:', healthStatus)
```

### 디버깅 도구
- 브라우저 개발자 도구 콘솔에서 AI 요청/응답 확인
- `ENV.ENABLE_DEBUG_MODE = true`로 상세 로깅 활성화
- Zustand devtools로 상태 변화 추적

---

## 🚨 알려진 이슈 및 해결 방법

### 1. API 키 관련
- **문제**: API 키 노출 또는 인증 실패
- **해결**: 환경 변수 확인, 키 형식 검증 (`sk-ant-` 시작)
- **파일**: `src/config/env.ts:203-205`

### 2. Import 오류
- **문제**: `Failed to resolve import "@utils/serviceTest"`
- **해결**: 삭제된 파일 import 제거 완료
- **상태**: 해결됨 (2024-08-10)

### 3. AIManager 메서드 누락
- **문제**: `aiManager.isHealthy is not a function`
- **해결**: `isHealthy()` 메서드 추가 완료
- **파일**: `AIManager.ts:464-484`

---

## 🛡️ 보안 고려사항

### API 키 보안
- 환경 변수만 사용, 하드코딩 금지
- Pre-commit hook으로 민감 정보 커밋 방지 (설정 필요)
- BFG Cleaner로 Git 히스토리 정리 (완료)

### 입력 검증
- 사용자 메시지 길이 제한
- XSS 방지를 위한 입력 sanitization
- Rate limiting (클라이언트 사이드)

---

## 📝 추가 문서

- **설계 명세서**: `CLAUDE_AI_CHAT_DESIGN_SPEC.md` - AI 채팅 시스템 상세 설계
- **보안 가이드**: `SECURITY_CLEANUP_GUIDE.md` - API 키 보안 관리 가이드
- **실행 계획**: `execution-plan.md` - 프로젝트 구현 로드맵

---

## 🔄 최근 업데이트 (2024-08-10)

1. ✅ **API 키 보안 강화**: Git 히스토리에서 노출된 키 완전 제거
2. ✅ **동적 채팅 구현**: Mock 응답을 실제 Claude API 호출로 전환
3. ✅ **AIManager 안정성 개선**: `isHealthy()` 메서드 추가, 오류 처리 강화
4. ✅ **Import 오류 해결**: `serviceTest` 관련 순환 의존성 해결
5. ✅ **설계 문서 작성**: 117KB 상세 설계 명세서 완성

### 현재 상태
- 🟢 **Claude API 연동**: 정상 작동 (새 API 키 적용)
- 🟢 **채팅 시스템**: 실시간 대화 가능
- 🟢 **Fallback 시스템**: Mock Provider 정상 작동
- 🟡 **보안**: Pre-commit hook 설정 필요
- 🟡 **모니터링**: 자동화된 보안 스캔 설정 필요

---

*이 문서는 Echo 프로젝트에서 작업하는 Claude AI를 위한 종합 가이드입니다. 프로젝트 구조, 핵심 로직, 일반적인 작업 패턴을 이해하는 데 도움이 됩니다.*