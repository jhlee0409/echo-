/**
 * 📋 Service Definitions
 *
 * Defines all application services for the integration system
 * Maps existing services to the service integration framework
 */

import type { ServiceDefinition } from './types'
import { getAPIBridge } from '../api/APIBridge'
import { getAIManager } from '../ai/AIManager'

// Service Definitions
export const aiServiceDefinition: ServiceDefinition<any> = {
  name: 'AIService',
  factory: async (_dependencies, _config) => {
    const aiManager = getAIManager()

    // 안전한 기본 컨텍스트 생성기
    const buildSafeContext = (ctx: any = {}) => ({
      companionName: ctx?.companionName || 'System',
      companionPersonality: ctx?.companionPersonality || {
        cheerful: 0.5,
        careful: 0.5,
        curious: 0.5,
        emotional: 0.5,
        independent: 0.5,
      },
      relationshipLevel:
        typeof ctx?.relationshipLevel === 'number'
          ? ctx.relationshipLevel
          : 0.5,
      intimacyLevel:
        typeof ctx?.intimacyLevel === 'number' ? ctx.intimacyLevel : 0.5,
      userEmotion: ctx?.userEmotion || 'neutral',
      companionEmotion: ctx?.companionEmotion || 'neutral',
      recentTopics: Array.isArray(ctx?.recentTopics) ? ctx.recentTopics : [],
      currentScene: ctx?.currentScene || 'system_check',
      timeOfDay: ctx?.timeOfDay || 'morning',
      specialContext: ctx?.specialContext || {},
    })

    return {
      async processMessage(content: string, context: any = {}) {
        // AIRequest 형태로 변환하여 호출
        return aiManager.generateResponse({
          messages: [{ role: 'user', content }],
          context: buildSafeContext(context),
          options: context?.options || {},
        })
      },

      async generateResponse(prompt: string, options: any = {}) {
        // 문자열 프롬프트를 AIRequest로 포장
        return aiManager.generateResponse({
          messages: [{ role: 'user', content: prompt }],
          context: buildSafeContext(options?.context),
          options,
        })
      },

      async analyzeEmotion(content: string) {
        return (
          aiManager.analyzeEmotion?.(content) || {
            emotion: 'neutral',
            intensity: 0.5,
          }
        )
      },

      async initialize() {
        // AI service initialization if needed
      },

      async shutdown() {
        // AI service cleanup
      },

      async healthCheck() {
        try {
          // 올바른 AIRequest로 헬스체크 수행
          await aiManager.generateResponse({
            messages: [{ role: 'user', content: 'health check' }],
            context: buildSafeContext(),
            options: { timeout: 5000 },
          })
          return { healthy: true, message: 'AI service responding' }
        } catch (error) {
          return { healthy: false, message: `AI service error: ${error}` }
        }
      },
    }
  },
  dependencies: ['SecurityService'],
  singleton: true,
  lazy: false,
  healthCheck: service => service.healthCheck(),
}

export const battleServiceDefinition: ServiceDefinition<any> = {
  name: 'BattleService',
  factory: async (_dependencies, _config) => {
    const { getBattleIntegrationService } = await import(
      '../battle/BattleIntegrationService'
    )

    const battleIntegration = getBattleIntegrationService()

    return {
      async processBattleResults(battleResult: any) {
        return battleIntegration.processBattleResults(battleResult)
      },

      async calculateBattleRewards(battleResult: any, character: any) {
        return battleIntegration.calculateBattleRewards(battleResult, character)
      },

      async applyCharacterStatsInfluence(character: any, battleStats: any) {
        return (
          battleIntegration.applyCharacterStatsInfluence?.(
            character,
            battleStats
          ) || battleStats
        )
      },

      getPerformanceHistory(characterId: string) {
        return battleIntegration.getPerformanceHistory(characterId)
      },

      async initialize() {
        // Battle service initialization
      },

      async shutdown() {
        // Battle service cleanup
      },

      async healthCheck() {
        try {
          return {
            healthy: true,
            message: 'Battle integration service operational',
            details: { integrationActive: true },
          }
        } catch (error) {
          return { healthy: false, message: `Battle service error: ${error}` }
        }
      },
    }
  },
  dependencies: ['CharacterService'],
  singleton: true,
  lazy: true,
  healthCheck: service => service.healthCheck(),
}

