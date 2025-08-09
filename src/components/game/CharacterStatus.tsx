import { FC, useState, useEffect } from 'react'
import { useGameStore } from '@hooks'
import { AdvancedCharacterManager, AdvancedAICompanion } from '@services/character/AdvancedCharacterSystem'
import CharacterProfile from '@components/character/CharacterProfile'
import CharacterStats from '@components/character/CharacterStats'
import CharacterInventory from '@components/character/CharacterInventory'

const CharacterStatus: FC = () => {
  const { companion, gameState } = useGameStore()
  const [advancedCharacter, setAdvancedCharacter] = useState<AdvancedAICompanion | null>(null)
  const [characterManager, setCharacterManager] = useState<AdvancedCharacterManager | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'inventory'>('profile')

  useEffect(() => {
    // Convert legacy companion to advanced character system
    if (companion && !advancedCharacter) {
      const advancedData: Partial<AdvancedAICompanion> = {
        id: companion.id || `companion_${Date.now()}`,
        name: companion.name,
        createdAt: new Date(companion.createdAt || Date.now()),
        lastInteraction: new Date(),
        
        // Map legacy relationship data
        relationship: {
          intimacyLevel: companion.relationshipStatus?.level || 1,
          trustLevel: companion.relationshipStatus?.level || 1,
          relationshipType: 'friend',
          conflictHistory: [],
          specialMoments: [],
          dailyInteractions: 0,
          totalInteractions: companion.relationshipStatus?.experience || 0
        },
        
        // Map legacy emotion data
        emotionalState: {
          currentEmotion: companion.currentEmotion?.dominant || 'happy',
          emotionIntensity: companion.currentEmotion?.intensity || 0.6,
          emotionHistory: [],
          triggers: [],
          stability: 0.7
        },
        
        // Map legacy personality traits
        personality: {
          core: {
            cheerful: companion.personalityTraits?.cheerful || 0.7,
            caring: companion.personalityTraits?.caring || 0.8,
            playful: companion.personalityTraits?.playful || 0.6,
            curious: companion.personalityTraits?.curious || 0.9,
            thoughtful: companion.personalityTraits?.thoughtful || 0.7,
            supportive: companion.personalityTraits?.supportive || 0.8,
            independent: companion.personalityTraits?.independent || 0.4,
            emotional: companion.personalityTraits?.emotional || 0.6,
            adaptability: 0.5,
            consistency: 0.7,
            authenticity: 0.9
          },
          current: {
            dominantMood: companion.currentEmotion?.dominant || 'happy',
            moodIntensity: companion.currentEmotion?.intensity || 0.6,
            moodDuration: 0,
            expectedDuration: 30,
            timeOfDay: getCurrentTimeOfDay(),
            dayOfWeek: new Date().getDay()
          },
          adaptation: {
            growthRate: 0.1,
            influenceFactors: [],
            personalityHistory: [],
            developmentStage: 'early',
            totalGrowthPoints: 0,
            recentGrowth: [],
            growthGoals: []
          }
        }
      }
      
      const manager = new AdvancedCharacterManager(advancedData)
      const character = manager.getCharacter()
      
      setAdvancedCharacter(character)
      setCharacterManager(manager)
    }
  }, [companion])

  const getCurrentTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date().getHours()
    if (hour < 6) return 'night'
    if (hour < 12) return 'morning' 
    if (hour < 18) return 'afternoon'
    return 'evening'
  }

  if (!companion || !advancedCharacter) {
    return (
      <div className="bg-dark-surface rounded-lg border border-ui-border-100 p-4">
        <div className="text-center text-ui-text-300">
          AI 컴패니언을 불러오는 중...
        </div>
      </div>
    )
  }

  const relationshipLevel = advancedCharacter.relationship.intimacyLevel
  const relationshipProgress = Math.min((advancedCharacter.relationship.totalInteractions / 100) * 100, 100)

  return (
    <div className="bg-dark-surface rounded-lg border border-ui-border-100 overflow-hidden">
      {/* Navigation Tabs */}
      <div className="flex border-b border-ui-border-200 bg-ui-surface-50">
        {(['profile', 'stats', 'inventory'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-neon-blue text-dark-navy border-b-2 border-neon-blue'
                : 'text-ui-text-300 hover:text-ui-text-100 hover:bg-ui-surface-100'
            }`}
          >
            {tab === 'profile' ? '프로필' : tab === 'stats' ? '통계' : '인벤토리'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'profile' && (
          <div className="p-4">
            <CharacterProfile 
              character={advancedCharacter} 
              showPrivacyControls={true}
              onCharacterUpdate={(updated) => {
                setAdvancedCharacter(updated)
                characterManager?.emit('characterUpdated', updated)
              }}
            />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="p-4">
            <CharacterStats 
              character={advancedCharacter} 
              showDetailed={true}
            />
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="p-4">
            <CharacterInventory 
              character={advancedCharacter}
              onItemSelect={(item) => {
                // Could emit event for game state or show item details
                console.log('Selected inventory item:', item)
              }}
            />
          </div>
        )}
      </div>

      {/* Quick Stats Footer */}
      <div className="border-t border-ui-border-200 bg-ui-surface-50 px-4 py-2">
        <div className="grid grid-cols-4 gap-4 text-center text-xs">
          <div>
            <p className="font-bold text-neon-blue">{Math.round(relationshipLevel)}</p>
            <p className="text-ui-text-400">친밀도</p>
          </div>
          <div>
            <p className="font-bold text-neon-purple">{Math.round(advancedCharacter.relationship.trustLevel)}</p>
            <p className="text-ui-text-400">신뢰도</p>
          </div>
          <div>
            <p className="font-bold text-neon-green">{advancedCharacter.relationship.totalInteractions}</p>
            <p className="text-ui-text-400">대화수</p>
          </div>
          <div>
            <p className="font-bold text-yellow-400">
              {Math.floor((Date.now() - advancedCharacter.createdAt.getTime()) / (1000 * 60 * 60 * 24))}
            </p>
            <p className="text-ui-text-400">함께한 일수</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function getMoodEmoji(emotion: string): string {
  const moodEmojis: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    excited: '🤩',
    calm: '😌',
    curious: '🤔',
    playful: '😄',
    thoughtful: '🤓',
    caring: '🥰',
    default: '😊'
  }
  
  return moodEmojis[emotion] || moodEmojis.default
}

export default CharacterStatus