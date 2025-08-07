/**
 * AI API 타입 정의
 * execution-plan.md 기반 TypeScript 타입 시스템
 */

export interface ChatRequest {
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
    companionEmotion: EmotionType;
    currentScene: string;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    recentTopics: string[];
    recentMemories: Array<{
      content: string;
      importance: number;
      timestamp: number;
    }>;
    conversationTone: 'casual' | 'formal' | 'intimate' | 'playful';
    userEmotionalState: EmotionType;
  };
  options?: {
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
    enableCache?: boolean;
  };
}

export interface ChatResponse {
  content: string;
  emotion: EmotionType;
  confidence: number;        // 0-1
  tokensUsed: number;
  provider: 'claude' | 'openai' | 'mock';
  processingTime: number;    // milliseconds
  cached: boolean;
  metadata: {
    model: string;
    finishReason: 'stop' | 'length' | 'content_filter' | 'error';
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

export type EmotionType = 
  | 'happy' 
  | 'sad' 
  | 'excited' 
  | 'calm' 
  | 'curious' 
  | 'playful' 
  | 'caring' 
  | 'thoughtful' 
  | 'neutral'
  | 'surprised'
  | 'confused' 
  | 'angry';

export interface HealthResponse {
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

export interface UsageResponse {
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