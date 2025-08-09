/**
 * 📋 Service Definitions
 * 
 * Defines all application services for the integration system
 * Maps existing services to the service integration framework
 */

import type { ServiceDefinition } from './types'

// Service Definitions
export const aiServiceDefinition: ServiceDefinition<any> = {
  name: 'AIService',
  factory: async (dependencies, config) => {
    const { getAIManager } = await import('@services/ai/AIManager')
    const aiManager = getAIManager()
    
    return {
      async processMessage(content: string, context: any = {}) {
        return aiManager.processMessage(content, context)
      },
      
      async generateResponse(prompt: string, options: any = {}) {
        return aiManager.generateResponse(prompt, options)
      },
      
      async analyzeEmotion(content: string) {
        return aiManager.analyzeEmotion?.(content) || { emotion: 'neutral', intensity: 0.5 }
      },
      
      async initialize() {
        // AI service initialization if needed
      },
      
      async shutdown() {
        // AI service cleanup
      },
      
      async healthCheck() {
        try {
          // Simple health check - try to generate a test response
          await aiManager.generateResponse('health check', { timeout: 5000 })
          return { healthy: true, message: 'AI service responding' }
        } catch (error) {
          return { healthy: false, message: `AI service error: ${error}` }
        }
      }
    }
  },
  dependencies: ['SecurityService'],
  singleton: true,
  lazy: false,
  healthCheck: (service) => service.healthCheck()
}

export const battleServiceDefinition: ServiceDefinition<any> = {
  name: 'BattleService',
  factory: async (dependencies, config) => {
    const { getBattleIntegrationService } = await import('@services/battle/BattleIntegrationService')
    
    const battleIntegration = getBattleIntegrationService()
    
    return {
      async processBattleResults(battleResult: any) {
        return battleIntegration.processBattleResults(battleResult)
      },
      
      async calculateBattleRewards(battleResult: any, character: any) {
        return battleIntegration.calculateBattleRewards(battleResult, character)
      },
      
      async applyCharacterStatsInfluence(character: any, battleStats: any) {
        return battleIntegration.applyCharacterStatsInfluence?.(character, battleStats) || battleStats
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
            details: { integrationActive: true }
          }
        } catch (error) {
          return { healthy: false, message: `Battle service error: ${error}` }
        }
      }
    }
  },
  dependencies: ['CharacterService'],
  singleton: true,
  lazy: true,
  healthCheck: (service) => service.healthCheck()
}

export const characterServiceDefinition: ServiceDefinition<any> = {
  name: 'CharacterService',
  factory: async (dependencies, config) => {
    const { getCharacterStateAdapter } = await import('@store/adapters/CharacterStateAdapter')
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
            details: { hasCharacter: !!character }
          }
        } catch (error) {
          return { healthy: false, message: `Character service error: ${error}` }
        }
      }
    }
  },
  dependencies: [],
  singleton: true,
  lazy: false,
  healthCheck: (service) => service.healthCheck()
}

export const securityServiceDefinition: ServiceDefinition<any> = {
  name: 'SecurityService',
  factory: async (dependencies, config) => {
    const { getSecurityLayer } = await import('@services/security/SecurityEnhancementLayer')
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
            details: { validationWorking: testResult }
          }
        } catch (error) {
          return { healthy: false, message: `Security service error: ${error}` }
        }
      }
    }
  },
  dependencies: [],
  singleton: true,
  lazy: false,
  healthCheck: (service) => service.healthCheck()
}

export const apiServiceDefinition: ServiceDefinition<any> = {
  name: 'APIService',
  factory: async (dependencies, config) => {
    const { getAPIBridge } = await import('@services/api/APIBridge')
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
            details: { mockMode: true }
          }
        } catch (error) {
          return { healthy: false, message: `API service error: ${error}` }
        }
      }
    }
  },
  dependencies: ['SecurityService'],
  singleton: true,
  lazy: false,
  healthCheck: (service) => service.healthCheck()
}

export const gameStateServiceDefinition: ServiceDefinition<any> = {
  name: 'GameStateService',
  factory: async (dependencies, config) => {
    const { getGameStateAdapter } = await import('@store/adapters/GameStateAdapter')
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
            message: isValid ? 'Game state service operational' : 'Game state validation failed',
            details: { errors }
          }
        } catch (error) {
          return { healthy: false, message: `Game state service error: ${error}` }
        }
      }
    }
  },
  dependencies: ['APIService'],
  singleton: true,
  lazy: false,
  healthCheck: (service) => service.healthCheck()
}

export const conversationServiceDefinition: ServiceDefinition<any> = {
  name: 'ConversationService',
  factory: async (dependencies, config) => {
    const { getConversationStateAdapter } = await import('@store/adapters/ConversationStateAdapter')
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
            message: isValid ? 'Conversation service operational' : 'Conversation validation failed',
            details: { errors, messageCount: adapter.getTotalMessageCount() }
          }
        } catch (error) {
          return { healthy: false, message: `Conversation service error: ${error}` }
        }
      }
    }
  },
  dependencies: ['APIService', 'AIService'],
  singleton: true,
  lazy: false,
  healthCheck: (service) => service.healthCheck()
}

// Export all service definitions
export const allServiceDefinitions: ServiceDefinition<any>[] = [
  securityServiceDefinition,
  characterServiceDefinition,
  apiServiceDefinition,
  aiServiceDefinition,
  gameStateServiceDefinition,
  conversationServiceDefinition,
  battleServiceDefinition
]

// Service name constants
export const SERVICE_NAMES = {
  AI: 'AIService',
  BATTLE: 'BattleService',
  CHARACTER: 'CharacterService',
  SECURITY: 'SecurityService',
  API: 'APIService',
  GAME_STATE: 'GameStateService',
  CONVERSATION: 'ConversationService'
} as const

export type ServiceName = typeof SERVICE_NAMES[keyof typeof SERVICE_NAMES]