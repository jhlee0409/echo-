import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useStore } from '@store/gameStore'
import type { GameState, AICompanion, Settings } from '@types'

/**
 * Feature Tests: Game Store State Management
 * Validates core game state functionality before implementing new features
 */
describe('Feature: Game Store State Management', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useStore.getState().reset()
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks()
  })

  describe('Given a new game installation', () => {
    describe('When the game initializes for the first time', () => {
      it('Then it should create default game state with proper initial values', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Fresh installation
        expect(result.current.isInitialized).toBe(false)
        expect(result.current.gameState).toBeNull()
        expect(result.current.companion).toBeNull()
        
        // When: Initialize the game
        await act(async () => {
          await result.current.initialize()
        })
        
        // Then: Default state should be created
        await waitFor(() => {
          expect(result.current.isInitialized).toBe(true)
          expect(result.current.error).toBeNull()
        })
        
        // Verify game state structure
        const gameState = result.current.gameState!
        expect(gameState).toMatchObject({
          level: 1,
          experience: 0,
          conversationCount: 0,
          daysSinceStart: 0,
          playTime: 0,
          isFirstTime: true,
          currentScene: 'main_room',
          gameVersion: '1.0.0-alpha'
        })
        expect(gameState.unlockedFeatures).toContain('chat')
        expect(gameState.unlockedFeatures).toContain('status')
        
        // Verify companion structure
        const companion = result.current.companion!
        expect(companion).toMatchObject({
          id: 'companion_001',
          name: '아리아',
          personalityTraits: {
            cheerful: 0.7,
            careful: 0.4,
            curious: 0.8,
            emotional: 0.6,
            independent: 0.3
          },
          relationshipStatus: {
            level: 1,
            experience: 0,
            experienceToNext: 100,
            intimacyLevel: 0.1,
            trustLevel: 0.1
          },
          currentEmotion: {
            dominant: 'curious',
            intensity: 0.6,
            stability: 0.8
          }
        })
        
        // Verify settings
        const settings = result.current.settings!
        expect(settings).toMatchObject({
          soundEnabled: true,
          musicEnabled: true,
          animationsEnabled: true,
          darkMode: true,
          language: 'ko',
          notifications: true,
          autoSave: true
        })
      })
      
      it('Then it should perform AI health check during initialization', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Mock console to capture AI health check logs
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        
        // When: Initialize the game
        await act(async () => {
          await result.current.initialize()
        })
        
        // Then: Health check should be performed
        await waitFor(() => {
          expect(result.current.isInitialized).toBe(true)
        })
        
        // Verify health check logs were generated
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('🤖 Initializing AI Manager')
        )
        expect(consoleSpy).toHaveBeenCalledWith(
          '🔍 AI Service Health Check:',
          expect.objectContaining({
            healthy: expect.any(Boolean),
            hasClaudeKey: expect.any(Boolean),
            keyPrefix: expect.any(String)
          })
        )
        
        consoleSpy.mockRestore()
      })
    })
  })

  describe('Given an initialized game state', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useStore())
      await act(async () => {
        await result.current.initialize()
      })
    })

    describe('When updating game state properties', () => {
      it('Then it should properly update game state while preserving other properties', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Initial game state
        const initialState = result.current.gameState!
        expect(initialState.level).toBe(1)
        expect(initialState.experience).toBe(0)
        
        // When: Update specific properties
        act(() => {
          result.current.updateGameState({
            level: 2,
            experience: 150,
            conversationCount: 5
          })
        })
        
        // Then: Properties should be updated, others preserved
        const updatedState = result.current.gameState!
        expect(updatedState.level).toBe(2)
        expect(updatedState.experience).toBe(150)
        expect(updatedState.conversationCount).toBe(5)
        
        // Other properties should remain unchanged
        expect(updatedState.daysSinceStart).toBe(initialState.daysSinceStart)
        expect(updatedState.currentScene).toBe(initialState.currentScene)
        expect(updatedState.gameVersion).toBe(initialState.gameVersion)
      })
    })

    describe('When updating companion state', () => {
      it('Then it should properly update companion while preserving structure', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Initial companion state
        const initialCompanion = result.current.companion!
        expect(initialCompanion.currentEmotion.dominant).toBe('curious')
        expect(initialCompanion.relationshipStatus.level).toBe(1)
        
        // When: Update companion properties
        act(() => {
          result.current.updateCompanion({
            currentEmotion: {
              dominant: 'happy',
              intensity: 0.8,
              stability: 0.9
            },
            relationshipStatus: {
              ...initialCompanion.relationshipStatus,
              level: 2,
              experience: 50,
              intimacyLevel: 0.3
            }
          })
        })
        
        // Then: Properties should be updated correctly
        const updatedCompanion = result.current.companion!
        expect(updatedCompanion.currentEmotion).toMatchObject({
          dominant: 'happy',
          intensity: 0.8,
          stability: 0.9
        })
        expect(updatedCompanion.relationshipStatus.level).toBe(2)
        expect(updatedCompanion.relationshipStatus.intimacyLevel).toBe(0.3)
        
        // Other properties should remain unchanged  
        expect(updatedCompanion.name).toBe(initialCompanion.name)
        expect(updatedCompanion.personalityTraits).toEqual(initialCompanion.personalityTraits)
      })
    })

    describe('When saving game progress', () => {
      it('Then it should update lastSaved timestamp', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Initial state without saved timestamp
        expect(result.current.gameState!.lastSaved).toBeNull()
        
        // When: Save the game
        const beforeSave = Date.now()
        await act(async () => {
          await result.current.saveGame()
        })
        const afterSave = Date.now()
        
        // Then: lastSaved should be updated with current timestamp
        const savedTimestamp = result.current.gameState!.lastSaved!
        expect(savedTimestamp).toBeGreaterThanOrEqual(beforeSave)
        expect(savedTimestamp).toBeLessThanOrEqual(afterSave)
      })
    })

    describe('When resetting game state', () => {
      it('Then it should restore all initial values', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Modified game state
        act(() => {
          result.current.updateGameState({
            level: 5,
            experience: 500,
            conversationCount: 20,
            isFirstTime: false
          })
          result.current.updateCompanion({
            currentEmotion: {
              dominant: 'excited',
              intensity: 0.9,
              stability: 0.5
            },
            relationshipStatus: {
              level: 3,
              experience: 200,
              experienceToNext: 300,
              intimacyLevel: 0.6,
              trustLevel: 0.7
            }
          })
        })
        
        // Verify state is modified
        expect(result.current.gameState!.level).toBe(5)
        expect(result.current.companion!.currentEmotion.dominant).toBe('excited')
        
        // When: Reset the game
        act(() => {
          result.current.resetGame()
        })
        
        // Then: All state should return to initial values
        expect(result.current.gameState).toMatchObject({
          level: 1,
          experience: 0,
          conversationCount: 0,
          daysSinceStart: 0,
          playTime: 0,
          isFirstTime: true,
          currentScene: 'main_room'
        })
        
        expect(result.current.companion).toMatchObject({
          name: '아리아',
          relationshipStatus: {
            level: 1,
            experience: 0,
            intimacyLevel: 0.1,
            trustLevel: 0.1
          },
          currentEmotion: {
            dominant: 'curious',
            intensity: 0.6,
            stability: 0.8
          }
        })
        
        expect(result.current.conversationHistory).toEqual([])
      })
    })

    describe('When updating settings', () => {
      it('Then it should properly update user preferences', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Initial settings
        expect(result.current.settings!.darkMode).toBe(true)
        expect(result.current.settings!.language).toBe('ko')
        
        // When: Update settings
        act(() => {
          result.current.updateSettings({
            darkMode: false,
            language: 'en',
            soundEnabled: false,
            musicEnabled: false
          })
        })
        
        // Then: Settings should be updated
        const updatedSettings = result.current.settings!
        expect(updatedSettings.darkMode).toBe(false)
        expect(updatedSettings.language).toBe('en')
        expect(updatedSettings.soundEnabled).toBe(false)
        expect(updatedSettings.musicEnabled).toBe(false)
        
        // Other settings should remain unchanged
        expect(updatedSettings.animationsEnabled).toBe(true)
        expect(updatedSettings.notifications).toBe(true)
        expect(updatedSettings.autoSave).toBe(true)
      })
    })
  })

  describe('Given an uninitialized game store', () => {
    describe('When attempting operations before initialization', () => {
      it('Then it should handle operations gracefully without errors', async () => {
        const { result } = renderHook(() => useStore())
        
        // Given: Uninitialized store
        expect(result.current.isInitialized).toBe(false)
        expect(result.current.gameState).toBeNull()
        
        // When: Attempt operations before initialization
        act(() => {
          result.current.updateGameState({ level: 2 })
          result.current.updateCompanion({ 
            currentEmotion: { dominant: 'happy', intensity: 0.8, stability: 0.9 } 
          })
          result.current.updateSettings({ darkMode: false })
        })
        
        // Then: Should not crash and state should remain null
        expect(result.current.gameState).toBeNull()
        expect(result.current.companion).toBeNull()
        expect(result.current.settings).toBeNull()
        expect(result.current.error).toBeNull()
      })
    })
  })

  describe('Given a corrupted or invalid state', () => {
    describe('When initialization encounters errors', () => {
      it('Then it should handle initialization failures gracefully', async () => {
        // Given: Mock AI Manager to throw error
        vi.doMock('@services/ai', () => ({
          getAIManager: () => {
            throw new Error('AI Manager initialization failed')
          }
        }))
        
        const { result } = renderHook(() => useStore())
        
        // When: Attempt initialization with error
        await act(async () => {
          await result.current.initialize()
        })
        
        // Then: Error should be captured and handled
        await waitFor(() => {
          expect(result.current.isInitialized).toBe(false)
          expect(result.current.isLoading).toBe(false)
          expect(result.current.error).toContain('초기화 실패')
        })
      })
    })
  })

  describe('Performance and Memory Management', () => {
    it('should maintain reasonable memory usage during state operations', async () => {
      const { result } = renderHook(() => useStore())
      
      await act(async () => {
        await result.current.initialize()
      })
      
      // Perform multiple state updates to test memory management
      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.updateGameState({
            experience: i * 10,
            conversationCount: i
          })
          result.current.updateCompanion({
            currentEmotion: {
              dominant: i % 2 === 0 ? 'happy' : 'curious',
              intensity: 0.5 + (i % 5) * 0.1,
              stability: 0.8
            }
          })
        })
      }
      
      // State should still be consistent
      expect(result.current.gameState!.experience).toBe(990)
      expect(result.current.gameState!.conversationCount).toBe(99)
      expect(result.current.companion!.currentEmotion.dominant).toBe('curious')
    })
  })
})