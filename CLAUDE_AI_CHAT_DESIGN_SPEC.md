# 🤖 Claude API 활용 AI 채팅 시스템 설계 명세서

## 📋 개요

### 시스템 목적
- 실시간 AI 컴패니언과의 자연스러운 한국어 대화 제공
- Claude API를 활용한 고품질 AI 응답 생성
- 컴패니언 성격, 관계도, 감정 상태 기반 맥락적 대화
- 안정적인 fallback 시스템으로 서비스 연속성 보장

### 핵심 기능
1. **실시간 AI 채팅**: Claude API 기반 자연어 처리
2. **컨텍스트 인식**: 컴패니언 상태 기반 개인화된 응답
3. **감정 분석**: AI 응답 기반 감정 상태 동적 업데이트
4. **지능형 Fallback**: API 장애 시 Mock Provider 자동 전환
5. **성능 최적화**: 응답 캐싱, 토큰 사용량 관리

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────┐
│                 Frontend Layer                  │
├─────────────────────────────────────────────────┤
│ GameStore (Zustand)                            │
│ ├─ Conversation State                          │
│ ├─ Companion State                             │
│ └─ AI Integration Logic                        │
├─────────────────────────────────────────────────┤
│                AI Service Layer                 │
├─────────────────────────────────────────────────┤
│ AIManager                                      │
│ ├─ Provider Selection                          │
│ ├─ Request Optimization                        │
│ ├─ Circuit Breaker                             │
│ └─ Response Processing                         │
├─────────────────────────────────────────────────┤
│                Provider Layer                   │
├─────────────────────────────────────────────────┤
│ ClaudeProvider        │    MockProvider         │
│ ├─ API Integration    │    ├─ Template Engine   │
│ ├─ Context Building   │    ├─ Emotion Mapping   │
│ ├─ Response Parsing   │    └─ Fallback Logic    │
│ └─ Error Handling     │                         │
├─────────────────────────────────────────────────┤
│                External APIs                    │
├─────────────────────────────────────────────────┤
│ Claude API (Anthropic)     │    Local Cache     │
│ ├─ Haiku Model            │    ├─ Response      │
│ ├─ Message API            │    └─ Context       │
│ └─ Usage Tracking         │                    │
└─────────────────────────────────────────────────┘
```

---

## 🔧 핵심 컴포넌트

### 1. GameStore AI Integration

**책임**: 채팅 상태 관리 및 AI 서비스 통합

```typescript
interface ChatSystem {
  // State
  conversationHistory: Message[]
  isLoading: boolean
  error: string | null
  
  // Actions
  sendMessage: (message: string) => Promise<void>
  addMessage: (message: Message) => void
  clearConversation: () => void
}

interface AIIntegration {
  // Context Building
  buildConversationContext: () => ConversationContext
  
  // Response Processing  
  applyAIResponse: (response: AIResponse) => void
  applyFallbackResponse: (message: string) => void
  
  // State Updates
  updateCompanionEmotion: (emotion: EmotionType) => void
  updateConversationHistory: (topics: string[]) => void
  updateGameProgress: (provider: string) => void
}
```

### 2. AIManager 

**책임**: AI 서비스 라우팅 및 최적화

```typescript
class AIManager {
  // Provider Management
  private providers: Map<string, AIProvider>
  private circuitBreakers: Map<string, CircuitBreaker>
  
  // Core Methods
  generateResponse(request: AIRequest): Promise<AIResponse>
  isHealthy(): Promise<boolean>
  getHealthStatus(): Promise<Record<string, boolean>>
  
  // Optimization
  executeWithFallback(request: AIRequest, provider: string): Promise<AIResponse>
  executeWithRetry(provider: AIProvider, request: AIRequest): Promise<AIResponse>
  
  // Caching
  private cacheManager: SimpleCache
  generateCacheKey(request: AIRequest): string
}
```

### 3. ClaudeProvider

**책임**: Claude API 통신 및 응답 처리

```typescript
class ClaudeProvider implements AIProvider {
  name = 'claude'
  priority = 1
  maxTokens = 150
  
  // API Integration
  generateResponse(request: AIRequest): Promise<AIResponse>
  buildSystemPrompt(context: ConversationContext): string
  makeApiCall(request: ClaudeRequest): Promise<ClaudeResponse>
  
  // Response Processing
  analyzeEmotion(content: string, context: any): EmotionType
  calculateConfidence(response: ClaudeResponse): number
  processResponse(claudeResponse: ClaudeResponse): AIResponse
}
```

### 4. ConversationContext

**책임**: 대화 맥락 정보 구조화

```typescript
interface ConversationContext {
  // Companion Identity
  companionName: string
  companionPersonality: PersonalityTraits
  
  // Relationship State  
  relationshipLevel: number
  intimacyLevel: number
  companionEmotion: EmotionType
  
  // Environmental Context
  currentScene: string
  timeOfDay: string
  recentTopics: string[]
}

