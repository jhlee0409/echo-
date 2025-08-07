import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAIManager } from '../../services/ai/AIManager';
import { validateAuthToken } from '../../services/auth/SecurityValidator';
import type { ChatRequest, ChatResponse } from './types';

/**
 * AI Chat API - execution-plan.md에서 정의한 Claude API 연동 패턴
 * 
 * execution-plan.md 기반 구현:
 * ```javascript
 * const generateAIResponse = async (userInput, context) => {
 *   const prompt = `
 *     You are an AI companion named ${context.name}.
 *     Personality: ${JSON.stringify(context.personality)}
 *     Relationship level: ${context.relationshipLevel}
 *     
 *     Respond naturally based on your personality and relationship level.
 *   `;
 *   
 *   const response = await claude.complete(prompt);
 *   return response;
 * };
 * ```
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
        timestamp: Date.now(),
        requestId: generateRequestId()
      }
    });
  }

  try {
    // 1. 인증 검증
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
          timestamp: Date.now(),
          requestId: generateRequestId()
        }
      });
    }

    const token = authHeader.substring(7);
    const authResult = await validateAuthToken(token);
    
    if (!authResult.valid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: authResult.error || 'Invalid authentication token',
          timestamp: Date.now(),
          requestId: generateRequestId()
        }
      });
    }

    // 2. 요청 데이터 검증
    const chatRequest: ChatRequest = req.body;
    const validationResult = validateChatRequest(chatRequest);
    
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validationResult.error,
          details: validationResult.details,
          timestamp: Date.now(),
          requestId: generateRequestId()
        }
      });
    }

    // 3. 속도 제한 확인
    if (!authResult.userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token does not contain valid user ID',
          timestamp: Date.now(),
          requestId: generateRequestId()
        }
      });
    }

    const rateLimitResult = await checkRateLimit(authResult.userId);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          timestamp: Date.now(),
          requestId: generateRequestId()
        }
      });
    }

    // 4. AI Manager를 통한 응답 생성 (execution-plan.md 패턴 활용)
    const aiManager = getAIManager();
    const startTime = Date.now();

    try {
      const aiResponse = await aiManager.generateResponse({
        messages: chatRequest.messages,
        context: chatRequest.context,
        options: chatRequest.options
      });

      // 5. 관계도 업데이트 계산
      const relationshipChange = calculateRelationshipChange(
        chatRequest.context,
        chatRequest.messages[chatRequest.messages.length - 1].content,
        aiResponse.content
      );

      // 6. 응답 구성
      const response: ChatResponse = {
        content: aiResponse.content,
        emotion: aiResponse.emotion,
        confidence: aiResponse.confidence,
        tokensUsed: aiResponse.tokensUsed,
        provider: aiResponse.provider,
        processingTime: Date.now() - startTime,
        cached: aiResponse.cached,
        metadata: {
          model: aiResponse.metadata?.model || 'unknown',
          finishReason: aiResponse.metadata?.finishReason || 'stop',
          totalCost: aiResponse.metadata?.totalCost || 0,
          promptTokens: aiResponse.metadata?.promptTokens || 0,
          completionTokens: aiResponse.metadata?.completionTokens || 0,
          cacheHit: aiResponse.cached,
          retryCount: aiResponse.metadata?.retryCount || 0
        },
        relationshipChange: relationshipChange.hasChanged ? {
          previousLevel: relationshipChange.previousLevel,
          newLevel: relationshipChange.newLevel,
          intimacyChange: relationshipChange.intimacyChange
        } : undefined
      };

      // 7. 사용량 업데이트
      await updateUsageStats(authResult.userId!, {
        requests: 1,
        tokens: aiResponse.tokensUsed,
        cost: aiResponse.metadata?.totalCost || 0
      });

      // 8. 속도 제한 헤더 설정
      res.setHeader('X-RateLimit-Limit', rateLimitResult.limit);
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
      res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime);

      return res.status(200).json(response);

    } catch (aiError: any) {
      console.error('AI Response Error:', aiError);
      
      return res.status(500).json({
        success: false,
        error: {
          code: 'AI_PROVIDER_ERROR',
          message: 'Failed to generate AI response',
          details: process.env.NODE_ENV === 'development' ? aiError.message : undefined,
          timestamp: Date.now(),
          requestId: generateRequestId()
        }
      });
    }

  } catch (error: any) {
    console.error('Chat API Error:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        timestamp: Date.now(),
        requestId: generateRequestId()
      }
    });
  }
}

/**
 * 채팅 요청 검증
 */
