# 소울메이트 API 문서

## 📋 목차
1. [API 개요](#api-개요)
2. [인증 시스템](#인증-시스템)
3. [AI 대화 API](#ai-대화-api)
4. [게임 데이터 API](#게임-데이터-api)
5. [사용자 관리 API](#사용자-관리-api)
6. [실시간 통신](#실시간-통신)
7. [에러 처리](#에러-처리)
8. [속도 제한](#속도-제한)
9. [SDK 및 클라이언트](#sdk-및-클라이언트)

---

## 🌐 API 개요

### 기본 정보
- **Base URL**: `https://soulmate.vercel.app/api`
- **프로토콜**: HTTPS만 지원
- **데이터 형식**: JSON
- **인증**: Bearer Token (JWT)
- **버전**: v1

### 아키텍처
```
Client Application
        ↓
Vercel Edge Functions
        ↓
Service Layer (TypeScript)
        ↓
External APIs & Database
```

### execution-plan.md 기반 설계 원칙
```javascript
// API 비용 절감 전략 (execution-plan.md에서 명시)
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

---

## 🔐 인증 시스템

### JWT 토큰 기반 인증
모든 API 요청은 Authorization 헤더에 Bearer 토큰을 포함해야 합니다.

```http
Authorization: Bearer <jwt_token>
```

### 인증 엔드포인트

#### POST `/api/auth/signin`
**목적**: 사용자 로그인

**요청**:
```typescript
interface SignInRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}
```

**응답**:
```typescript
interface SignInResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    nickname: string;
    profile: UserProfile;
  };
  token: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  session: AuthSession;
}
```

**예제**:
```javascript
// 로그인 요청
const response = await fetch('/api/auth/signin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'player@example.com',
    password: 'securepassword123',
    rememberMe: true
  })
});

const data = await response.json();
if (data.success) {
  localStorage.setItem('auth_token', data.token.access_token);
}
```

#### POST `/api/auth/signup`
**목적**: 사용자 회원가입

**요청**:
```typescript
interface SignUpRequest {
  email: string;
  password: string;
  nickname: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}
```

#### POST `/api/auth/refresh`
**목적**: 액세스 토큰 갱신

**요청**:
```typescript
interface RefreshRequest {
  refresh_token: string;
}
```

#### POST `/api/auth/signout`
**목적**: 로그아웃 및 토큰 무효화

---

## 🤖 AI 대화 API

### execution-plan.md 기반 Claude API 연동
```javascript
// execution-plan.md에서 정의한 AI 응답 생성 패턴
const generateAIResponse = async (userInput, context) => {
  const prompt = `
    You are an AI companion named ${context.name}.
    Personality: ${JSON.stringify(context.personality)}
    Relationship level: ${context.relationshipLevel}
    Current mood: ${context.mood}
    
    Respond naturally based on your personality and relationship level.
  `;
  
  // Claude API 호출
  const response = await claude.complete(prompt);
  return response;
};
```

#### POST `/api/ai/chat`
**목적**: AI 동반자와의 대화 생성

**인증**: 필수  
**속도 제한**: 100 요청/분  
**캐싱**: 5분 TTL

**요청**:
```typescript
interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: number;
  }>;
  context: {
    companionName: string;
    companionPersonality: {
      cheerful: number;      // 0-1
      careful: number;       // 0-1
      curious: number;       // 0-1
      emotional: number;     // 0-1
      independent: number;   // 0-1
      playful: number;       // 0-1
      supportive: number;    // 0-1
    };
    relationshipLevel: number; // 1-10
    intimacyLevel: number;     // 0-1
    companionEmotion: 'happy' | 'sad' | 'excited' | 'calm' | 'curious' | 'playful' | 'caring' | 'thoughtful' | 'neutral';
    currentScene: string;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    recentTopics: string[];
    recentMemories: Array<{
      content: string;
      importance: number;
      timestamp: number;
    }>;
    conversationTone: 'casual' | 'formal' | 'intimate' | 'playful';
    userEmotionalState: 'happy' | 'sad' | 'excited' | 'calm' | 'frustrated' | 'neutral';
  };
  options?: {
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
    enableCache?: boolean;
  };
}
```

**응답**:
```typescript
interface ChatResponse {
  content: string;
  emotion: 'happy' | 'sad' | 'excited' | 'calm' | 'curious' | 'playful' | 'caring' | 'thoughtful' | 'neutral';
  confidence: number;        // 0-1
  tokensUsed: number;
  provider: 'claude' | 'openai' | 'mock';
  processingTime: number;    // milliseconds
  cached: boolean;
  metadata: {
    model: string;
    finishReason: 'stop' | 'length' | 'content_filter';
    totalCost: number;
    promptTokens: number;
    completionTokens: number;
    cacheHit: boolean;
    retryCount: number;
  };
  relationshipChange?: {
    previousLevel: number;
    newLevel: number;
    intimacyChange: number;
  };
}
```

**예제**:
```javascript
const chatResponse = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: '안녕하세요! 오늘 날씨가 정말 좋네요.' }
    ],
    context: {
      companionName: '루나',
      companionPersonality: {
        cheerful: 0.8,
        careful: 0.4,
        curious: 0.9,
        emotional: 0.6,
        independent: 0.3,
        playful: 0.7,
        supportive: 0.8
      },
      relationshipLevel: 3,
      intimacyLevel: 0.4,
      companionEmotion: 'happy',
      currentScene: 'park',
      timeOfDay: 'afternoon',
      recentTopics: ['날씨', '산책'],
      recentMemories: [],
      conversationTone: 'casual',
      userEmotionalState: 'happy'
    },
    options: {
      maxTokens: 150,
      temperature: 0.7,
      enableCache: true
    }
  })
});