export const characterServiceDefinition: ServiceDefinition<any> = {
  name: 'CharacterService',
  factory: async (_dependencies, _config) => {
    const { getCharacterStateAdapter } = await import(
      '../../store/adapters/CharacterStateAdapter'
    )
    const adapter = getCharacterStateAdapter()

    return {
      getCharacter(id?: string) {
        return adapter.getCharacter()
      },

      async updateCharacter(updates: any) {
        return adapter.updateCharacter(updates)
      },

      async updateEmotion(emotion: string, intensity: number) {
        return adapter.updateEmotion(emotion, intensity)
      },

      async addMemory(memory: any) {
        return adapter.addMemory(memory)
      },

      getPersonalityTraits() {
        return adapter.getPersonalityTraits()
      },

      getEmotionalState() {
        return adapter.getEmotionalState()
      },

      getRelationshipStatus() {
        return adapter.getRelationshipStatus()
      },

      async initialize() {
        // Character service initialization
      },

      async shutdown() {
        // Character service cleanup
      },

      async healthCheck() {
        try {
          const character = adapter.getCharacter()
          return {
            healthy: true,
            message: 'Character service operational',
            details: { hasCharacter: !!character },
          }
        } catch (error) {
          return {
            healthy: false,
            message: `Character service error: ${error}`,
          }
        }
      },
    }
  },
  dependencies: [],
  singleton: true,
  lazy: false,
  healthCheck: service => service.healthCheck(),
}

export const securityServiceDefinition: ServiceDefinition<any> = {
  name: 'SecurityService',
  factory: async (_dependencies, _config) => {
    const { getSecurityLayer } = await import(
      '../security/SecurityEnhancementLayer'
    )
    const security = getSecurityLayer()

    return {
      async validateRequest(request: any) {
        return security.validateInput(request)
      },

      sanitizeInput(input: any) {
        return security.sanitizeInput(input)
      },

      async checkPermissions(user: any, resource: string, action: string) {
        // Mock permission check - implement based on your auth system
        return true
      },

      async auditLog(event: any) {
        console.log('🔒 Security Audit:', event)
      },

      validateMessage(content: string) {
        return security.validateInput(content)
      },

      async initialize() {
        // Security service initialization
      },

      async shutdown() {
        // Security service cleanup
      },

      async healthCheck() {
        try {
          // Test security validation
          const testResult = security.validateInput('test input')
          return {
            healthy: true,
            message: 'Security service operational',
            details: { validationWorking: testResult },
          }
        } catch (error) {
          return { healthy: false, message: `Security service error: ${error}` }
        }
      },
    }
  },
  dependencies: [],
  singleton: true,
  lazy: false,
  healthCheck: service => service.healthCheck(),
}

export const apiServiceDefinition: ServiceDefinition<any> = {
  name: 'APIService',
  factory: async (_dependencies, _config) => {
    const apiBridge = getAPIBridge()

    return {
      async sendMessage(content: string, options: any = {}) {
        return apiBridge.sendMessage(content, options)
      },

      async saveGameState() {
        return apiBridge.saveGameState()
      },

      async loadGameState(saveId: string) {
        return apiBridge.loadGameState(saveId)
      },

      async getContentRecommendations() {
        return apiBridge.getContentRecommendations()
      },

      async initialize() {
        // API service initialization
      },

      async shutdown() {
        // API service cleanup
      },

      async healthCheck() {
        try {
          // Mock health check - in real implementation, ping the API
          return {
            healthy: true,
            message: 'API service operational',
            details: { mockMode: true },
          }
        } catch (error) {
          return { healthy: false, message: `API service error: ${error}` }
        }
      },
    }
  },
  dependencies: ['SecurityService'],
  singleton: true,
  lazy: false,
  healthCheck: service => service.healthCheck(),
}