function validateChatRequest(request: any): { valid: boolean; error?: string; details?: any } {
  if (!request) {
    return { valid: false, error: 'Request body is required' };
  }

  if (!request.messages || !Array.isArray(request.messages)) {
    return { valid: false, error: 'Messages array is required' };
  }

  if (request.messages.length === 0) {
    return { valid: false, error: 'At least one message is required' };
  }

  // 메시지 형식 검증
  for (const message of request.messages) {
    if (!message.role || !['user', 'assistant'].includes(message.role)) {
      return { valid: false, error: 'Invalid message role' };
    }
    if (!message.content || typeof message.content !== 'string') {
      return { valid: false, error: 'Message content is required' };
    }
    if (message.content.length > 2000) {
      return { valid: false, error: 'Message content too long (max 2000 characters)' };
    }
  }

  // 컨텍스트 검증
  if (!request.context) {
    return { valid: false, error: 'Context is required' };
  }

  const context = request.context;
  if (!context.companionName || typeof context.companionName !== 'string') {
    return { valid: false, error: 'Companion name is required' };
  }

  if (!context.companionPersonality || typeof context.companionPersonality !== 'object') {
    return { valid: false, error: 'Companion personality is required' };
  }

  // 성격 특성 검증
  const requiredTraits = ['cheerful', 'careful', 'curious', 'emotional', 'independent', 'playful', 'supportive'];
  for (const trait of requiredTraits) {
    const value = context.companionPersonality[trait];
    if (typeof value !== 'number' || value < 0 || value > 1) {
      return { valid: false, error: `Invalid personality trait: ${trait}` };
    }
  }

  return { valid: true };
}

/**
 * 속도 제한 확인
 */
async function checkRateLimit(userId: string): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}> {
  // 실제 구현에서는 Redis 또는 메모리 캐시 사용
  // 지금은 간단한 메모리 기반 구현
  return {
    allowed: true,
    limit: 100,
    remaining: 95,
    resetTime: Math.floor(Date.now() / 1000) + 3600
  };
}

/**
 * 관계도 변화 계산
 */
function calculateRelationshipChange(
  context: any,
  userMessage: string,
  aiResponse: string
): {
  hasChanged: boolean;
  previousLevel: number;
  newLevel: number;
  intimacyChange: number;
} {
  const currentLevel = context.relationshipLevel;
  const currentIntimacy = context.intimacyLevel;
  
  // 간단한 관계도 변화 로직
  let levelChange = 0;
  let intimacyChange = 0;
  
  // 긍정적 상호작용 감지
  if (userMessage.includes('고마워') || userMessage.includes('좋아') || userMessage.includes('사랑')) {
    levelChange += 0.1;
    intimacyChange += 0.05;
  }
  
  // 질문이나 호기심 표현
  if (userMessage.includes('?') || userMessage.includes('궁금')) {
    levelChange += 0.05;
  }
  
  const newLevel = Math.min(10, Math.max(1, currentLevel + levelChange));
  const newIntimacy = Math.min(1, Math.max(0, currentIntimacy + intimacyChange));
  
  return {
    hasChanged: levelChange !== 0 || intimacyChange !== 0,
    previousLevel: currentLevel,
    newLevel: newLevel,
    intimacyChange: newIntimacy - currentIntimacy
  };
}

/**
 * 사용량 통계 업데이트
 */
async function updateUsageStats(userId: string, usage: {
  requests: number;
  tokens: number;
  cost: number;
}): Promise<void> {
  // 실제 구현에서는 데이터베이스에 저장
  console.log(`Usage updated for user ${userId}:`, usage);
}

/**
 * 요청 ID 생성
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}