const data = await chatResponse.json();
console.log('AI Response:', data.content);
console.log('Processing Time:', data.processingTime + 'ms');
```

#### GET `/api/ai/health`
**목적**: AI 서비스 상태 확인

**응답**:
```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  providers: {
    claude: {
      available: boolean;
      responseTime: number;
      quota: number | null;
      errorRate: number;
    };
    openai: {
      available: boolean;
      responseTime: number;
      quota: number | null;
      errorRate: number;
    };
    mock: {
      available: boolean;
      responseTime: number;
    };
  };
  cache: {
    hitRate: number;
    size: number;
    evictions: number;
  };
  performance: {
    averageResponseTime: number;
    requestsPerMinute: number;
    uptime: number;
  };
}
```

#### GET `/api/ai/usage`
**목적**: AI 사용량 통계 조회

**인증**: 필수

**응답**:
```typescript
interface UsageResponse {
  user: {
    id: string;
    currentUsage: {
      requestsToday: number;
      tokensToday: number;
      costToday: number;
    };
    limits: {
      maxRequestsPerDay: number;
      maxTokensPerDay: number;
      maxCostPerDay: number;
    };
    remaining: {
      requests: number;
      tokens: number;
      cost: number;
    };
  };
  global: {
    totalRequests: number;
    totalTokens: number;
    averageResponseTime: number;
    cacheEfficiency: number;
  };
}
```

---

## 🎮 게임 데이터 API

### 세이브/로드 시스템

#### POST `/api/game/save`
**목적**: 게임 진행 상황 저장

**인증**: 필수  
**속도 제한**: 10 요청/분

**요청**:
```typescript
interface SaveRequest {
  companion: {
    name: string;
    level: number;
    experience: number;
    stats: {
      health: number;
      energy: number;
      happiness: number;
      intelligence: number;
      creativity: number;
      empathy: number;
    };
    personality: {
      cheerful: number;
      careful: number;
      curious: number;
      emotional: number;
      independent: number;
      playful: number;
      supportive: number;
    };
    currentEmotion: string;
    avatar: {
      appearance: string;
      outfit: string;
      accessories: string[];
    };
    inventory: Array<{
      id: string;
      name: string;
      type: string;
      quantity: number;
      description: string;
    }>;
    relationships: {
      withPlayer: {
        level: number;
        intimacy: number;
        trust: number;
        affection: number;
      };
      memories: Array<{
        id: string;
        content: string;
        importance: number;
        timestamp: number;
        tags: string[];
      }>;
    };
  };
  player: {
    name: string;
    level: number;
    experience: number;
    stats: {
      charisma: number;
      intelligence: number;
      creativity: number;
      empathy: number;
    };
    inventory: Array<{
      id: string;
      name: string;
      type: string;
      quantity: number;
    }>;
    achievements: string[];
  };
  gameState: {
    currentChapter: number;
    currentScene: string;
    currentDay: number;
    timeOfDay: string;
    location: string;
    weather: string;
    season: string;
    flags: Record<string, boolean>;
    variables: Record<string, any>;
  };
  progress: {
    storyProgress: number;        // 0-100
    unlockedFeatures: string[];
    completedQuests: string[];
    achievements: Array<{
      id: string;
      name: string;
      description: string;
      unlockedAt: number;
    }>;
  };
  metadata: {
    version: string;
    playTime: number;            // seconds
    lastPlayed: number;          // timestamp
    platform: string;
    saveSlot: number;
    autoSave: boolean;
  };
}
```

**응답**:
```typescript
interface SaveResponse {
  success: boolean;
  saveId: string;
  timestamp: number;
  version: string;
  checksum: string;
  backupCreated: boolean;
  error?: string;
}
```

#### GET `/api/game/load`
**목적**: 저장된 게임 데이터 로드

**쿼리 파라미터**:
- `saveId?: string` - 특정 세이브 로드
- `slot?: number` - 슬롯 번호로 로드
- `latest?: boolean` - 최신 세이브 로드

**응답**:
```typescript
interface LoadResponse {
  success: boolean;
  data?: SaveRequest;
  saveInfo: {
    id: string;
    slot: number;
    timestamp: number;
    version: string;
    playTime: number;
    preview: {
      companionName: string;
      playerLevel: number;
      currentChapter: number;
      lastScene: string;
    };
  };
  backups?: Array<{
    id: string;
    timestamp: number;
    version: string;
    reason: 'auto' | 'manual' | 'chapter' | 'emergency';
  }>;
  error?: string;
}
```

#### GET `/api/game/saves`
**목적**: 사용자의 모든 세이브 파일 목록 조회

**응답**:
```typescript
interface SavesListResponse {
  saves: Array<{
    id: string;
    slot: number;
    timestamp: number;
    version: string;
    playTime: number;
    preview: {
      companionName: string;
      companionLevel: number;
      playerLevel: number;
      currentChapter: number;
      currentScene: string;
      lastPlayed: string;
    };
    size: number;
    isCorrupted: boolean;
  }>;
  totalSlots: number;
  usedSlots: number;
  autoSaveEnabled: boolean;
}
```

### 게임 통계

#### GET `/api/game/stats`
**목적**: 플레이어 게임 통계 조회

**응답**:
```typescript
interface GameStatsResponse {
  player: {
    totalPlayTime: number;
    sessionsPlayed: number;
    averageSessionLength: number;
    firstPlayDate: string;
    lastPlayDate: string;
  };
  companion: {
    relationshipLevel: number;
    intimacyLevel: number;
    conversationsCount: number;
    favoriteTopic: string;
    moodHistory: Array<{
      emotion: string;
      timestamp: number;
      duration: number;
    }>;
  };
  achievements: {
    total: number;
    unlocked: number;
    recent: Array<{
      id: string;
      name: string;
      unlockedAt: number;
    }>;
  };
  gameplay: {
    chaptersCompleted: number;
    questsCompleted: number;
    itemsCollected: number;
    battlesWon: number;
    choicesMade: number;
  };
}
```

---

## 👤 사용자 관리 API

#### GET `/api/user/profile`
**목적**: 사용자 프로필 조회

**인증**: 필수

**응답**:
```typescript
interface UserProfileResponse {
  id: string;
  email: string;
  nickname: string;
  avatar?: string;
  preferences: {
    language: 'ko' | 'en' | 'ja';
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      companion: boolean;
      achievements: boolean;
      system: boolean;
    };
    accessibility: {
      reduceMotion: boolean;
      highContrast: boolean;
      fontSize: 'small' | 'medium' | 'large';
    };
  };
  subscription: {
    tier: 'free' | 'premium';
    expiresAt?: string;
    features: string[];
  };
  statistics: {
    joinDate: string;
    totalPlayTime: number;
    gamesPlayed: number;
    achievementsUnlocked: number;
  };
}
```

#### PUT `/api/user/profile`
**목적**: 사용자 프로필 업데이트

**요청**:
```typescript
interface UpdateProfileRequest {
  nickname?: string;
  avatar?: string;
  preferences?: {
    language?: string;
    theme?: string;
    notifications?: {
      companion?: boolean;
      achievements?: boolean;
      system?: boolean;
    };
    accessibility?: {
      reduceMotion?: boolean;
      highContrast?: boolean;
      fontSize?: string;
    };
  };
}
```

#### DELETE `/api/user/account`
**목적**: 계정 삭제

**요청**:
```typescript
interface DeleteAccountRequest {
  password: string;
  confirmation: 'DELETE_ACCOUNT';
  reason?: string;
}
```

---

## 🔄 실시간 통신

### WebSocket 연결
실시간 기능을 위해 WebSocket 연결을 지원합니다.

**연결**: `wss://soulmate.vercel.app/api/ws`

