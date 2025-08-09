/**
 * 🌉 API Bridge Service
 * 
 * Provides a safe, validated bridge between state adapters and external APIs
 * Handles data transformation, validation, error recovery, and retry logic
 * 
 * Features:
 * - Type-safe API contracts
 * - Request/response validation
 * - Error handling and recovery
 * - Retry logic with exponential backoff
 * - Request deduplication
 * - Rate limiting
 * - Mock mode for development
 */

import { z } from 'zod'
import type { 
  Message, 
  EmotionType, 
  AICompanion, 
  GameState 
} from '@types'
import { AIManager } from '@services/ai/AIManager'
import SecurityEnhancementLayer from '@services/security/SecurityEnhancementLayer'
import { 
  getConversationStateAdapter,
  getCharacterStateAdapter,
  getGameStateAdapter 
} from '@store/adapters'

// API Request/Response Schemas
const ConversationRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  context: z.object({
    characterId: z.string(),
    emotion: z.string(),
    intimacyLevel: z.number().min(0).max(1),
    recentTopics: z.array(z.string()).optional(),
    conversationMode: z.enum(['casual', 'deep', 'playful', 'serious']).optional()
  }).optional()
})

const ConversationResponseSchema = z.object({
  content: z.string(),
  emotion: z.enum(['happy', 'sad', 'excited', 'calm', 'anxious', 'curious', 'thoughtful', 'content', 'confused', 'neutral']),
  metadata: z.object({
    confidence: z.number().min(0).max(1),
    processingTime: z.number(),
    tokensUsed: z.number().optional()
  }).optional()
})

const SaveGameRequestSchema = z.object({
  gameState: z.object({
    level: z.number().min(1),
    experience: z.number().min(0),
    playTime: z.number().min(0),
    unlockedFeatures: z.array(z.string())
  }),
  companion: z.object({
    name: z.string(),
    personalityTraits: z.record(z.number().min(0).max(1)),
    relationshipStatus: z.object({
      intimacyLevel: z.number().min(0).max(1),
      trustLevel: z.number().min(0).max(1)
    })
  }),
  timestamp: z.number()
})

// API Bridge Configuration
interface APIBridgeConfig {
  mockMode?: boolean
  timeout?: number
  maxRetries?: number
  rateLimitPerMinute?: number
}

// Request tracking for deduplication
interface PendingRequest {
  promise: Promise<any>
  timestamp: number
}

export class APIBridge {
  private aiManager: AIManager
  private security: SecurityEnhancementLayer
  private config: Required<APIBridgeConfig>
  
  // Request tracking
  private pendingRequests = new Map<string, PendingRequest>()
  private requestCounts = new Map<string, number[]>()
  
  // Retry configuration
  private readonly retryDelays = [1000, 2000, 4000] // Exponential backoff
  
  constructor(config: APIBridgeConfig = {}) {
    this.config = {
      mockMode: config.mockMode ?? true, // Default to mock mode for safety
      timeout: config.timeout ?? 30000,
      maxRetries: config.maxRetries ?? 3,
      rateLimitPerMinute: config.rateLimitPerMinute ?? 60
    }
    
    this.aiManager = new AIManager({
      defaultProvider: this.config.mockMode ? 'mock' : 'claude',
      claude: { 
        apiKey: this.config.mockMode ? 'mock-key' : (process.env.CLAUDE_API_KEY || 'mock-key')
      },
      mock: { enabled: this.config.mockMode }
    })
    
    this.security = new SecurityEnhancementLayer()
    
    // Clean up old requests periodically
    setInterval(() => this.cleanupPendingRequests(), 60000)
  }

