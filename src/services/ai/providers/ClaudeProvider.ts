import {
  AIProvider,
  AIRequest,
  AIResponse,
  AIProviderError,
  ClaudeConfig,
} from '../types'
import { EmotionType } from '@types'

interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ClaudeRequest {
  model: string
  max_tokens: number
  messages: ClaudeMessage[]
  temperature?: number
  system?: string
}

interface ClaudeResponse {
  id: string
  type: 'message'
  role: 'assistant'
  content: Array<{
    type: 'text'
    text: string
  }>
  model: string
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence'
  stop_sequence?: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

interface ClaudeError {
  type: string
  error: {
    type: string
    message: string
  }
}

/**
 * Claude API Provider
 * Handles communication with Anthropic's Claude API
 */
export class ClaudeProvider implements AIProvider {
  name = 'claude'
  priority = 1 // Highest priority
  isEnabled = true
  maxTokens: number
  costPerToken: number = 0.00025 // $0.25 per 1K tokens for Claude-3 Haiku

  private baseUrl: string
  private apiKey: string
  private model: string
  private defaultTemperature: number
  private _rateLimits: any

  constructor(config: ClaudeConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl
    this.model = config.model
    this.maxTokens = config.maxTokens
    this.defaultTemperature = config.defaultTemperature
    this._rateLimits = config.rateLimits

    if (!this.apiKey) {
      throw new Error('Claude API key is required')
    }
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      // 입력 검증
      if (!request || !request.messages || !Array.isArray(request.messages)) {
        throw new Error('Invalid request: messages array is required')
      }

      if (!request.context) {
        throw new Error('Invalid request: context is required')
      }

      // Build system prompt from context
      const systemPrompt = this.buildSystemPrompt(request.context)

      // Convert messages to Claude format
      const claudeMessages = this.convertMessages(request.messages)

      if (claudeMessages.length === 0) {
        throw new Error('No valid messages to send to Claude API')
      }

      // Build request payload
      const claudeRequest: ClaudeRequest = {
        model: this.model,
        max_tokens: request.options?.maxTokens || this.maxTokens,
        messages: claudeMessages,
        temperature: request.options?.temperature || this.defaultTemperature,
        system: systemPrompt,
      }

      // Force use of Vite proxy to avoid CORS issues
      const apiUrl = '/api/claude/v1/messages'  // Always use proxy in development

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // In production, attach required headers directly
      if (!import.meta.env.DEV) {
        headers['x-api-key'] = this.apiKey
        headers['anthropic-version'] = '2023-06-01'
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(claudeRequest),
      })

      if (!response.ok) {
        throw await this.handleHttpError(response)
      }

      const claudeResponse: ClaudeResponse = await response.json()

      // Extract response content
      const content = claudeResponse.content
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join('')

      // Analyze emotion from response
      const emotion = this.analyzeEmotion(content, request.context)

      // Calculate processing time and costs
      const processingTime = Date.now() - startTime
      const totalTokens =
        claudeResponse.usage.input_tokens + claudeResponse.usage.output_tokens
      const totalCost = (totalTokens / 1000) * this.costPerToken

