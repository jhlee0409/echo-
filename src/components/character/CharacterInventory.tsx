/**
 * 🎒 Character Inventory Component - Virtual Item Management
 * 
 * Features:
 * - Memory artifacts collection
 * - Emotional tokens system
 * - Achievement badges
 * - Relationship gifts exchange
 * - Special moments preservation
 */

import { FC, useState, useEffect } from 'react'
import { AdvancedAICompanion, SignificantEvent, EmotionalMemory } from '@services/character/AdvancedCharacterSystem'
import type { EmotionType } from '@types'

interface CharacterInventoryProps {
  character: AdvancedAICompanion
  onItemSelect?: (item: InventoryItem) => void
  className?: string
}

interface InventoryItem {
  id: string
  name: string
  description: string
  type: 'memory_artifact' | 'emotion_token' | 'achievement_badge' | 'gift' | 'milestone_trophy'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  icon: string
  dateAcquired: Date
  metadata?: any
}

interface InventoryCategory {
  id: string
  name: string
  icon: string
  count: number
  items: InventoryItem[]
}

const CharacterInventory: FC<CharacterInventoryProps> = ({
  character,
  onItemSelect,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])

  useEffect(() => {
    generateInventoryFromCharacter()
  }, [character])

  const generateInventoryFromCharacter = () => {
    const items: InventoryItem[] = []

    // Generate memory artifacts from significant events
    character.memory.longTerm.forEach(event => {
      items.push({
        id: `memory_${event.id}`,
        name: event.title,
        description: event.description,
        type: 'memory_artifact',
        rarity: getRarityFromSignificance(event.emotionalImpact),
        icon: getEventIcon(event),
        dateAcquired: event.timestamp,
        metadata: { originalEvent: event }
      })
    })

    // Generate emotion tokens from emotional memories
    character.memory.emotional
      .filter(emotion => emotion.intensity > 0.7)
      .forEach(emotion => {
        items.push({
          id: `emotion_${emotion.id}`,
          name: `${getEmotionKorean(emotion.emotion)} 토큰`,
          description: emotion.context,
          type: 'emotion_token',
          rarity: getRarityFromIntensity(emotion.intensity),
          icon: getEmotionIcon(emotion.emotion),
          dateAcquired: emotion.timestamp,
          metadata: { originalEmotion: emotion }
        })
      })

    // Generate achievement badges
    const achievements = getAchievements(character)
    achievements.filter(a => a.achieved).forEach(achievement => {
      items.push({
        id: `badge_${achievement.id}`,
        name: achievement.title,
        description: achievement.description,
        type: 'achievement_badge',
        rarity: 'epic',
        icon: achievement.icon,
        dateAcquired: new Date(), // Would be actual achievement date
        metadata: { achievement }
      })
    })

    // Generate milestone trophies
    character.relationship.specialMoments.forEach(milestone => {
      items.push({
        id: `trophy_${milestone.id}`,
        name: milestone.title,
        description: milestone.description,
        type: 'milestone_trophy',
        rarity: getRarityFromSignificance(milestone.significance),
        icon: getMilestoneIcon(milestone.milestoneType),
        dateAcquired: milestone.achievedAt,
        metadata: { milestone }
      })
    })

    // Generate special gifts (preferences that show deep understanding)
    character.memory.preferences
      .filter(pref => pref.confidence > 0.8)
      .slice(0, 5)
      .forEach(pref => {
        items.push({
          id: `gift_${pref.id}`,
          name: `${pref.category} 선물`,
          description: `당신이 좋아하는 ${pref.preference}`,
          type: 'gift',
          rarity: 'rare',
          icon: getGiftIcon(pref.category),
          dateAcquired: pref.lastConfirmed,
          metadata: { preference: pref }
        })
      })

    setInventory(items.sort((a, b) => b.dateAcquired.getTime() - a.dateAcquired.getTime()))
  }

  const categories: InventoryCategory[] = [
    {
      id: 'all',
      name: '전체',
      icon: '🎒',
      count: inventory.length,
      items: inventory
    },
    {
      id: 'memory_artifact',
      name: '기억 유물',
      icon: '📜',
      count: inventory.filter(i => i.type === 'memory_artifact').length,
      items: inventory.filter(i => i.type === 'memory_artifact')
    },
    {
      id: 'emotion_token',
      name: '감정 토큰',
      icon: '💎',
      count: inventory.filter(i => i.type === 'emotion_token').length,
      items: inventory.filter(i => i.type === 'emotion_token')
    },
    {
      id: 'achievement_badge',
      name: '성과 배지',
      icon: '🏆',
      count: inventory.filter(i => i.type === 'achievement_badge').length,
      items: inventory.filter(i => i.type === 'achievement_badge')
    },
    {
      id: 'milestone_trophy',
      name: '이정표 트로피',
      icon: '🥇',
      count: inventory.filter(i => i.type === 'milestone_trophy').length,
      items: inventory.filter(i => i.type === 'milestone_trophy')
    },
    {
      id: 'gift',
      name: '선물',
      icon: '🎁',
      count: inventory.filter(i => i.type === 'gift').length,
      items: inventory.filter(i => i.type === 'gift')
    }
  ]

  const selectedCategoryData = categories.find(c => c.id === selectedCategory) || categories[0]

  return (
    <div className={`bg-dark-surface rounded-xl border border-ui-border-100 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-ui-border-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-ui-text-100 flex items-center space-x-2">
              <span>🎒</span>
              <span>인벤토리</span>
            </h3>
            <p className="text-sm text-ui-text-300">
              {character.name}님과의 특별한 순간들
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-neon-blue">{inventory.length}</p>
            <p className="text-xs text-ui-text-400">보관 아이템</p>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Category Sidebar */}
        <div className="w-64 border-r border-ui-border-200 bg-ui-surface-50">
          <div className="p-4">
            <h4 className="text-sm font-medium text-ui-text-200 mb-3">카테고리</h4>
            <div className="space-y-1">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue'
                      : 'hover:bg-ui-surface-100 text-ui-text-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{category.icon}</span>
                    <span className="text-sm">{category.name}</span>
                  </div>
                  <span className="text-xs bg-ui-surface-200 px-2 py-1 rounded">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Item Grid */}
        <div className="flex-1 p-6">
          {selectedCategoryData.items.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {selectedCategoryData.items.map(item => (
                <InventoryItemCard
                  key={item.id}
                  item={item}
                  isSelected={selectedItem?.id === item.id}
                  onClick={(item) => {
                    setSelectedItem(item)
                    onItemSelect?.(item)
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="text-4xl mb-4">📦</span>
              <p className="text-ui-text-300 text-center">
                이 카테고리에는 아직 아이템이 없습니다
              </p>
              <p className="text-sm text-ui-text-400 text-center mt-2">
                {character.name}님과 더 많은 시간을 보내면 특별한 아이템들이 생겨날 거예요!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}

// Inventory Item Card Component
const InventoryItemCard: FC<{
  item: InventoryItem
  isSelected: boolean
  onClick: (item: InventoryItem) => void
}> = ({ item, isSelected, onClick }) => {
  const rarityColors = {
    common: 'from-gray-500/20 to-gray-500/10 border-gray-500/30',
    rare: 'from-blue-500/20 to-blue-500/10 border-blue-500/30',
    epic: 'from-purple-500/20 to-purple-500/10 border-purple-500/30',
    legendary: 'from-yellow-500/20 to-yellow-500/10 border-yellow-500/30'
  }

  const rarityLabels = {
    common: '일반',
    rare: '희귀',
    epic: '영웅',
    legendary: '전설'
  }

  return (
    <button
      onClick={() => onClick(item)}
      className={`bg-gradient-to-br ${rarityColors[item.rarity]} border rounded-lg p-4 text-left transition-all hover:scale-105 ${
        isSelected ? 'ring-2 ring-neon-blue' : ''
      }`}
    >
      <div className="space-y-3">
        {/* Icon */}
        <div className="flex items-center justify-between">
          <span className="text-2xl">{item.icon}</span>
          <span className={`text-xs px-2 py-1 rounded ${
            item.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400' :
            item.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' :
            item.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {rarityLabels[item.rarity]}
          </span>
        </div>

        {/* Name */}
        <div>
          <p className="text-sm font-medium text-ui-text-100 line-clamp-2">
            {item.name}
          </p>
          <p className="text-xs text-ui-text-400 mt-1">
            {item.dateAcquired.toLocaleDateString('ko-KR')}
          </p>
        </div>

        {/* Description Preview */}
        <p className="text-xs text-ui-text-300 line-clamp-2">
          {item.description}
        </p>
      </div>
    </button>
  )
}

// Item Detail Modal Component
const ItemDetailModal: FC<{
  item: InventoryItem
  onClose: () => void
}> = ({ item, onClose }) => {
  const rarityColors = {
    common: 'border-gray-500/50',
    rare: 'border-blue-500/50',
    epic: 'border-purple-500/50',
    legendary: 'border-yellow-500/50'
  }

  const typeLabels = {
    memory_artifact: '기억 유물',
    emotion_token: '감정 토큰',
    achievement_badge: '성과 배지',
    milestone_trophy: '이정표 트로피',
    gift: '선물'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-dark-surface rounded-xl border-2 ${rarityColors[item.rarity]} max-w-md w-full max-h-96 overflow-y-auto`}>
        {/* Header */}
        <div className="p-6 border-b border-ui-border-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <span className="text-4xl">{item.icon}</span>
              <div>
                <h3 className="text-lg font-bold text-ui-text-100">{item.name}</h3>
                <p className="text-sm text-ui-text-300">{typeLabels[item.type]}</p>
                <p className="text-xs text-ui-text-400">
                  {item.dateAcquired.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-ui-text-400 hover:text-ui-text-100"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <h4 className="font-medium text-ui-text-100 mb-2">설명</h4>
            <p className="text-sm text-ui-text-300">{item.description}</p>
          </div>

          {/* Type-specific content */}
          {item.type === 'memory_artifact' && item.metadata?.originalEvent && (
            <MemoryArtifactDetails event={item.metadata.originalEvent} />
          )}

          {item.type === 'emotion_token' && item.metadata?.originalEmotion && (
            <EmotionTokenDetails emotion={item.metadata.originalEmotion} />
          )}

          {item.type === 'milestone_trophy' && item.metadata?.milestone && (
            <MilestoneTrophyDetails milestone={item.metadata.milestone} />
          )}

          {item.type === 'gift' && item.metadata?.preference && (
            <GiftDetails preference={item.metadata.preference} />
          )}
        </div>
      </div>
    </div>
  )
}

// Type-specific detail components
const MemoryArtifactDetails: FC<{ event: SignificantEvent }> = ({ event }) => (
  <div>
    <h4 className="font-medium text-ui-text-100 mb-2">기억 세부사항</h4>
    <div className="bg-ui-surface-100 rounded-lg p-3 space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-ui-text-300">이벤트 유형</span>
        <span className="text-ui-text-100">{getEventTypeKorean(event.eventType)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-ui-text-300">감정적 임팩트</span>
        <span className="text-neon-blue">{Math.round(event.emotionalImpact * 100)}%</span>
      </div>
      {event.relationshipChange !== 0 && (
        <div className="flex justify-between">
          <span className="text-ui-text-300">관계 변화</span>
          <span className={event.relationshipChange > 0 ? 'text-neon-green' : 'text-red-400'}>
            {event.relationshipChange > 0 ? '+' : ''}{Math.round(event.relationshipChange * 100)}%
          </span>
        </div>
      )}
    </div>
  </div>
)

const EmotionTokenDetails: FC<{ emotion: EmotionalMemory }> = ({ emotion }) => (
  <div>
    <h4 className="font-medium text-ui-text-100 mb-2">감정 세부사항</h4>
    <div className="bg-ui-surface-100 rounded-lg p-3 space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-ui-text-300">감정 강도</span>
        <span className="text-neon-purple">{Math.round(emotion.intensity * 100)}%</span>
      </div>
      <div className="flex justify-between">
        <span className="text-ui-text-300">영향도</span>
        <span className="text-neon-blue">{Math.round(emotion.impact * 100)}%</span>
      </div>
      {emotion.userReaction && (
        <div>
          <span className="text-ui-text-300">사용자 반응</span>
          <p className="text-ui-text-100 mt-1">{emotion.userReaction}</p>
        </div>
      )}
    </div>
  </div>
)

const MilestoneTrophyDetails: FC<{ milestone: any }> = ({ milestone }) => (
  <div>
    <h4 className="font-medium text-ui-text-100 mb-2">이정표 세부사항</h4>
    <div className="bg-ui-surface-100 rounded-lg p-3 space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-ui-text-300">의미도</span>
        <span className="text-neon-gold">{Math.round(milestone.significance * 100)}%</span>
      </div>
      {milestone.commemorativeMessage && (
        <div>
          <span className="text-ui-text-300">기념 메시지</span>
          <p className="text-ui-text-100 mt-1 italic">"{milestone.commemorativeMessage}"</p>
        </div>
      )}
    </div>
  </div>
)

const GiftDetails: FC<{ preference: any }> = ({ preference }) => (
  <div>
    <h4 className="font-medium text-ui-text-100 mb-2">선물 세부사항</h4>
    <div className="bg-ui-surface-100 rounded-lg p-3 space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-ui-text-300">신뢰도</span>
        <span className="text-neon-green">{Math.round(preference.confidence * 100)}%</span>
      </div>
      <div className="flex justify-between">
        <span className="text-ui-text-300">중요도</span>
        <span className="text-neon-blue">{Math.round(preference.importance * 100)}%</span>
      </div>
      <div>
        <span className="text-ui-text-300">학습 근거</span>
        <p className="text-ui-text-100 mt-1">{preference.learnedFrom.length}회 대화에서 학습</p>
      </div>
    </div>
  </div>
)

// Helper Functions
const getRarityFromSignificance = (significance: number): 'common' | 'rare' | 'epic' | 'legendary' => {
  if (significance >= 0.9) return 'legendary'
  if (significance >= 0.7) return 'epic'
  if (significance >= 0.5) return 'rare'
  return 'common'
}

const getRarityFromIntensity = (intensity: number): 'common' | 'rare' | 'epic' | 'legendary' => {
  if (intensity >= 0.95) return 'legendary'
  if (intensity >= 0.85) return 'epic'
  if (intensity >= 0.75) return 'rare'
  return 'common'
}

const getEventIcon = (event: SignificantEvent): string => {
  const iconMap: Record<string, string> = {
    first_meeting: '👋',
    relationship_milestone: '💕',
    emotional_breakthrough: '💖',
    conflict_resolution: '🤝',
    shared_experience: '🌟',
    learning_moment: '💡',
    celebration: '🎉',
    support_given: '🤗'
  }
  return iconMap[event.eventType] || '📚'
}

const getEmotionIcon = (emotion: EmotionType): string => {
  const iconMap: Record<EmotionType, string> = {
    happy: '😊',
    excited: '🤩',
    sad: '😢',
    angry: '😠',
    confused: '🤔',
    surprised: '😲',
    calm: '😌',
    curious: '🤔',
    thoughtful: '🤓',
    playful: '😄',
    caring: '🥰',
    neutral: '😐'
  }
  return iconMap[emotion] || '💎'
}

const getMilestoneIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    relationship_level_up: '🏆',
    trust_breakthrough: '🤝',
    emotional_connection: '❤️',
    shared_secret: '🤫',
    difficult_conversation: '💪',
    celebration_together: '🎉'
  }
  return iconMap[type] || '🏆'
}

const getGiftIcon = (category: string): string => {
  const iconMap: Record<string, string> = {
    topics: '💭',
    communication_style: '💬',
    activities: '🎯',
    values: '⭐',
    interests: '🎨',
    boundaries: '🛡️'
  }
  return iconMap[category] || '🎁'
}

const getEmotionKorean = (emotion: EmotionType): string => {
  const emotionMap: Record<EmotionType, string> = {
    happy: '행복',
    excited: '신남',
    sad: '슬픔',
    angry: '화남',
    confused: '혼란',
    surprised: '놀람',
    calm: '평온',
    curious: '궁금',
    thoughtful: '사려깊음',
    playful: '장난스러움',
    caring: '걱정',
    neutral: '평온'
  }
  return emotionMap[emotion] || emotion
}

const getEventTypeKorean = (eventType: string): string => {
  const typeMap: Record<string, string> = {
    first_meeting: '첫 만남',
    relationship_milestone: '관계 이정표',
    emotional_breakthrough: '감정적 돌파구',
    conflict_resolution: '갈등 해결',
    shared_experience: '공유된 경험',
    learning_moment: '학습의 순간',
    celebration: '축하',
    support_given: '지지 제공'
  }
  return typeMap[eventType] || eventType
}

const getAchievements = (character: AdvancedAICompanion) => [
  {
    id: 'first_conversation',
    title: '첫 만남',
    description: '첫 대화를 나눴습니다',
    icon: '👋',
    achieved: character.relationship.totalInteractions > 0
  },
  {
    id: 'deep_conversation',
    title: '깊은 대화',
    description: '50회 대화를 나눴습니다',
    icon: '💬',
    achieved: character.relationship.totalInteractions >= 50
  },
  {
    id: 'emotional_connection',
    title: '감정적 유대',
    description: '친밀도 레벨 5에 도달했습니다',
    icon: '❤️',
    achieved: character.relationship.intimacyLevel >= 5
  },
  {
    id: 'trust_building',
    title: '신뢰 구축',
    description: '신뢰도 레벨 7에 도달했습니다',
    icon: '🤝',
    achieved: character.relationship.trustLevel >= 7
  }
]

export default CharacterInventory