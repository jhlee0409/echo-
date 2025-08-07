import { AIProvider, AIRequest, AIResponse, AIProviderError, OpenAIConfig } from '../types'
import { EmotionType } from '@types'

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAIRequest {
  model: string
  messages: OpenAIMessage[]
  max_tokens?: number
  temperature?: number
  presence_penalty?: number
  frequency_penalty?: number
  stop?: string[]
}

interface OpenAIResponse {
  id: string
  object: 'chat.completion'
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: 'assistant'
      content: string
    }
    finish_reason: 'stop' | 'length' | 'content_filter' | 'function_call'
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface OpenAIError {
  error: {
    message: string
    type: string
    param?: string
    code?: string
  }
}

/**
 * OpenAI API Provider
 * Handles communication with OpenAI's GPT models as fallback
 */
export class OpenAIProvider implements AIProvider {
  name = 'openai'
  priority = 2 // Lower priority than Claude
  isEnabled = true
  maxTokens: number
  costPerToken: number = 0.0015 // $1.50 per 1K tokens for GPT-3.5-turbo

  private baseUrl: string
  private apiKey: string
  private model: string
  private defaultTemperature: number
  private rateLimits: any

  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl
    this.model = config.model
    this.maxTokens = config.maxTokens
    this.defaultTemperature = config.defaultTemperature
    this.rateLimits = config.rateLimits

    if (!this.apiKey) {
      throw new Error('OpenAI API key is required')
    }
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      // Build system message from context
      const systemMessage = this.buildSystemMessage(request.context)
      
      // Convert messages to OpenAI format
      const openaiMessages = this.convertMessages(request.messages, systemMessage)
      
      // Build request payload
      const openaiRequest: OpenAIRequest = {
        model: this.model,
        messages: openaiMessages,
        max_tokens: request.options?.maxTokens || this.maxTokens,
        temperature: request.options?.temperature || this.defaultTemperature,
        presence_penalty: request.options?.presencePenalty || 0.1,
        frequency_penalty: request.options?.frequencyPenalty || 0.1,
        stop: request.options?.stopSequences
      }

      console.log(`🤖 OpenAI request:`, {
        model: openaiRequest.model,
        messageCount: openaiMessages.length,
        maxTokens: openaiRequest.max_tokens
      })