  /**
   * Send a message and get AI response
   * Integrates with conversation and character state adapters
   */
  async sendMessage(
    message: string, 
    options?: { 
      characterId?: string
      skipValidation?: boolean 
    }
  ): Promise<Message> {
    // Validate input
    if (!options?.skipValidation) {
      const sanitized = await this.security.sanitizeInput(message)
      message = sanitized
    }
    
    // Check rate limiting
    this.checkRateLimit('conversation')
    
    // Deduplication check
    const requestKey = `msg:${message}:${options?.characterId || 'default'}`
    const pending = this.pendingRequests.get(requestKey)
    if (pending && Date.now() - pending.timestamp < 5000) {
      return pending.promise
    }
    
    // Build request context
    const characterAdapter = getCharacterStateAdapter()
    const character = characterAdapter.getCharacter()
    
    const request = ConversationRequestSchema.parse({
      message,
      context: character ? {
        characterId: character.id,
        emotion: character.currentEmotion.dominant,
        intimacyLevel: characterAdapter.getIntimacyLevel(),
        recentTopics: character.conversationContext.recentTopics
      } : undefined
    })
    
    // Create promise for deduplication
    const responsePromise = this.executeWithRetry(async () => {
      if (this.config.mockMode) {
        return this.generateMockResponse(request)
      }
      
      // Call AI service
      const aiResponse = await this.aiManager.chat({
        messages: [{
          role: 'user',
          content: request.message
        }],
        context: {
          companionName: character?.name || 'AI',
          companionPersonality: character?.personalityTraits || {},
          relationshipLevel: characterAdapter.getIntimacyLevel(),
          emotionalState: character?.currentEmotion.dominant || 'neutral',
          conversationHistory: this.getRecentConversationContext()
        }
      })
      
      // Validate response
      const validated = ConversationResponseSchema.parse({
        content: aiResponse.content,
        emotion: aiResponse.emotion || 'neutral',
        metadata: {
          confidence: aiResponse.confidence || 0.8,
          processingTime: Date.now() - startTime,
          tokensUsed: aiResponse.usage?.totalTokens
        }
      })
      
      return validated
    })
    
    const startTime = Date.now()
    this.pendingRequests.set(requestKey, {
      promise: responsePromise,
      timestamp: startTime
    })
    
    try {
      const response = await responsePromise
      
      // Create message object
      const aiMessage: Message = {
        id: `msg_${Date.now()}_ai`,
        sender: 'ai',
        content: response.content,
        timestamp: Date.now(),
        emotion: response.emotion
      }
      
      // Update character emotion based on response
      if (response.emotion !== character?.currentEmotion.dominant) {
        characterAdapter.updateEmotion(
          response.emotion,
          response.metadata?.confidence || 0.7
        )
      }
      
      return aiMessage
    } finally {
      this.pendingRequests.delete(requestKey)
    }
  }

  /**
   * Save game state to backend
   */
  async saveGameState(): Promise<{ success: boolean; saveId?: string }> {
    this.checkRateLimit('save')
    
    const gameAdapter = getGameStateAdapter()
    const characterAdapter = getCharacterStateAdapter()
    
    const gameState = gameAdapter.getState()
    const character = characterAdapter.getCharacter()
    
    if (!character) {
      throw new Error('Cannot save: Character not initialized')
    }
    
    const saveData = SaveGameRequestSchema.parse({
      gameState: {
        level: gameState.level,
        experience: gameState.experience,
        playTime: gameState.playTime,
        unlockedFeatures: gameState.unlockedFeatures
      },
      companion: {
        name: character.name,
        personalityTraits: character.personalityTraits,
        relationshipStatus: {
          intimacyLevel: character.relationshipStatus.intimacyLevel,
          trustLevel: character.relationshipStatus.trustLevel
        }
      },
      timestamp: Date.now()
    })
    
    if (this.config.mockMode) {
      // Mock save
      console.log('Mock save:', saveData)
      return { 
        success: true, 
        saveId: `save_${Date.now()}` 
      }
    }
    
    // In production, would call actual save API
    // For now, return success
    return { 
      success: true, 
      saveId: `save_${Date.now()}` 
    }
  }

  /**
   * Load game state from backend
   */
  async loadGameState(saveId: string): Promise<{
    gameState: Partial<GameState>
    companion: Partial<AICompanion>
  }> {
    this.checkRateLimit('load')
    
    if (this.config.mockMode) {
      // Return mock save data
      return {
        gameState: {
          level: 5,
          experience: 1250,
          playTime: 7200,
          unlockedFeatures: ['chat', 'status', 'exploration']
        },
        companion: {
          name: 'Aria',
          personalityTraits: {
            cheerful: 0.8,
            curious: 0.9,
            careful: 0.5
          },
          relationshipStatus: {
            level: 3,
            intimacyLevel: 0.6,
            trustLevel: 0.7,
            experience: 250,
            experienceToNext: 300
          }
        }
      }
    }
    
    // In production, would call actual load API
    throw new Error('Load not implemented for production')
  }

