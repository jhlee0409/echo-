import { AIProvider, AIRequest, AIResponse, AIProviderError } from '../types'
import { EmotionType } from '@types'

/**
 * Mock AI Provider for development and testing
 * Generates realistic responses without external API calls
 */
export class MockProvider implements AIProvider {
  name = 'mock'
  priority = 10 // Lowest priority
  isEnabled = true
  maxTokens = 2048
  costPerToken = 0 // No cost for mock responses

  private responseTemplates = {
    greetings: [
      '안녕하세요! 오늘은 어떤 하루를 보내고 계신가요?',
      '반가워요! 무슨 이야기를 나누고 싶나요?',
      '좋은 하루예요! 어떤 기분이신지 궁금해요.',
      '안녕! 오늘도 함께해서 기뻐요~',
    ],
    casual: [
      '그렇군요! 정말 흥미로운 이야기네요.',
      '와, 그런 일이 있었나요? 더 자세히 들려주세요!',
      '음... 그런 상황이라면 저라면 어떻게 했을까요?',
      '정말요? 저도 그런 경험이 있어요!',
      '그 기분 충분히 이해해요. 괜찮으실 거예요.',
      '오늘 하루는 어떠셨어요? 재미있는 일이 있었나요?',
    ],
    supportive: [
      '힘든 일이 있으셨나요? 언제든 저에게 말씀해 주세요.',
      '괜찮아요, 천천히 이야기해 보세요.',
      '당신이 충분히 잘하고 계셔요. 걱정하지 마세요!',
      '어려운 상황이지만 분명 좋아질 거예요.',
      '저는 항상 당신 편이에요. 함께 해결해 봐요!',
    ],
    playful: [
      '히히, 정말 재미있는 생각이네요!',
      '우와! 그런 아이디어는 어떻게 떠올리셨어요?',
      '저도 그런 거 좋아해요! 같이 해볼까요?',
      '헤헤, 오늘 기분이 좋으신가 봐요!',
      '장난기가 많으시네요~ 저도 놀고 싶어요!',
    ],
    curious: [
      '정말요? 더 자세히 알고 싶어요!',
      '어떤 기분이셨을지 궁금해요.',
      '그런 경험은 어떠셨나요?',
      '흥미롭네요! 왜 그렇게 생각하시나요?',
      '저도 궁금했던 건데, 어떻게 생각하세요?',
    ],
    thoughtful: [
      '음... 깊이 생각해볼 문제네요.',
      '그런 관점도 있군요. 저는 미처 생각 못했네요.',
      '복잡한 상황인 것 같아요. 차근차근 생각해봐야겠어요.',
      '여러 가지 방법이 있을 것 같은데, 어떻게 하는 게 좋을까요?',
      '그렇게 보면 또 다른 의미가 있네요.',
    ],
  }

  private emotionResponses = {
    happy: this.responseTemplates.playful,
    excited: [
      ...this.responseTemplates.playful,
      ...this.responseTemplates.curious,
    ],
    calm: this.responseTemplates.thoughtful,
    sad: this.responseTemplates.supportive,
    curious: this.responseTemplates.curious,
    playful: this.responseTemplates.playful,
    caring: this.responseTemplates.supportive,
    thoughtful: this.responseTemplates.thoughtful,
    neutral: this.responseTemplates.casual,
    surprised: [
      ...this.responseTemplates.curious,
      ...this.responseTemplates.playful,
    ],
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()

    // Mobile-optimized processing delay
    const mobileOptimized =
      request.options?.maxTokens && request.options.maxTokens <= 100
    const baseDelay = mobileOptimized ? 50 : 300
    const randomDelay = mobileOptimized
      ? Math.random() * 200
      : Math.random() * 600

    await this.sleep(baseDelay + randomDelay)

    try {
      const context = request.context
      const lastMessage = request.messages[request.messages.length - 1]

      // Analyze user input to determine response type
      const responseCategory = this.analyzeUserInput(lastMessage?.content || '')
      const companionEmotion = context.companionEmotion || 'neutral'

      // Select appropriate response template
      const templates = this.selectResponseTemplates(
        responseCategory,
        companionEmotion
      )
      const selectedResponse =
        templates[Math.floor(Math.random() * templates.length)]

      // Personalize response based on context
      const personalizedResponse = this.personalizeResponse(
        selectedResponse,
        context
      )

      // Determine response emotion
      const responseEmotion = this.determineResponseEmotion(
        responseCategory,
        companionEmotion,
        context
      )

      const processingTime = Date.now() - startTime
      const estimatedTokens = Math.ceil(personalizedResponse.length / 3)

      return {
        content: personalizedResponse,
        emotion: responseEmotion,
        confidence: 0.8, // High confidence for mock responses
        tokensUsed: estimatedTokens,
        provider: this.name,
        processingTime,
        cached: false,
        metadata: {
          model: 'mock-companion-v1',
          finishReason: 'stop',
          totalCost: 0,
          promptTokens: Math.ceil((lastMessage?.content?.length || 0) / 3),
          completionTokens: estimatedTokens,
          cacheHit: false,
          retryCount: 0,
        },
      }
    } catch (error) {
      throw this.createAIError(error, Date.now() - startTime)
    }
  }