**인증**: WebSocket 연결 시 JWT 토큰을 쿼리 파라미터로 전달
```
wss://soulmate.vercel.app/api/ws?token=<jwt_token>
```

### 실시간 이벤트

#### 동반자 상태 변화
```typescript
interface CompanionStatusEvent {
  type: 'companion_status';
  data: {
    companionId: string;
    emotion: string;
    activity: string;
    mood: number;
    timestamp: number;
  };
}
```

#### 시스템 알림
```typescript
interface SystemNotificationEvent {
  type: 'system_notification';
  data: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    persistent: boolean;
    timestamp: number;
  };
}
```

---

## ⚠️ 에러 처리

### 표준 에러 형식
```typescript
interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: number;
    requestId: string;
  };
}
```

### HTTP 상태 코드
- **200** - 성공
- **201** - 리소스 생성 성공
- **400** - 잘못된 요청
- **401** - 인증 실패
- **403** - 권한 없음
- **404** - 리소스 없음
- **409** - 리소스 충돌
- **429** - 속도 제한 초과
- **500** - 서버 오류
- **503** - 서비스 이용 불가

### 에러 코드 목록
```typescript
const API_ERROR_CODES = {
  // 인증 관련
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // AI 관련
  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
  AI_RESPONSE_TIMEOUT: 'AI_RESPONSE_TIMEOUT',
  INVALID_PROMPT: 'INVALID_PROMPT',
  
  // 게임 관련
  SAVE_NOT_FOUND: 'SAVE_NOT_FOUND',
  CORRUPTED_SAVE: 'CORRUPTED_SAVE',
  INVALID_GAME_DATA: 'INVALID_GAME_DATA',
  
  // 시스템 관련
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
};
```