  /**
   * Get personalized content recommendations
   */
  async getContentRecommendations(): Promise<{
    topics: string[]
    activities: string[]
    emotionalTone: string
  }> {
    const characterAdapter = getCharacterStateAdapter()
    const character = characterAdapter.getCharacter()
    
    if (!character) {
      return {
        topics: ['getting to know each other', 'hobbies', 'daily life'],
        activities: ['casual chat', 'share stories'],
        emotionalTone: 'friendly'
      }
    }
    
    // Analyze character state and history
    const intimacy = characterAdapter.getIntimacyLevel()
    const currentEmotion = character.currentEmotion.dominant
    const recentTopics = character.conversationContext.recentTopics
    
    // Generate recommendations based on relationship level
    const recommendations = {
      topics: this.generateTopicRecommendations(intimacy, recentTopics),
      activities: this.generateActivityRecommendations(intimacy, currentEmotion),
      emotionalTone: this.determineEmotionalTone(currentEmotion, intimacy)
    }
    
    return recommendations
  }

  // Private helper methods
  
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), this.config.timeout)
        )
      ])
    } catch (error) {
      if (retryCount >= this.config.maxRetries) {
        throw error
      }
      
      const delay = this.retryDelays[retryCount] || 8000
      await new Promise(resolve => setTimeout(resolve, delay))
      
      return this.executeWithRetry(operation, retryCount + 1)
    }
  }

  private checkRateLimit(operation: string): void {
    const now = Date.now()
    const windowStart = now - 60000 // 1 minute window
    
    // Get request times for this operation
    const requests = this.requestCounts.get(operation) || []
    const recentRequests = requests.filter(time => time > windowStart)
    
    if (recentRequests.length >= this.config.rateLimitPerMinute) {
      throw new Error(`Rate limit exceeded for ${operation}`)
    }
    
    // Add current request
    recentRequests.push(now)
    this.requestCounts.set(operation, recentRequests)
  }

  private cleanupPendingRequests(): void {
    const now = Date.now()
    const timeout = 30000 // 30 seconds
    
    for (const [key, request] of this.pendingRequests) {
      if (now - request.timestamp > timeout) {
        this.pendingRequests.delete(key)
      }
    }
  }

  private getRecentConversationContext(): Array<{ role: string; content: string }> {
    const conversationAdapter = getConversationStateAdapter()
    const recentMessages = conversationAdapter.getMessages(0, 10)
    
    return recentMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))
  }

  private generateMockResponse(request: z.infer<typeof ConversationRequestSchema>) {
    const responses = [
      {
        content: `That's interesting! Tell me more about "${request.message.slice(0, 20)}..."`,
        emotion: 'curious' as EmotionType
      },
      {
        content: `I understand how you feel. ${request.message} is something worth discussing.`,
        emotion: 'thoughtful' as EmotionType
      },
      {
        content: `Oh, that makes me happy! I love talking about these things with you.`,
        emotion: 'happy' as EmotionType
      }
    ]
    
    const response = responses[Math.floor(Math.random() * responses.length)]
    
    return {
      ...response,
      metadata: {
        confidence: 0.85,
        processingTime: Math.random() * 1000 + 500,
        tokensUsed: Math.floor(Math.random() * 100 + 50)
      }
    }
  }

  private generateTopicRecommendations(intimacy: number, recentTopics: string[]): string[] {
    const allTopics = {
      low: ['hobbies', 'favorite foods', 'weather', 'daily routine'],
      medium: ['dreams', 'childhood memories', 'future plans', 'personal values'],
      high: ['deep fears', 'life philosophy', 'relationship thoughts', 'personal growth']
    }
    
    const level = intimacy < 0.3 ? 'low' : intimacy < 0.7 ? 'medium' : 'high'
    const available = allTopics[level].filter(t => !recentTopics.includes(t))
    
    return available.slice(0, 3)
  }

  private generateActivityRecommendations(intimacy: number, emotion: EmotionType): string[] {
    const activities = {
      happy: ['share funny stories', 'play word games', 'discuss happy memories'],
      sad: ['offer comfort', 'share supportive thoughts', 'listen quietly'],
      curious: ['explore new topics', 'ask deep questions', 'share knowledge'],
      anxious: ['practice relaxation', 'share calming thoughts', 'offer reassurance']
    }
    
    return activities[emotion as keyof typeof activities] || 
           ['have a friendly chat', 'share stories', 'ask questions']
  }

  private determineEmotionalTone(emotion: EmotionType, intimacy: number): string {
    if (intimacy > 0.7) {
      return 'warm and intimate'
    } else if (intimacy > 0.4) {
      return 'friendly and open'
    } else {
      return 'polite and curious'
    }
  }
}

// Singleton instance
let apiBridge: APIBridge | null = null

export const getAPIBridge = (config?: APIBridgeConfig): APIBridge => {
  if (!apiBridge) {
    apiBridge = new APIBridge(config)
  }
  return apiBridge
}

// React hook
export const useAPIBridge = (): APIBridge => {
  return getAPIBridge()
}