interface PersonalityTraits {
  cheerful: number     // 0-1
  careful: number      // 0-1  
  curious: number      // 0-1
  emotional: number    // 0-1
  independent: number  // 0-1
}
```

---

## 🔄 데이터 플로우

### 채팅 메시지 처리 플로우

```
1. User Input
   └─ GameStore.sendMessage(message: string)

2. Message Processing
   ├─ Add user message to history
   ├─ Build conversation context
   └─ Create AI request

3. AI Service Call
   ├─ AIManager.generateResponse()
   ├─ Provider selection (Claude > Mock)
   └─ Request with context

4. Claude API Processing
   ├─ System prompt generation
   ├─ Message context building  
   ├─ API call to Anthropic
   └─ Response parsing

5. Response Integration
   ├─ Add AI message to history
   ├─ Update companion emotion
   ├─ Update conversation context
   └─ Award experience points

6. Error Handling
   ├─ Circuit breaker monitoring
   ├─ Automatic fallback to Mock
   └─ Graceful error recovery
```

### Context Building 플로우

```
1. Companion State Extraction
   ├─ Name, personality traits
   ├─ Current emotion state
   └─ Relationship metrics

2. Conversation History  
   ├─ Recent topics (last 5)
   ├─ Mood history (last 10)
   └─ Response style preference

3. Environmental Context
   ├─ Current scene/location
   ├─ Time context
   └─ Game progress state

4. System Prompt Generation
   ├─ Korean language instruction
   ├─ Character personality integration
   ├─ Relationship-appropriate tone
   └─ Response length guidelines
```

---

## ⚡ 성능 최적화

### 1. 응답 캐싱 전략

```typescript
interface CacheStrategy {
  // Cache Key Generation
  key: string = hash(lastMessages + contextKey + options)
  
  // TTL Management
  defaultTTL: 5 minutes
  highConfidenceTTL: 1 hour
  
  // Cache Invalidation
  emotionChange: clear related entries
  relationshipLevelUp: clear context-dependent entries
}
```

### 2. 토큰 사용량 최적화

```typescript
interface TokenOptimization {
  // Request Optimization
  maxTokens: 150           // Response limit
  temperature: 0.7         // Balance creativity/consistency
  
  // Context Compression
  recentTopics: limit to 5 items
  moodHistory: limit to 10 items
  systemPrompt: abbreviated format
  
  // Smart Truncation
  conversationHistory: keep last 3-5 exchanges
  contextPriority: personality > emotion > topics
}
```

### 3. Circuit Breaker 패턴

```typescript
interface CircuitBreakerConfig {
  failureThreshold: 5      // Failures before opening
  recoveryTimeout: 30000   // 30s before retry attempt
  monitoringPeriod: 60000  // 1m evaluation window
  
  states: {
    CLOSED: normal operation
    OPEN: all requests failed immediately  
    HALF_OPEN: single test request allowed
  }
}
```

---

## 🛡️ 안정성 및 보안

### 1. Fallback 시스템

```typescript
interface FallbackStrategy {
  // Provider Hierarchy
  primary: ClaudeProvider    // API-based responses
  fallback: MockProvider     // Template-based responses
  
  // Trigger Conditions  
  apiKeyMissing: → MockProvider
  networkError: → MockProvider  
  rateLimitExceeded: → MockProvider
  circuitBreakerOpen: → MockProvider
  
  // Recovery Logic
  healthCheckInterval: 60s
  automaticRecovery: true
  failbackNotification: user-visible warning
}
```

### 2. 보안 관리

```typescript
interface SecurityMeasures {
  // API Key Protection
  envVariableOnly: true
  noHardcoding: enforced by pre-commit hooks
  keyRotation: manual process with validation
  
  // Request Validation
  inputSanitization: XSS prevention
  rateLimiting: client-side throttling
  contentFiltering: inappropriate content blocking
  
  // Data Privacy
  noDataPersistence: API calls only
  contextMinimization: essential data only
  errorLogSanitization: no sensitive info in logs
}
```

### 3. 오류 처리

```typescript
interface ErrorHandling {
  // Error Categories
  NETWORK_ERROR: retry with backoff
  INVALID_API_KEY: immediate fallback
  RATE_LIMIT_EXCEEDED: circuit breaker activation
  SERVER_ERROR: retry then fallback
  
  // User Experience
  transparentFallback: seamless transition
  statusNotification: temporary error messages
  recoveryIndicator: when service restored
  
  // Logging Strategy
  errorClassification: structured error types
  contextPreservation: debugging information
  userPrivacy: no message content in logs
}
```

---

## 📊 모니터링 및 분석

### 1. 핵심 메트릭

```typescript
interface AIMetrics {
  // Usage Statistics
  totalRequests: number
  totalTokens: number
  totalCost: number
  
  // Performance Metrics
  averageResponseTime: milliseconds
  cacheHitRate: percentage
  errorRate: percentage
  
  // Provider Distribution
  claudeRequests: number
  mockFallbacks: number
  