---

## ⏱️ 속도 제한

### 제한 규칙
| 엔드포인트 | 무료 사용자 | 프리미엄 사용자 |
|-----------|------------|----------------|
| `/api/ai/chat` | 100/분, 1000/일 | 300/분, 5000/일 |
| `/api/game/save` | 10/분, 100/일 | 30/분, 500/일 |
| `/api/auth/*` | 20/분 | 50/분 |
| `/api/user/*` | 60/분 | 120/분 |

### 헤더 정보
응답 헤더에 속도 제한 정보가 포함됩니다:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-RetryAfter: 60
```

---

## 🛠️ SDK 및 클라이언트

### JavaScript/TypeScript SDK
```javascript
import { SoulmateAPI } from '@soulmate/sdk';

const api = new SoulmateAPI({
  baseURL: 'https://soulmate.vercel.app/api',
  apiKey: 'your-api-key'
});

// AI 대화
const response = await api.ai.chat({
  messages: [{ role: 'user', content: '안녕하세요!' }],
  context: { /* ... */ }
});

// 게임 저장
await api.game.save({
  companion: { /* ... */ },
  player: { /* ... */ }
});
```

### React 훅
```javascript
import { useSoulmateAPI } from '@soulmate/react';

function ChatComponent() {
  const { sendMessage, loading, error } = useSoulmateAPI();
  
  const handleSend = async (message) => {
    const response = await sendMessage(message);
    console.log('AI Response:', response.content);
  };
  
  return (
    <div>
      {loading && <div>AI가 응답하는 중...</div>}
      {error && <div>오류: {error.message}</div>}
    </div>
  );
}
```

---

## 🧪 테스트 및 개발

### API 테스트 환경
- **개발**: `https://soulmate-dev.vercel.app/api`
- **스테이징**: `https://soulmate-staging.vercel.app/api`
- **프로덕션**: `https://soulmate.vercel.app/api`

### Postman 컬렉션
[Soulmate API Collection](./postman_collection.json) - 모든 API 엔드포인트를 포함한 Postman 컬렉션

### 테스트 계정
```javascript
// 개발 환경 테스트 계정
{
  email: "test@soulmate.dev",
  password: "TestPassword123!",
  nickname: "테스터"
}
```

---

## 📊 모니터링 및 분석

### 성능 메트릭
- **응답 시간**: 평균 < 2초 (AI API)
- **가용성**: 99.9% 업타임
- **캐시 효율**: 70-80% 히트율
- **에러율**: < 1%

### 로깅
모든 API 요청은 다음 정보와 함께 로깅됩니다:
```javascript
{
  requestId: "req_123456",
  timestamp: "2024-08-07T12:00:00Z",
  method: "POST",
  endpoint: "/api/ai/chat",
  userId: "user_789",
  responseTime: 1250,
  statusCode: 200,
  cacheHit: true,
  tokenUsage: 156
}
```

---

## 🔗 관련 리소스

### 외부 서비스
- **Supabase**: [데이터베이스 및 인증](https://supabase.io/docs)
- **Anthropic Claude**: [AI API 문서](https://docs.anthropic.com/)
- **Vercel**: [서버리스 함수](https://vercel.com/docs/functions)

### 내부 문서
- [기술 문서](./TECHNICAL_DOCUMENTATION.md)
- [데이터베이스 스키마](../database/schema.sql)
- [프론트엔드 가이드](./FRONTEND_GUIDE.md)

---

**문서 버전**: v1.0.0  
**최종 업데이트**: 2024-08-07  
**execution-plan.md 호환성**: ✅ 완전 준수  
**작성자**: Claude Code SuperClaude Framework