export const gameStateServiceDefinition: ServiceDefinition<any> = {
  name: 'GameStateService',
  factory: async (_dependencies, _config) => {
    const { getGameStateAdapter } = await import(
      '../../store/adapters/GameStateAdapter'
    )
    const adapter = getGameStateAdapter()

    return {
      getState() {
        return adapter.getState()
      },

      async saveGame() {
        return adapter.saveGame()
      },

      async loadGame(saveId?: string) {
        return adapter.loadGame(saveId)
      },

      getLevel() {
        return adapter.getLevel()
      },

      getExperience() {
        return adapter.getExperience()
      },

      addExperience(amount: number) {
        return adapter.addExperience(amount)
      },

      unlockFeature(feature: string) {
        return adapter.unlockFeature(feature)
      },

      isFeatureUnlocked(feature: string) {
        return adapter.isFeatureUnlocked(feature)
      },

      getStatistics() {
        return adapter.getStatistics()
      },

      async initialize() {
        await adapter.hydrate()
      },

      async shutdown() {
        await adapter.persist()
      },

      async healthCheck() {
        try {
          const isValid = adapter.isValid()
          const errors = adapter.getErrors()
          return {
            healthy: isValid,
            message: isValid
              ? 'Game state service operational'
              : 'Game state validation failed',
            details: { errors },
          }
        } catch (error) {
          return {
            healthy: false,
            message: `Game state service error: ${error}`,
          }
        }
      },
    }
  },
  dependencies: ['APIService'],
  singleton: true,
  lazy: false,
  healthCheck: service => service.healthCheck(),
}

export const conversationServiceDefinition: ServiceDefinition<any> = {
  name: 'ConversationService',
  factory: async (_dependencies, _config) => {
    const { getConversationStateAdapter } = await import(
      '../../store/adapters/ConversationStateAdapter'
    )
    const adapter = getConversationStateAdapter()

    return {
      async sendMessage(content: string) {
        return adapter.sendMessage(content)
      },

      getMessages(page?: number, pageSize?: number) {
        return adapter.getMessages(page, pageSize)
      },

      getTotalMessageCount() {
        return adapter.getTotalMessageCount()
      },

      isAIResponding() {
        return adapter.isAIResponding()
      },

      getConversationStats() {
        return adapter.getConversationStats()
      },

      async exportConversation() {
        return adapter.exportConversation()
      },

      clearConversation() {
        return adapter.clearConversation()
      },

      async initialize() {
        await adapter.hydrate()
      },

      async shutdown() {
        await adapter.persist()
      },

      async healthCheck() {
        try {
          const isValid = adapter.isValid()
          const errors = adapter.getErrors()
          return {
            healthy: isValid,
            message: isValid
              ? 'Conversation service operational'
              : 'Conversation validation failed',
            details: { errors, messageCount: adapter.getTotalMessageCount() },
          }
        } catch (error) {
          return {
            healthy: false,
            message: `Conversation service error: ${error}`,
          }
        }
      },
    }
  },
  dependencies: ['APIService', 'AIService'],
  singleton: true,
  lazy: false,
  healthCheck: service => service.healthCheck(),
}

// Export all service definitions
export const allServiceDefinitions: ServiceDefinition<any>[] = [
  securityServiceDefinition,
  characterServiceDefinition,
  apiServiceDefinition,
  aiServiceDefinition,
  gameStateServiceDefinition,
  conversationServiceDefinition,
  battleServiceDefinition,
]

// Service name constants
export const SERVICE_NAMES = {
  AI: 'AIService',
  BATTLE: 'BattleService',
  CHARACTER: 'CharacterService',
  SECURITY: 'SecurityService',
  API: 'APIService',
  GAME_STATE: 'GameStateService',
  CONVERSATION: 'ConversationService',
} as const

export type ServiceName = (typeof SERVICE_NAMES)[keyof typeof SERVICE_NAMES]
