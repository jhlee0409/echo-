/**
 * 🧪 Dialogue Migration Integration Tests
 * 
 * Integration tests for the dialogue migration system with Service Integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DialogueMigrationService } from '../DialogueMigrationService'
import { getServiceIntegration } from '@services/integration'
import type { DialogueContext } from '../DialogueMigrationService'

// Mock the store adapters
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

describe('Dialogue Migration Integration Tests', () => {
  let migrationService: DialogueMigrationService
  let serviceIntegration: ReturnType<typeof getServiceIntegration>

  beforeEach(async () => {
    // Initialize Service Integration system
    serviceIntegration = getServiceIntegration()
    await serviceIntegration.initialize()
    
    // Initialize migration service
    migrationService = new DialogueMigrationService({
      enablePreview: true,
      preserveState: true,
      enhancedUI: true,
      contextAwareness: true,
      performanceMode: 'standard'
    })
  })

  afterEach(async () => {
    await serviceIntegration.shutdown()
  })

  describe('Service Integration Connectivity', () => {
    it('should connect to Service Integration system', async () => {
      expect(serviceIntegration.isReady()).toBe(true)
      expect(migrationService.isReady()).toBe(true)
      
      const healthReport = await serviceIntegration.getHealthReport()
      expect(healthReport.healthy).toBe(true)
      expect(healthReport.services).toBeDefined()
    })

    it('should report service health in migration preview', async () => {
      const mockContext: DialogueContext = {
        currentMode: 'conversation',
        previousMode: null,
        characterEmotion: 'happy',
        intimacyLevel: 0.5,
        conversationTopic: 'general'
      }

      const preview = await migrationService.previewMigration('emotion_sync', mockContext)
      
      expect(preview).toBeDefined()
      expect(preview.feasible).toBe(true)
      expect(typeof preview.riskLevel).toBe('string')
      expect(['low', 'medium', 'high']).toContain(preview.riskLevel)
    })
  })

  describe('Enhanced Dialogue Context Generation', () => {
    it('should generate comprehensive dialogue context', async () => {
      const context = await migrationService.getEnhancedDialogueContext('conversation')
      
      expect(context).toBeDefined()
      expect(context.currentMode).toBe('conversation')
      expect(context.characterEmotion).toBeDefined()
      expect(typeof context.intimacyLevel).toBe('number')
      expect(context.environmentContext).toBeDefined()
      
      // Environment context validation
      const env = context.environmentContext!
      expect(['morning', 'afternoon', 'evening', 'night']).toContain(env.timeOfDay)
      expect(env.mood).toBeDefined()
      expect(env.activity).toBe('conversation')
    })

    it('should handle different game modes in context generation', async () => {
      const modes = ['conversation', 'emotion_sync', 'exploration', 'battle', 'daily_activity'] as const
      
      for (const mode of modes) {
        const context = await migrationService.getEnhancedDialogueContext(mode)
        
        expect(context.currentMode).toBe(mode)
        expect(context.characterEmotion).toBeDefined()
        expect(context.intimacyLevel).toBeGreaterThanOrEqual(0)
        expect(context.intimacyLevel).toBeLessThanOrEqual(1)
        expect(context.environmentContext).toBeDefined()
      }
    })
  })

  describe('Performance Optimization Integration', () => {
    it('should perform optimization with Service Integration health check', async () => {
      const result = await migrationService.optimizeDialoguePerformance()
      
      expect(result).toBeDefined()
      expect(Array.isArray(result.optimizations)).toBe(true)
      expect(typeof result.performanceGain).toBe('number')
      expect(typeof result.memoryReduction).toBe('number')
      
      // Should include service integration health verification
      expect(result.optimizations).toContain('Service integration health verified')
      expect(result.performanceGain).toBeGreaterThanOrEqual(5) // Minimum gain from health check
    })

    it('should optimize conversation history when needed', async () => {
      // Mock large conversation history
      vi.doMock('@store/adapters', () => ({
        getCharacterStateAdapter: () => ({
          isValid: () => true,
          getErrors: () => [],
          getCharacter: () => ({
            id: 'test-character',
            currentEmotion: { dominant: 'happy', intensity: 0.7 },
            memoryBank: { shortTerm: new Array(25).fill('memory'), longTerm: [] }
          }),
          getIntimacyLevel: () => 0.5
        }),
        getConversationStateAdapter: () => ({
          getMessages: () => new Array(150).fill({
            id: '1',
            sender: 'user',
            content: 'Test message',
            timestamp: Date.now()
          }),
          getTotalMessageCount: () => 150,
          archiveOldMessages: vi.fn().mockResolvedValue(50)
        })
      }))

      const service = new DialogueMigrationService()
      const result = await service.optimizeDialoguePerformance()
      
      expect(result.optimizations.some(opt => opt.includes('messages'))).toBe(true)
      expect(result.optimizations.some(opt => opt.includes('memories'))).toBe(true)
      expect(result.performanceGain).toBeGreaterThan(15) // Should have significant gains
    })
  })

  describe('Migration Preview System', () => {
    it('should generate accurate previews for all game modes', async () => {
      const baseContext: DialogueContext = {
        currentMode: 'conversation',
        previousMode: null,
        characterEmotion: 'happy',
        intimacyLevel: 0.5,
        conversationTopic: 'general'
      }

      const modes = ['conversation', 'emotion_sync', 'exploration', 'battle', 'daily_activity'] as const
      
      for (const mode of modes) {
        const preview = await migrationService.previewMigration(mode, baseContext)
        
        expect(preview.feasible).toBe(true)
        expect(Array.isArray(preview.requiredChanges)).toBe(true)
        expect(typeof preview.estimatedDuration).toBe('number')
        expect(['low', 'medium', 'high']).toContain(preview.riskLevel)
        expect(Array.isArray(preview.recommendations)).toBe(true)
      }
    })

    it('should identify risk factors correctly', async () => {
      const riskContexts = [
        {
          context: { 
            currentMode: 'conversation' as const,
            previousMode: null,
            characterEmotion: 'anxious' as const,
            intimacyLevel: 0.2,
            conversationTopic: 'general'
          },
          targetMode: 'battle' as const,
          expectedRisk: 'high'
        },
        {
          context: {
            currentMode: 'conversation' as const,
            previousMode: null,
            characterEmotion: 'anxious' as const,
            intimacyLevel: 0.1,
            conversationTopic: 'general'
          },
          targetMode: 'emotion_sync' as const,
          expectedRisk: 'medium'
        }
      ]

      for (const { context, targetMode, expectedRisk } of riskContexts) {
        const preview = await migrationService.previewMigration(targetMode, context)
        expect(preview.riskLevel).toBe(expectedRisk)
      }
    })
  })

  describe('Migration State Management', () => {
    it('should manage migration state correctly', () => {
      const initialState = migrationService.getMigrationState()
      
      expect(initialState.isActive).toBe(false)
      expect(initialState.currentPhase).toBe('idle')
      expect(initialState.progress).toBe(0)
      expect(initialState.lastUpdate).toBeInstanceOf(Date)
    })

    it('should prevent concurrent migrations', async () => {
      const mockContext: DialogueContext = {
        currentMode: 'conversation',
        previousMode: null,
        characterEmotion: 'happy',
        intimacyLevel: 0.5,
        conversationTopic: 'general'
      }

      // Start first migration (it will activate state)
      const migration1Promise = migrationService.startMigration('exploration', mockContext)
        .catch(() => {}) // Expected to fail in test environment
      
      // Try to start second migration
      await expect(
        migrationService.startMigration('battle', mockContext)
      ).rejects.toThrow('Migration already in progress')

      await migration1Promise
    })
  })

  describe('Configuration Management', () => {
    it('should respect configuration settings', () => {
      const config = migrationService.getConfig()
      
      expect(config.enablePreview).toBe(true)
      expect(config.preserveState).toBe(true)
      expect(config.enhancedUI).toBe(true)
      expect(config.contextAwareness).toBe(true)
      expect(config.performanceMode).toBe('standard')
    })

    it('should work with different performance modes', async () => {
      const performanceModes = ['standard', 'optimized', 'experimental'] as const
      
      for (const mode of performanceModes) {
        const service = new DialogueMigrationService({
          performanceMode: mode
        })
        
        const config = service.getConfig()
        expect(config.performanceMode).toBe(mode)
        
        const mockContext: DialogueContext = {
          currentMode: 'conversation',
          previousMode: null,
          characterEmotion: 'happy',
          intimacyLevel: 0.5,
          conversationTopic: 'general'
        }

        const preview = await service.previewMigration('emotion_sync', mockContext)
        
        if (mode === 'experimental') {
          // Experimental mode should add warnings
          expect(preview.recommendations.some(r => r.includes('experimental'))).toBe(true)
        }
      }
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle service unavailability gracefully', async () => {
      // Mock service integration as not ready
      const mockServiceIntegration = {
        isReady: () => false,
        getHealthReport: async () => ({ 
          healthy: false, 
          services: {} 
        }),
        getService: vi.fn()
      }

      // Replace the service integration temporarily
      vi.doMock('@services/integration', () => ({
        getServiceIntegration: () => mockServiceIntegration
      }))

      const service = new DialogueMigrationService()
      expect(service.isReady()).toBe(false)
    })

    it('should provide meaningful error messages', async () => {
      const mockContext: DialogueContext = {
        currentMode: 'conversation',
        previousMode: null,
        characterEmotion: 'happy',
        intimacyLevel: 0.5,
        conversationTopic: 'general'
      }

      try {
        // This should fail due to test environment limitations
        await migrationService.startMigration('battle', mockContext)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBeTruthy()
      }
    })
  })

  describe('Real-world Integration Scenarios', () => {
    it('should handle typical user conversation flow', async () => {
      // Simulate typical user interaction pattern
      const scenarios = [
        {
          from: 'conversation' as const,
          to: 'emotion_sync' as const,
          emotion: 'happy' as const,
          intimacy: 0.6
        },
        {
          from: 'emotion_sync' as const,
          to: 'exploration' as const,
          emotion: 'excited' as const,
          intimacy: 0.7
        },
        {
          from: 'exploration' as const,
          to: 'daily_activity' as const,
          emotion: 'calm' as const,
          intimacy: 0.8
        }
      ]

      for (const scenario of scenarios) {
        const context: DialogueContext = {
          currentMode: scenario.from,
          previousMode: null,
          characterEmotion: scenario.emotion,
          intimacyLevel: scenario.intimacy,
          conversationTopic: 'general'
        }

        const preview = await migrationService.previewMigration(scenario.to, context)
        
        expect(preview.feasible).toBe(true)
        expect(preview.riskLevel).toBe('low') // Should be low risk for typical flows
      }
    })

    it('should generate enhanced context for different times of day', async () => {
      const times = ['morning', 'afternoon', 'evening', 'night'] as const
      
      for (const timeOfDay of times) {
        // Mock current time
        const mockDate = new Date()
        if (timeOfDay === 'morning') mockDate.setHours(8)
        else if (timeOfDay === 'afternoon') mockDate.setHours(14)
        else if (timeOfDay === 'evening') mockDate.setHours(19)
        else mockDate.setHours(23)
        
        vi.setSystemTime(mockDate)
        
        const context = await migrationService.getEnhancedDialogueContext('conversation')
        
        expect(context.environmentContext?.timeOfDay).toBe(timeOfDay)
        
        vi.useRealTimers()
      }
    })
  })
})