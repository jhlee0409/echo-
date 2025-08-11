import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { AICompanion, GameState, Settings, Message, EmotionType } from '@types'
import { getAIManager } from '@services/ai'
import { ENV } from '@config/env'

interface GameStoreState {
  // Game state
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  gameState: GameState | null

  // AI Companion
  companion: AICompanion | null

  // Chat system
  conversationHistory: Message[]

  // Settings
  settings: Settings | null

  // Actions
  initialize: () => Promise<void>
  reset: () => void

  // Game state actions
  updateGameState: (updates: Partial<GameState>) => void
  saveGame: () => Promise<void>
  loadGame: () => Promise<void>
  resetGame: () => void

  // Companion actions
  updateCompanion: (updates: Partial<AICompanion>) => void

  // Chat actions
  sendMessage: (message: string) => Promise<void>
  addMessage: (message: Message) => void
  clearConversation: () => void

  // Settings actions
  updateSettings: (updates: Partial<Settings>) => void
}

// Initial companion data
const createInitialCompanion = (): AICompanion => ({
  id: 'companion_001',
  name: '아리아',
  avatar: '/avatars/aria.png',
  personalityTraits: {
    cheerful: 0.7,
    careful: 0.4,
    curious: 0.8,
    emotional: 0.6,
    independent: 0.3,
  },
  relationshipStatus: {
    level: 1,
    experience: 0,
    experienceToNext: 100,
    intimacyLevel: 0.1,
    trustLevel: 0.1,
  },
  currentEmotion: {
    dominant: 'curious',
    intensity: 0.6,
    stability: 0.8,
  },
  memoryBank: {
    shortTerm: [],
    longTerm: [],
    preferences: {},
    keyMoments: [],
  },
  conversationContext: {
    currentTopic: null,
    recentTopics: [],
    moodHistory: [],
    responseStyle: 'friendly',
  },
  gameProgress: {
    unlockedFeatures: ['basic_chat'],
    completedEvents: [],
    availableEvents: ['first_meeting'],
    relationshipMilestones: [],
  },
})

// Initial game state
const createInitialGameState = (): GameState => ({
  level: 1,
  experience: 0,
  conversationCount: 0,
  daysSinceStart: 0,
  playTime: 0,
  lastPlayed: Date.now(),
  lastSaved: null,
  isFirstTime: true,
  currentScene: 'main_room',
  unlockedFeatures: ['chat', 'status'],
  gameVersion: '1.0.0-alpha',
})

// Initial settings
const createInitialSettings = (): Settings => ({
  soundEnabled: true,
  musicEnabled: true,
  animationsEnabled: true,
  darkMode: true,
  language: 'ko',
  notifications: true,
  autoSave: true,
  debugMode: import.meta.env.DEV,
})

// Storage key
const STORAGE_KEY = 'soulmate-game-state'