  private analyzeUserInput(content: string): string {
    const lowerContent = content.toLowerCase()

    // Greeting patterns
    if (/안녕|하이|hello|반가|좋은|인사/.test(lowerContent)) {
      return 'greetings'
    }

    // Emotional keywords
    if (/슬프|우울|힘들|아프|걱정|문제/.test(lowerContent)) {
      return 'supportive'
    }

    if (/재미|놀|게임|장난|웃|즐거/.test(lowerContent)) {
      return 'playful'
    }

    if (/궁금|어떻게|왜|무엇|언제|어디/.test(lowerContent)) {
      return 'curious'
    }

    if (/생각|고민|복잡|어려|결정/.test(lowerContent)) {
      return 'thoughtful'
    }

    return 'casual'
  }

  private selectResponseTemplates(
    category: string,
    emotion: EmotionType
  ): string[] {
    // Combine category templates with emotion-based templates
    const categoryTemplates =
      this.responseTemplates[category as keyof typeof this.responseTemplates] ||
      this.responseTemplates.casual
    const emotionTemplates =
      this.emotionResponses[emotion] || this.responseTemplates.casual

    return [...categoryTemplates, ...emotionTemplates]
  }

  private personalizeResponse(response: string, context: any): string {
    // Add personality-based modifications
    const personality = context.companionPersonality

    if (personality.cheerful > 0.7) {
      response = response.replace(/[.!]$/, '!')
      if (Math.random() < 0.3) {
        response += ' 😊'
      }
    }

    if (personality.playful > 0.7) {
      if (Math.random() < 0.4) {
        response = response.replace(/요$/, '요~')
      }
    }

    if (personality.caring > 0.7) {
      if (/괜찮|걱정|힘들/.test(response)) {
        response = response.replace(/요[.!]?$/, '요. 제가 도와드릴게요!')
      }
    }

    // Add companion name reference occasionally
    if (Math.random() < 0.1) {
      response = `${context.companionName}이 말하는데, ${response.toLowerCase()}`
    }

    return response
  }

  private determineResponseEmotion(
    category: string,
    _currentEmotion: EmotionType,
    context: any
  ): EmotionType {
    // Determine response emotion based on context and category
    const emotionMap: Record<string, EmotionType[]> = {
      greetings: ['happy', 'excited'],
      supportive: ['caring', 'calm'],
      playful: ['playful', 'excited'],
      curious: ['curious', 'thoughtful'],
      thoughtful: ['thoughtful', 'calm'],
      casual: ['neutral', 'happy'],
    }

    const possibleEmotions = emotionMap[category] || ['neutral']

    // Influence by companion personality
    const personality = context.companionPersonality
    if (personality.cheerful > 0.8) {
      possibleEmotions.push('happy')
    }
    if (personality.curious > 0.8) {
      possibleEmotions.push('curious')
    }
    if (personality.playful > 0.8) {
      possibleEmotions.push('playful')
    }

    // Select random emotion from possibilities
    return possibleEmotions[Math.floor(Math.random() * possibleEmotions.length)]
  }

  private createAIError(error: any, processingTime: number): AIProviderError {
    return {
      code: 'MOCK_ERROR',
      message: error.message || 'Mock provider error',
      provider: this.name,
      recoverable: true,
      details: { processingTime },
    }
  }

  async isHealthy(): Promise<boolean> {
    // Mock provider is always healthy
    return true
  }

  async getRemainingQuota(): Promise<number | null> {
    // Mock provider has unlimited quota
    return 999999
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