  // Quality Indicators  
  averageConfidence: number
  emotionAccuracy: percentage
  userSatisfaction: rating
}
```

### 2. 로깅 전략

```typescript
interface LoggingStrategy {
  // Development Logging
  providerSelection: detailed decision process
  contextBuilding: parameter values and logic
  apiCalls: request/response structure (sanitized)
  
  // Production Logging  
  errorEvents: classification and frequency
  performanceMetrics: response times and usage
  serviceHealth: provider availability status
  
  // Privacy Compliance
  noMessageContent: user privacy protection
  structuredLogs: machine-readable format
  retentionPolicy: automatic cleanup
}
```

---

## 🚀 확장성 설계

### 1. 새로운 AI Provider 추가

```typescript
interface ProviderExtensibility {
  // Interface Compliance
  implements: AIProvider interface
  priority: numeric ranking system
  capabilities: feature flag system
  
  // Integration Points
  registration: AIManager.providers.set()
  healthChecks: provider.isHealthy()
  failover: automatic provider selection
  
  // Examples
  GPTProvider: OpenAI GPT integration
  GeminiProvider: Google Gemini integration  
  LocalProvider: local model inference
}
```

### 2. 고급 기능 확장

```typescript
interface AdvancedFeatures {
  // Conversation Memory
  longTermMemory: persistent conversation history
  personalityLearning: adaptive trait adjustment
  relationshipEvolution: dynamic emotional bonding
  
  // Multi-modal Support
  voiceInput: speech-to-text integration
  emotionRecognition: facial expression analysis
  imageGeneration: visual companion avatars
  
  // Social Features
  multiUserChats: group conversation support
  companionSharing: community-created personalities
  conversationExport: chat history download
}
```

---

## 🔧 개발자 가이드

### 1. 환경 설정

```bash
# Environment Variables (.env.local)
VITE_CLAUDE_API_KEY=sk-ant-api03-...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...

# Development Commands
npm run dev          # Start development server
npm run build        # Production build
npm run type-check   # TypeScript validation
```

### 2. 디버깅 가이드

```typescript
// Console Logging
console.log('🤖 Sending request to AI service...')
console.log('✅ AI Response received from ${provider}')
console.log('🏥 AI Manager Health Status:', healthStatus)

// Error Monitoring
try {
  const response = await aiManager.generateResponse(request)
} catch (error) {
  console.error('❌ AI service error:', error)
}

// Performance Tracking
const startTime = performance.now()
// ... operation ...
const duration = performance.now() - startTime
```

### 3. 테스트 전략

```typescript
interface TestingApproach {
  // Unit Tests
  providerLogic: response processing accuracy
  contextBuilding: parameter generation correctness  
  errorHandling: fallback behavior validation
  
  // Integration Tests
  apiConnectivity: Claude API communication
  fallbackChain: provider switching logic
  stateManagement: conversation history integrity
  
  // E2E Tests
  userConversation: complete chat flow
  errorRecovery: service interruption handling
  performanceLoad: concurrent user simulation
}
```

---

## 📈 성능 벤치마크

### 1. 응답 시간 목표

```typescript
interface PerformanceTargets {
  // Response Time (95th percentile)
  claudeAPI: '<2000ms'
  mockFallback: '<100ms'  
  cacheHit: '<50ms'
  
  // Throughput
  concurrentUsers: 100
  requestsPerSecond: 10
  
  // Resource Usage
  memoryUsage: '<50MB'
  tokenEfficiency: '>80% relevant content'
}
```

### 2. 비용 최적화

```typescript
interface CostOptimization {
  // Token Economics
  averageTokensPerMessage: 45 (input) + 60 (output)
  costPerConversation: ~$0.025
  dailyBudget: $5.00 (200 conversations)
  
  // Efficiency Measures
  cacheHitRate: '>30%' (cost reduction)
  contextCompression: '>20%' (token savings)
  fallbackRate: '<10%' (service reliability)
}
```

---

## 🔮 미래 로드맵

### Phase 1: 핵심 기능 (완료)
- ✅ Claude API 통합
- ✅ 실시간 채팅 시스템  
- ✅ 컨텍스트 기반 응답
- ✅ Fallback 시스템

### Phase 2: 고도화 (계획)
- 🔄 대화 기억 시스템
- 🔄 감정 분석 정확도 개선
- 🔄 성격 학습 알고리즘  
- 🔄 다국어 지원

### Phase 3: 확장 (미래)
- 🚀 음성 채팅 지원
- 🚀 이미지 생성 통합
- 🚀 멀티모달 상호작용
- 🚀 소셜 기능 확장

---

*본 설계 명세서는 Claude API를 활용한 AI 채팅 시스템의 기술적 구현과 운영 가이드라인을 제공합니다. 지속적인 업데이트와 개선을 통해 최적의 사용자 경험을 달성할 수 있습니다.*

**문서 버전**: v1.0  
**최종 수정**: 2025-08-10  
**작성자**: Claude Code AI Assistant