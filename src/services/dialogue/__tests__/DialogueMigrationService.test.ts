/**
 * 🧪 Dialogue Migration Service Tests
 * 
 * Tests for the dialogue migration and enhancement system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DialogueMigrationService } from '../DialogueMigrationService'
import type { DialogueContext } from '../DialogueMigrationService'

// Mock the dependencies
vi.mock('@services/integration', () => ({
  getServiceIntegration: () => ({
    isReady: () => true,
    getHealthReport: async () => ({
      healthy: true,
      services: {
        'AIService': { healthy: true },
        'CharacterService': { healthy: true },
        'BattleService': { healthy: true }
      }
    }),
    getService: vi.fn()
  })
}))

vi.mock('@store/adapters', () => ({
  getCharacterStateAdapter: () => ({
    isValid: () => true,
    getErrors: () => [],
    getCharacter: () => ({
      id: 'test-character',
      name: 'Test Character',
      currentEmotion: { dominant: 'happy', intensity: 0.7 },
      relationshipStatus: { intimacyLevel: 0.5, trustLevel: 0.6, level: 2 },
      memoryBank: { shortTerm: [], longTerm: [] }
    }),
    getIntimacyLevel: () => 0.5
  }),
  getConversationStateAdapter: () => ({
    getMessages: () => [
      {
        id: '1',
        sender: 'user',
        content: 'Hello!',
        timestamp: Date.now(),
        emotion: 'happy'
      }
    ],
    getTotalMessageCount: () => 1,
    archiveOldMessages: vi.fn().mockResolvedValue(0)
  })
}))

describe('DialogueMigrationService', () => {
  let migrationService: DialogueMigrationService
  let mockContext: DialogueContext

  beforeEach(() => {
    migrationService = new DialogueMigrationService({
      enablePreview: true,
      preserveState: true,
      enhancedUI: true,
      contextAwareness: true,
      performanceMode: 'standard'
    })

    mockContext = {
      currentMode: 'conversation',
      previousMode: null,
      characterEmotion: 'happy',
      intimacyLevel: 0.5,
      conversationTopic: 'general'
    }
  })

  describe('Service Initialization', () => {
    it('should initialize with correct configuration', () => {
      const config = migrationService.getConfig()
      
      expect(config.enablePreview).toBe(true)
      expect(config.preserveState).toBe(true)
      expect(config.enhancedUI).toBe(true)
      expect(config.contextAwareness).toBe(true)
      expect(config.performanceMode).toBe('standard')
    })

    it('should report ready status correctly', () => {
      expect(migrationService.isReady()).toBe(true)
    })
  })

  describe('Migration Preview', () => {
    it('should generate feasible migration preview for conversation mode', async () => {
      const preview = await migrationService.previewMigration('conversation', mockContext)
      
      expect(preview).toHaveProperty('feasible')
      expect(preview).toHaveProperty('requiredChanges')
      expect(preview).toHaveProperty('estimatedDuration')
      expect(preview).toHaveProperty('riskLevel')
      expect(preview).toHaveProperty('recommendations')
      
      expect(typeof preview.feasible).toBe('boolean')
      expect(Array.isArray(preview.requiredChanges)).toBe(true)
      expect(typeof preview.estimatedDuration).toBe('number')
      expect(['low', 'medium', 'high']).toContain(preview.riskLevel)
    })

    it('should handle emotion sync mode requirements', async () => {
      const emotionContext = {
        ...mockContext,
        characterEmotion: 'anxious' as const,
        intimacyLevel: 0.2
      }

      const preview = await migrationService.previewMigration('emotion_sync', emotionContext)
      
      expect(preview.riskLevel).toBe('medium')
      expect(preview.requiredChanges.some(change => 
        change.includes('emotional state')
      )).toBe(true)
    })

    it('should identify battle mode risks with negative emotions', async () => {
      const battleContext = {
        ...mockContext,
        characterEmotion: 'anxious' as const
      }

      const preview = await migrationService.previewMigration('battle', battleContext)
      
      expect(preview.riskLevel).toBe('high')
      expect(preview.recommendations.some(rec => 
        rec.includes('mood')
      )).toBe(true)
    })
  })

  describe('Enhanced Dialogue Context', () => {
    it('should generate enhanced context with environment data', async () => {
      const context = await migrationService.getEnhancedDialogueContext('conversation')
      
      expect(context).toHaveProperty('currentMode', 'conversation')
      expect(context).toHaveProperty('characterEmotion', 'happy')
      expect(context).toHaveProperty('intimacyLevel', 0.5)
      expect(context).toHaveProperty('environmentContext')
      
      const env = context.environmentContext
      expect(env).toHaveProperty('timeOfDay')
      expect(env).toHaveProperty('mood')
      expect(env).toHaveProperty('activity')
      expect(['morning', 'afternoon', 'evening', 'night']).toContain(env.timeOfDay)
    })

    it('should analyze conversation topic correctly', async () => {
      const context = await migrationService.getEnhancedDialogueContext('conversation')
      
      // Should detect general topic from "Hello!" message
      expect(context.conversationTopic).toBe('general')
    })
  })

  describe('Performance Optimization', () => {
    it('should identify optimization opportunities', async () => {
      const result = await migrationService.optimizeDialoguePerformance()
      
      expect(result).toHaveProperty('optimizations')
      expect(result).toHaveProperty('performanceGain')
      expect(result).toHaveProperty('memoryReduction')
      
      expect(Array.isArray(result.optimizations)).toBe(true)
      expect(typeof result.performanceGain).toBe('number')
      expect(typeof result.memoryReduction).toBe('number')
    })

    it('should report service integration health verification', async () => {
      const result = await migrationService.optimizeDialoguePerformance()
      
      expect(result.optimizations).toContain('Service integration health verified')
      expect(result.performanceGain).toBeGreaterThan(0)
    })
  })

  describe('Migration State Management', () => {
    it('should initialize with idle state', () => {
      const state = migrationService.getMigrationState()
      
      expect(state.isActive).toBe(false)
      expect(state.currentPhase).toBe('idle')
      expect(state.progress).toBe(0)
    })

    it('should prevent concurrent migrations', async () => {
      // Start a migration (it will fail due to mocked services, but should set active state)
      const migrationPromise = migrationService.startMigration('exploration', mockContext)
        .catch(() => {}) // Ignore expected failure
      
      // Try to start another migration while first is active
      await expect(
        migrationService.startMigration('battle', mockContext)
      ).rejects.toThrow('Migration already in progress')
      
      await migrationPromise
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid character state', () => {
      const serviceWithInvalidCharacter = new DialogueMigrationService()
      
      // Mock invalid character adapter
      vi.doMock('@store/adapters', () => ({
        getCharacterStateAdapter: () => ({
          isValid: () => false,
          getErrors: () => ['Character not initialized'],
          getCharacter: () => null
        })
      }))
      
      expect(serviceWithInvalidCharacter.isReady()).toBe(false)
    })

    it('should validate migration prerequisites', async () => {
      await expect(
        migrationService.startMigration('battle', mockContext)
      ).rejects.toThrow() // Will fail on service validation in test environment
    })
  })

  describe('Context Analysis', () => {
    it('should analyze gaming topic from messages', async () => {
      // Mock conversation adapter with gaming messages
      vi.doMock('@store/adapters', () => ({
        ...vi.importActual('@store/adapters'),
        getConversationStateAdapter: () => ({
          getMessages: () => [
            {
              id: '1',
              sender: 'user',
              content: 'Let\'s play a game!',
              timestamp: Date.now(),
              emotion: 'excited'
            }
          ],
          getTotalMessageCount: () => 1
        })
      }))

      const context = await migrationService.getEnhancedDialogueContext('conversation')
      expect(context.conversationTopic).toBe('gaming')
    })

    it('should handle empty conversation history', async () => {
      // Mock empty conversation
      vi.doMock('@store/adapters', () => ({
        ...vi.importActual('@store/adapters'),
        getConversationStateAdapter: () => ({
          getMessages: () => [],
          getTotalMessageCount: () => 0
        })
      }))

      const context = await migrationService.getEnhancedDialogueContext('conversation')
      expect(context.conversationTopic).toBeUndefined()
    })
  })
})