export const useStore = create<GameStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        isInitialized: false,
        isLoading: false,
        error: null,
        gameState: null,
        companion: null,
        conversationHistory: [],
        settings: null,

        // Initialize the game
        initialize: async () => {
          set({ isLoading: true, error: null })

          try {
            // Create initial data if not exists
            const state = get()

            if (!state.gameState) {
              set({ gameState: createInitialGameState() })
            }

            if (!state.companion) {
              set({ companion: createInitialCompanion() })
            }

            if (!state.settings) {
              set({ settings: createInitialSettings() })
            }

            // Initialize AI Manager
            console.log('🤖 Initializing AI Manager...')
            const aiManager = getAIManager()

            // Check AI service health
            const isHealthy = await aiManager.isHealthy()
            console.log('🔍 AI Service Health Check:', {
              healthy: isHealthy,
              hasClaudeKey: !!ENV.CLAUDE_API_KEY,
              keyPrefix: ENV.CLAUDE_API_KEY?.substring(0, 12) + '...',
            })

            // Simulate initialization delay
            await new Promise(resolve => setTimeout(resolve, 1000))

            set({
              isInitialized: true,
              isLoading: false,
              error: null,
            })

            console.log('✅ Game initialized successfully')
            console.log('🎯 Claude API available:', !!ENV.CLAUDE_API_KEY)
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error'
            set({
              isLoading: false,
              error: `초기화 실패: ${errorMessage}`,
            })
            console.error('❌ Game initialization failed:', error)
          }
        },

        // Reset everything
        reset: () => {
          set({
            isInitialized: false,
            isLoading: false,
            error: null,
            gameState: null,
            companion: null,
            conversationHistory: [],
            settings: null,
          })
        },

        // Game state actions
        updateGameState: updates => {
          set(state => ({
            gameState: state.gameState
              ? { ...state.gameState, ...updates }
              : null,
          }))
        },

        saveGame: async () => {
          const state = get()
          if (state.gameState) {
            set(prevState => ({
              gameState: prevState.gameState
                ? {
                    ...prevState.gameState,
                    lastSaved: Date.now(),
                  }
                : null,
            }))
            console.log('💾 Game saved')
          }
        },

        loadGame: async () => {
          // In a real implementation, this would load from persistent storage
          console.log('📂 Game loaded')
        },

        resetGame: () => {
          set({
            gameState: createInitialGameState(),
            companion: createInitialCompanion(),
            conversationHistory: [],
            settings: createInitialSettings(),
          })
          console.log('🔄 Game reset')
        },

        // Companion actions
        updateCompanion: updates => {
          set(state => ({
            companion: state.companion
              ? { ...state.companion, ...updates }
              : null,
          }))
        },

        // Chat actions
        sendMessage: async message => {
          const state = get()
          if (!state.companion || state.isLoading) return

          set({ isLoading: true })

          const now = Date.now()
          const userMessage: Message = {
            id: `msg_${now}_user`,
            sender: 'user',
            content: message,
            timestamp: now,
          }
          // Append user message
          set(s => ({
            conversationHistory: [...s.conversationHistory, userMessage],
          }))

          // Helpers
          const buildContext = () => ({
            companionName: state.companion!.name,
            companionPersonality: state.companion!.personalityTraits,
            relationshipLevel: state.companion!.relationshipStatus.level,
            intimacyLevel: state.companion!.relationshipStatus.intimacyLevel,
            companionEmotion: state.companion!.currentEmotion.dominant,
            currentScene: state.gameState?.currentScene || 'main_room',
            recentTopics: state.companion!.conversationContext.recentTopics,
            timeOfDay: 'anytime',
          })

          const applyAIResponse = (
            content: string,
            emotion: EmotionType,
            provider: string,
            confidence: number,
            _tokensUsed: number
          ) => {
            const aiMsg: Message = {
              id: `msg_${Date.now()}_ai`,
              sender: 'ai',
              content,
              timestamp: Date.now(),
              emotion,
            }
            set(s => ({
              conversationHistory: [...s.conversationHistory, aiMsg],
              isLoading: false,
            }))

            if (emotion && emotion !== 'neutral') {
              get().updateCompanion({
                currentEmotion: {
                  dominant: emotion,
                  intensity: confidence,
                  stability: 0.8,
                },
              })
            }

            const updatedTopics = [
              ...state.companion!.conversationContext.recentTopics.slice(-4),
              message.substring(0, 50),
            ]
            get().updateCompanion({
              conversationContext: {
                ...state.companion!.conversationContext,
                recentTopics: updatedTopics,
                moodHistory: [
                  ...state.companion!.conversationContext.moodHistory.slice(-9),
                  emotion,
                ],
              },
            })

            const expGain = provider === 'claude' ? 15 : 10
            get().updateGameState({
              conversationCount: (state.gameState?.conversationCount || 0) + 1,
              experience: (state.gameState?.experience || 0) + expGain,
            })
          }

          const applyFallback = () => {
            const fallback = generateMockAIResponse(message, state.companion!)
            const aiMsg: Message = {
              id: `msg_${Date.now()}_ai`,
              sender: 'ai',
              content: fallback.content,
              timestamp: Date.now(),
              emotion: fallback.emotion,
            }
            set(s => ({
              conversationHistory: [...s.conversationHistory, aiMsg],
              isLoading: false,
              error: 'AI 서비스 일시 장애 - Mock 응답으로 대체됨',
            }))
            setTimeout(() => set(s => ({ ...s, error: null })), 3000)
            get().updateGameState({
              conversationCount: (state.gameState?.conversationCount || 0) + 1,
              experience: (state.gameState?.experience || 0) + 5,
            })
          }

          try {
            const aiManager = getAIManager()
            const aiRequest = {
              messages: [{ role: 'user' as const, content: message }],
              context: buildContext(),
              options: { maxTokens: 150, temperature: 0.7 },
            }
            console.log('🤖 Sending request to AI service...')
            const aiResponse = await aiManager.generateResponse(
              aiRequest as any
            )
            console.log(
              `✅ AI Response received from ${aiResponse.provider}:`,
              {
                provider: aiResponse.provider,
                tokensUsed: aiResponse.tokensUsed,
                cached: aiResponse.cached,
                confidence: aiResponse.confidence,
              }
            )
            applyAIResponse(
              aiResponse.content,
              aiResponse.emotion,
              aiResponse.provider,
              aiResponse.confidence,
              aiResponse.tokensUsed
            )
          } catch (error) {
            console.error('❌ AI service error:', error)
            applyFallback()
          }
        },

        addMessage: message => {
          set(state => ({
            conversationHistory: [...state.conversationHistory, message],
          }))
        },

        clearConversation: () => {
          set({ conversationHistory: [] })
        },

        // Settings actions
        updateSettings: updates => {
          set(state => ({
            settings: state.settings ? { ...state.settings, ...updates } : null,
          }))
        },
      }),
      {
        name: STORAGE_KEY,
        partialize: state => ({
          gameState: state.gameState,
          companion: state.companion,
          conversationHistory: state.conversationHistory,
          settings: state.settings,
        }),
      }
    ),
    { name: 'soulmate-store' }
  )
)

// Helper functions
function generateMockAIResponse(
  userMessage: string,
  companion: AICompanion
): { content: string; emotion: EmotionType } {
  const responses: { content: string; emotion: EmotionType }[] = [
    {
      content: `안녕! 나는 ${companion.name}이야. ${userMessage}에 대해 더 이야기해볼까?`,
      emotion: 'happy',
    },
    {
      content: `흥미로운 말이네! 나도 그런 생각을 해본 적이 있어. 너는 어떻게 생각해?`,
      emotion: 'curious',
    },
    {
      content: `정말? 그것도 좋은 생각이야. 나는 너와 이야기하는 것이 즐거워!`,
      emotion: 'excited',
    },
    {
      content: `음... 그런 면도 있겠네. 나는 이런 대화가 참 좋아. 너도 그렇지?`,
      emotion: 'thoughtful',
    },
  ]

  return responses[Math.floor(Math.random() * responses.length)]
}