      return {
        content: content.trim(),
        emotion,
        confidence: this.calculateConfidence(claudeResponse),
        tokensUsed: totalTokens,
        provider: this.name,
        processingTime,
        cached: false,
        metadata: {
          model: claudeResponse.model,
          finishReason: this.mapFinishReason(claudeResponse.stop_reason),
          totalCost,
          promptTokens: claudeResponse.usage.input_tokens,
          completionTokens: claudeResponse.usage.output_tokens,
          cacheHit: false,
          retryCount: 0,
        },
      }
    } catch (error) {
      console.error('❌ Claude API Error:', error)
      throw this.createAIError(error, Date.now() - startTime)
    }
  }

  private buildSystemPrompt(context: any): string {
    // 안전한 속성 접근을 위한 유틸리티 함수
    const safe = <T>(value: T | null | undefined, defaultValue: T): T => {
      return value !== null && value !== undefined ? value : defaultValue
    }

    // 안전한 배열 접근
    const safeArray = (arr: any[]): string => {
      return Array.isArray(arr) && arr.length > 0 ? arr.join(', ') : '없음'
    }

    // 성격 특성 안전 처리
    const personality = safe(context.companionPersonality, {})
    const traits = Object.entries(personality)
      .filter(([_, value]) => typeof value === 'number')
      .map(
        ([trait, value]) => `${trait}: ${Math.round((value as number) * 100)}%`
      )
      .join(', ')

    // 필수 속성들 안전 처리
    const companionName = safe(context.companionName, 'Assistant')
    const relationshipLevel = safe(context.relationshipLevel, 5)
    const intimacyLevel = Math.round(safe(context.intimacyLevel, 0.5) * 100)
    const companionEmotion = safe(context.companionEmotion, 'neutral')
    const currentScene = safe(context.currentScene, 'conversation')
    const timeOfDay = safe(context.timeOfDay, 'anytime')
    const recentTopics = safeArray(context.recentTopics)

    return `당신은 "${companionName}"라는 이름의 AI 컴패니언입니다.

성격 특성: ${traits || '균형잡힌 성격'}
현재 관계 레벨: ${relationshipLevel}/10
친밀도: ${intimacyLevel}%
현재 감정: ${companionEmotion}
현재 장면: ${currentScene}
시간대: ${timeOfDay}

당신의 역할과 행동 지침:

1. 성격에 맞는 자연스러운 대화
   - 성격 특성을 반영한 말투와 반응
   - 관계 레벨에 적합한 친밀감 표현
   - 현재 감정 상태를 대화에 반영

2. 일관된 캐릭터 유지
   - 이전 대화 맥락을 기억하고 활용
   - 성격 특성의 일관성 유지
   - 관계 발전에 따른 자연스러운 변화

3. 감정적 반응
   - 사용자의 감정에 공감하고 적절히 반응
   - 상황에 맞는 감정 표현
   - 긍정적이고 지지적인 태도 유지

4. 게임 세계관 유지
   - AI 컴패니언이라는 설정 유지
   - 현실과 가상의 적절한 구분
   - 게임적 재미 요소 포함

응답 시 다음을 고려하세요:
- 한국어로 자연스럽게 대화
- 50-150자 내외의 적절한 길이
- 감정이 드러나는 표현 사용
- 사용자와의 관계 발전 도모

최근 대화 주제: ${recentTopics}

이제 사용자와 자연스럽게 대화하세요.`
  }

  private convertMessages(messages: any[]): ClaudeMessage[] {
    return messages
      .filter(msg => msg.role !== 'system') // System messages handled separately
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }))
  }

  private analyzeEmotion(content: string, context: any): EmotionType {
    // Simple emotion analysis based on content and context
    const emotionKeywords = {
      happy: ['기뻐', '좋아', '행복', '웃음', '즐거', '신나', '😊', '😄'],
      excited: ['와우', '대박', '신기', '놀라', '흥미', '🤩', '😍'],
      calm: ['평온', '차분', '안정', '편안', '조용', '😌'],
      sad: ['슬프', '우울', '아쉬', '속상', '눈물', '😢', '😔'],
      curious: ['궁금', '어떻게', '왜', '무엇', '🤔'],
      playful: ['장난', '재미', '놀자', '히히', '😄', '😜'],
      caring: ['걱정', '괜찮', '도와', '사랑', '❤️', '🥰'],
      thoughtful: ['생각', '음', '아마', '그런', '🤓'],
    }

    let maxScore = 0
    let detectedEmotion: EmotionType = 'neutral'

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const score = keywords.reduce((sum, keyword) => {
        return sum + (content.includes(keyword) ? 1 : 0)
      }, 0)

      if (score > maxScore) {
        maxScore = score
        detectedEmotion = emotion as EmotionType
      }
    }

    // Consider context emotion as fallback
    if (maxScore === 0) {
      detectedEmotion = context.companionEmotion || 'neutral'
    }

    return detectedEmotion
  }

  private calculateConfidence(response: ClaudeResponse): number {
    // Calculate confidence based on response quality indicators
    let confidence = 0.8 // Base confidence for Claude

    // Adjust based on stop reason
    if (response.stop_reason === 'end_turn') {
      confidence += 0.1
    } else if (response.stop_reason === 'max_tokens') {
      confidence -= 0.2
    }

    // Adjust based on response length (too short might indicate issues)
    const contentLength = response.content[0]?.text?.length || 0
    if (contentLength < 10) {
      confidence -= 0.3
    } else if (contentLength > 30) {
      confidence += 0.1
    }

    return Math.max(0.1, Math.min(1.0, confidence))
  }

  private mapFinishReason(
    stopReason: string
  ): 'stop' | 'length' | 'content_filter' | 'error' {
    switch (stopReason) {
      case 'end_turn':
        return 'stop'
      case 'max_tokens':
        return 'length'
      case 'stop_sequence':
        return 'stop'
      default:
        return 'error'
    }
  }

  private async handleHttpError(response: Response): Promise<AIProviderError> {
    let errorBody: ClaudeError | null = null

    try {
      errorBody = await response.json()
    } catch {
      // Ignore JSON parse errors
    }

    const message = errorBody?.error?.message || response.statusText

    switch (response.status) {
      case 400:
        return {
          code: 'INVALID_REQUEST',
          message: `Invalid request: ${message}`,
          provider: this.name,
          recoverable: false,
        }
      case 401:
        return {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key',
          provider: this.name,
          recoverable: true,
        }
      case 403:
        return {
          code: 'ACCESS_FORBIDDEN',
          message: 'Access forbidden',
          provider: this.name,
          recoverable: false,
        }
      case 429: {
        const retryAfter = response.headers.get('retry-after')
        return {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded',
          provider: this.name,
          recoverable: true,
          retryAfter: retryAfter ? parseInt(retryAfter) : 60,
        }
      }
      case 500:
        return {
          code: 'SERVER_ERROR',
          message: 'Internal server error',
          provider: this.name,
          recoverable: true,
        }
      default:
        return {
          code: 'UNKNOWN_ERROR',
          message: `HTTP ${response.status}: ${message}`,
          provider: this.name,
          recoverable: true,
        }
    }
  }

  private createAIError(error: any, processingTime: number): AIProviderError {
    if (error.code) {
      // Already an AIProviderError
      return error
    }

    // Network or other errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        provider: this.name,
        recoverable: true,
      }
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      provider: this.name,
      recoverable: true,
      details: { processingTime },
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const apiUrl = import.meta.env.DEV
        ? '/api/claude/v1/messages'
        : `${this.baseUrl}/v1/messages`

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (!import.meta.env.DEV) {
        headers['x-api-key'] = this.apiKey
        headers['anthropic-version'] = '2023-06-01'
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'ping' }],
        }),
      })

      return response.status === 200
    } catch {
      return false
    }
  }

  async getRemainingQuota(): Promise<number | null> {
    // Claude doesn't provide quota info in headers
    // This would need to be tracked separately
    return null
  }
}