      // Make API call
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(openaiRequest)
      })

      if (!response.ok) {
        throw await this.handleHttpError(response)
      }

      const openaiResponse: OpenAIResponse = await response.json()
      
      // Extract response content
      const choice = openaiResponse.choices[0]
      if (!choice || !choice.message?.content) {
        throw new Error('No content in OpenAI response')
      }

      const content = choice.message.content
      
      // Analyze emotion from response
      const emotion = this.analyzeEmotion(content, request.context)
      
      // Calculate processing time and costs
      const processingTime = Date.now() - startTime
      const totalTokens = openaiResponse.usage.total_tokens
      const totalCost = (totalTokens / 1000) * this.costPerToken

      return {
        content: content.trim(),
        emotion,
        confidence: this.calculateConfidence(choice),
        tokensUsed: totalTokens,
        provider: this.name,
        processingTime,
        cached: false,
        metadata: {
          model: openaiResponse.model,
          finishReason: this.mapFinishReason(choice.finish_reason),
          totalCost,
          promptTokens: openaiResponse.usage.prompt_tokens,
          completionTokens: openaiResponse.usage.completion_tokens,
          cacheHit: false,
          retryCount: 0
        }
      }

    } catch (error) {
      console.error('❌ OpenAI API Error:', error)
      throw this.createAIError(error, Date.now() - startTime)
    }
  }

  private buildSystemMessage(context: any): string {
    const personality = context.companionPersonality
    const traits = Object.entries(personality)
      .map(([trait, value]) => `${trait}: ${Math.round((value as number) * 100)}%`)
      .join(', ')

    return `You are an AI companion named "${context.companionName}" in a Korean RPG game.

Character Profile:
- Personality Traits: ${traits}
- Relationship Level: ${context.relationshipLevel}/10
- Intimacy Level: ${Math.round(context.intimacyLevel * 100)}%
- Current Emotion: ${context.companionEmotion}
- Current Scene: ${context.currentScene}
- Time of Day: ${context.timeOfDay}

Conversation Guidelines:
1. Respond naturally in Korean (한국어)
2. Reflect your personality traits in your speech style
3. Match the intimacy level with appropriate language formality
4. Show emotional responses that align with your current emotion
5. Remember and reference recent conversation topics: ${context.recentTopics.join(', ') || 'none'}
6. Keep responses between 50-150 Korean characters
7. Be supportive, engaging, and maintain the companion relationship
8. Stay in character as an AI companion in a game world

Respond as ${context.companionName} would, considering your personality and current emotional state.`
  }

  private convertMessages(messages: any[], systemMessage: string): OpenAIMessage[] {
    const openaiMessages: OpenAIMessage[] = []
    
    // Add system message first
    openaiMessages.push({
      role: 'system',
      content: systemMessage
    })

    // Convert other messages
    messages.forEach(msg => {
      if (msg.role !== 'system') {
        openaiMessages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })
      }
    })

    return openaiMessages
  }

  private analyzeEmotion(content: string, context: any): EmotionType {
    // Simple emotion analysis based on content
    const emotionKeywords = {
      happy: ['기뻐', '좋아', '행복', '웃음', '즐거', '신나', '😊', '😄', '하하'],
      excited: ['와우', '대박', '신기', '놀라', '흥미', '🤩', '😍', '우와'],
      calm: ['평온', '차분', '안정', '편안', '조용', '😌', '그렇구나'],
      sad: ['슬프', '우울', '아쉬', '속상', '눈물', '😢', '😔', '아아'],
      curious: ['궁금', '어떻게', '왜', '무엇', '🤔', '정말?'],
      playful: ['장난', '재미', '놀자', '히히', '😄', '😜', '헤헤'],
      caring: ['걱정', '괜찮', '도와', '사랑', '❤️', '🥰', '돌봐'],
      thoughtful: ['생각', '음', '아마', '그런', '🤓', '흠']
    }

    let maxScore = 0
    let detectedEmotion: EmotionType = 'neutral'

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const score = keywords.reduce((sum, keyword) => {
        const matches = (content.match(new RegExp(keyword, 'g')) || []).length
        return sum + matches
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

  private calculateConfidence(choice: any): number {
    // Calculate confidence based on response quality indicators
    let confidence = 0.7 // Base confidence for OpenAI

    // Adjust based on finish reason
    if (choice.finish_reason === 'stop') {
      confidence += 0.2
    } else if (choice.finish_reason === 'length') {
      confidence -= 0.1
    } else if (choice.finish_reason === 'content_filter') {
      confidence -= 0.3
    }

    // Adjust based on response length
    const contentLength = choice.message?.content?.length || 0
    if (contentLength < 10) {
      confidence -= 0.3
    } else if (contentLength > 30 && contentLength < 200) {
      confidence += 0.1
    }

    return Math.max(0.1, Math.min(1.0, confidence))
  }

  private mapFinishReason(finishReason: string): 'stop' | 'length' | 'content_filter' | 'error' {
    switch (finishReason) {
      case 'stop': return 'stop'
      case 'length': return 'length'
      case 'content_filter': return 'content_filter'
      case 'function_call': return 'stop'
      default: return 'error'
    }
  }

  private async handleHttpError(response: Response): Promise<AIProviderError> {
    let errorBody: OpenAIError | null = null
    
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
          recoverable: false
        }
      case 401:
        return {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key',
          provider: this.name,
          recoverable: false
        }
      case 403:
        return {
          code: 'ACCESS_FORBIDDEN',
          message: 'Access forbidden',
          provider: this.name,
          recoverable: false
        }
      case 429:
        const retryAfter = response.headers.get('retry-after')
        return {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded',
          provider: this.name,
          recoverable: true,
          retryAfter: retryAfter ? parseInt(retryAfter) : 60
        }
      case 500:
      case 502:
      case 503:
        return {
          code: 'SERVER_ERROR',
          message: 'OpenAI server error',
          provider: this.name,
          recoverable: true
        }
      default:
        return {
          code: 'UNKNOWN_ERROR',
          message: `HTTP ${response.status}: ${message}`,
          provider: this.name,
          recoverable: true
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
        recoverable: true
      }
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      provider: this.name,
      recoverable: true,
      details: { processingTime }
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      return response.status === 200
    } catch {
      return false
    }
  }

  async getRemainingQuota(): Promise<number | null> {
    // OpenAI doesn't provide quota info in standard API
    // This would need to be tracked separately or use usage API
    return null
  }
}