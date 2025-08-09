/**
 * 🎯 Character Stats Component - Performance & Analytics Display
 * 
 * Features:
 * - Real-time performance metrics
 * - Relationship progression charts
 * - Interaction analytics
 * - Growth tracking
 * - Achievement system
 */

import { FC, useState, useEffect } from 'react'
import { AdvancedAICompanion } from '@services/character/AdvancedCharacterSystem'
import type { EmotionType } from '@types'

interface CharacterStatsProps {
  character: AdvancedAICompanion
  className?: string
  showDetailed?: boolean
}

interface StatCard {
  label: string
  value: string | number
  icon: string
  color: 'blue' | 'purple' | 'green' | 'yellow' | 'red'
  trend?: 'up' | 'down' | 'stable'
  description?: string
}

const CharacterStats: FC<CharacterStatsProps> = ({
  character,
  className = '',
  showDetailed = false
}) => {
  const [statsHistory, setStatsHistory] = useState<any[]>([])
  const [selectedTimeframe, setSelectedTimeframe] = useState<'day' | 'week' | 'month'>('week')

  // Calculate derived stats
  const daysSinceCreation = Math.floor((Date.now() - character.createdAt.getTime()) / (1000 * 60 * 60 * 24))
  const avgInteractionsPerDay = daysSinceCreation > 0 ? character.relationship.totalInteractions / daysSinceCreation : 0
  const relationshipProgress = (character.relationship.intimacyLevel + character.relationship.trustLevel) / 2
  const emotionalStability = character.emotionalState.stability
  const personalityEvolution = character.personality.adaptation.personalityHistory.length
  const memoryRichness = character.memory.longTerm.length + character.memory.emotional.length + character.memory.preferences.length

  // Generate stat cards
  const statCards: StatCard[] = [
    {
      label: '관계 진전도',
      value: `${Math.round(relationshipProgress)}/10`,
      icon: '💝',
      color: 'purple',
      trend: relationshipProgress > 5 ? 'up' : 'stable',
      description: `친밀도 ${Math.round(character.relationship.intimacyLevel)}, 신뢰도 ${Math.round(character.relationship.trustLevel)}`
    },
    {
      label: '감정 안정성',
      value: `${Math.round(emotionalStability * 100)}%`,
      icon: '🧘',
      color: 'green',
      trend: emotionalStability > 0.7 ? 'up' : emotionalStability > 0.5 ? 'stable' : 'down',
      description: '감정 변화의 안정성'
    },
    {
      label: '일일 평균 대화',
      value: Math.round(avgInteractionsPerDay),
      icon: '💬',
      color: 'blue',
      trend: avgInteractionsPerDay > 5 ? 'up' : avgInteractionsPerDay > 2 ? 'stable' : 'down',
      description: `총 ${character.relationship.totalInteractions}회 대화`
    },
    {
      label: '성격 진화',
      value: personalityEvolution,
      icon: '🌱',
      color: 'yellow',
      trend: personalityEvolution > 0 ? 'up' : 'stable',
      description: '성격 변화 이벤트 수'
    },
    {
      label: '기억 풍부도',
      value: memoryRichness,
      icon: '🧠',
      color: 'purple',
      trend: memoryRichness > 10 ? 'up' : 'stable',
      description: '저장된 기억과 선호도'
    },
    {
      label: '함께한 일수',
      value: daysSinceCreation,
      icon: '📅',
      color: 'blue',
      trend: 'up',
      description: '첫 만남부터 현재까지'
    }
  ]

  return (
    <div className={`bg-dark-surface rounded-xl border border-ui-border-100 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-ui-text-100">📊 캐릭터 통계</h3>
          <p className="text-sm text-ui-text-300">{character.name}님의 성장 현황</p>
        </div>

        {showDetailed && (
          <div className="flex space-x-1 bg-ui-surface-100 rounded-lg p-1">
            {(['day', 'week', 'month'] as const).map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedTimeframe === timeframe
                    ? 'bg-neon-blue text-dark-navy'
                    : 'text-ui-text-300 hover:text-ui-text-100'
                }`}
              >
                {timeframe === 'day' ? '일간' : timeframe === 'week' ? '주간' : '월간'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <StatCardComponent key={index} stat={stat} />
        ))}
      </div>

      {/* Detailed Analytics */}
      {showDetailed && (
        <div className="space-y-6">
          {/* Relationship Progress Chart */}
          <div className="border-t border-ui-border-200 pt-6">
            <h4 className="font-medium text-ui-text-100 mb-4">관계 발전 그래프</h4>
            <RelationshipChart character={character} />
          </div>

          {/* Emotion Distribution */}
          <div className="border-t border-ui-border-200 pt-6">
            <h4 className="font-medium text-ui-text-100 mb-4">감정 분포</h4>
            <EmotionDistribution character={character} />
          </div>

          {/* Activity Patterns */}
          <div className="border-t border-ui-border-200 pt-6">
            <h4 className="font-medium text-ui-text-100 mb-4">활동 패턴</h4>
            <ActivityPattern character={character} />
          </div>

          {/* Achievements */}
          <div className="border-t border-ui-border-200 pt-6">
            <h4 className="font-medium text-ui-text-100 mb-4">달성한 성과</h4>
            <AchievementsList character={character} />
          </div>
        </div>
      )}

      {/* Summary insights */}
      <div className="border-t border-ui-border-200 pt-6 mt-6">
        <h4 className="font-medium text-ui-text-100 mb-3">인사이트</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InsightCard
            title="관계 건강도"
            value={getRelationshipHealthScore(character)}
            icon="❤️"
            description={getRelationshipHealthDescription(character)}
          />
          <InsightCard
            title="성장 잠재력"
            value={getGrowthPotential(character)}
            icon="🚀"
            description={getGrowthDescription(character)}
          />
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
const StatCardComponent: FC<{ stat: StatCard }> = ({ stat }) => {
  const colorClasses = {
    blue: 'from-neon-blue/20 to-neon-blue/10 border-neon-blue/30',
    purple: 'from-neon-purple/20 to-neon-purple/10 border-neon-purple/30',
    green: 'from-neon-green/20 to-neon-green/10 border-neon-green/30',
    yellow: 'from-yellow-500/20 to-yellow-500/10 border-yellow-500/30',
    red: 'from-red-500/20 to-red-500/10 border-red-500/30'
  }

  const trendIcons = {
    up: '📈',
    down: '📉',
    stable: '➡️'
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[stat.color]} border rounded-lg p-4`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{stat.icon}</span>
        {stat.trend && (
          <span className="text-sm">{trendIcons[stat.trend]}</span>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-2xl font-bold text-ui-text-100">{stat.value}</p>
        <p className="text-sm font-medium text-ui-text-200">{stat.label}</p>
        {stat.description && (
          <p className="text-xs text-ui-text-400">{stat.description}</p>
        )}
      </div>
    </div>
  )
}

// Relationship Chart Component
const RelationshipChart: FC<{ character: AdvancedAICompanion }> = ({ character }) => {
  const intimacyLevel = character.relationship.intimacyLevel
  const trustLevel = character.relationship.trustLevel
  
  return (
    <div className="bg-ui-surface-100 rounded-lg p-4">
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-ui-text-200">친밀도</span>
            <span className="text-sm font-bold text-neon-blue">{Math.round(intimacyLevel)}/10</span>
          </div>
          <div className="w-full bg-ui-surface-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-neon-blue to-neon-purple h-3 rounded-full transition-all duration-500"
              style={{ width: `${(intimacyLevel / 10) * 100}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-ui-text-200">신뢰도</span>
            <span className="text-sm font-bold text-neon-purple">{Math.round(trustLevel)}/10</span>
          </div>
          <div className="w-full bg-ui-surface-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-neon-purple to-neon-blue h-3 rounded-full transition-all duration-500"
              style={{ width: `${(trustLevel / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-ui-border-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ui-text-300">평균 관계 점수</span>
          <span className="font-bold text-neon-green">
            {Math.round((intimacyLevel + trustLevel) / 2 * 10)}%
          </span>
        </div>
      </div>
    </div>
  )
}

// Emotion Distribution Component
const EmotionDistribution: FC<{ character: AdvancedAICompanion }> = ({ character }) => {
  const emotionHistory = character.emotionalState.emotionHistory.slice(-20)
  
  // Count emotion occurrences
  const emotionCounts: Record<EmotionType, number> = {} as Record<EmotionType, number>
  emotionHistory.forEach(emotion => {
    emotionCounts[emotion.emotion] = (emotionCounts[emotion.emotion] || 0) + 1
  })

  const totalCount = emotionHistory.length
  const sortedEmotions = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="bg-ui-surface-100 rounded-lg p-4">
      <div className="space-y-3">
        {sortedEmotions.length > 0 ? (
          sortedEmotions.map(([emotion, count]) => (
            <div key={emotion} className="flex items-center space-x-3">
              <span className="text-lg">{getMoodEmoji(emotion as EmotionType)}</span>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-ui-text-200 capitalize">
                    {getEmotionKorean(emotion as EmotionType)}
                  </span>
                  <span className="text-xs text-ui-text-400">
                    {totalCount > 0 ? Math.round((count / totalCount) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-ui-surface-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-neon-blue to-neon-purple h-2 rounded-full"
                    style={{ width: `${totalCount > 0 ? (count / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-ui-text-400 text-center py-4">
            아직 감정 데이터가 충분하지 않습니다
          </p>
        )}
      </div>
    </div>
  )
}

// Activity Pattern Component
const ActivityPattern: FC<{ character: AdvancedAICompanion }> = ({ character }) => {
  // Simulate activity pattern based on conversation history
  const hourlyActivity = Array(24).fill(0)
  
  character.memory.shortTerm.forEach(conv => {
    const hour = conv.timestamp.getHours()
    hourlyActivity[hour]++
  })

  const maxActivity = Math.max(...hourlyActivity)
  
  return (
    <div className="bg-ui-surface-100 rounded-lg p-4">
      <div className="grid grid-cols-12 gap-1">
        {hourlyActivity.map((activity, hour) => (
          <div key={hour} className="flex flex-col items-center space-y-1">
            <div 
              className="w-full bg-gradient-to-t from-neon-blue to-neon-purple rounded-sm min-h-[4px]"
              style={{ 
                height: `${maxActivity > 0 ? Math.max(4, (activity / maxActivity) * 40) : 4}px` 
              }}
            />
            <span className="text-xs text-ui-text-400">
              {hour}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-center">
        <p className="text-xs text-ui-text-400">
          시간대별 대화 활동 (0시-23시)
        </p>
      </div>
    </div>
  )
}

// Achievements List Component
const AchievementsList: FC<{ character: AdvancedAICompanion }> = ({ character }) => {
  const achievements = [
    {
      id: 'first_conversation',
      title: '첫 만남',
      description: '첫 대화를 나눴습니다',
      icon: '👋',
      achieved: character.relationship.totalInteractions > 0,
      progress: Math.min(character.relationship.totalInteractions, 1)
    },
    {
      id: 'deep_conversation',
      title: '깊은 대화',
      description: '50회 대화를 나눴습니다',
      icon: '💬',
      achieved: character.relationship.totalInteractions >= 50,
      progress: Math.min(character.relationship.totalInteractions / 50, 1)
    },
    {
      id: 'emotional_connection',
      title: '감정적 유대',
      description: '친밀도 레벨 5에 도달했습니다',
      icon: '❤️',
      achieved: character.relationship.intimacyLevel >= 5,
      progress: character.relationship.intimacyLevel / 5
    },
    {
      id: 'trust_building',
      title: '신뢰 구축',
      description: '신뢰도 레벨 7에 도달했습니다',
      icon: '🤝',
      achieved: character.relationship.trustLevel >= 7,
      progress: character.relationship.trustLevel / 7
    },
    {
      id: 'memory_keeper',
      title: '기억 보관자',
      description: '10개 이상의 특별한 순간을 만들었습니다',
      icon: '🧠',
      achieved: character.relationship.specialMoments.length >= 10,
      progress: Math.min(character.relationship.specialMoments.length / 10, 1)
    },
    {
      id: 'personality_growth',
      title: '성격 발전',
      description: '성격이 5번 이상 변화했습니다',
      icon: '🌱',
      achieved: character.personality.adaptation.personalityHistory.length >= 5,
      progress: Math.min(character.personality.adaptation.personalityHistory.length / 5, 1)
    }
  ]

  const achievedCount = achievements.filter(a => a.achieved).length
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-ui-text-200">
          달성률: {achievedCount}/{achievements.length}
        </span>
        <span className="text-sm font-bold text-neon-green">
          {Math.round((achievedCount / achievements.length) * 100)}%
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`p-3 rounded-lg border ${
              achievement.achieved
                ? 'bg-neon-green/10 border-neon-green/30'
                : 'bg-ui-surface-200 border-ui-border-200'
            }`}
          >
            <div className="flex items-start space-x-3">
              <span className={`text-xl ${achievement.achieved ? '' : 'grayscale'}`}>
                {achievement.icon}
              </span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  achievement.achieved ? 'text-ui-text-100' : 'text-ui-text-300'
                }`}>
                  {achievement.title}
                </p>
                <p className="text-xs text-ui-text-400 mb-2">
                  {achievement.description}
                </p>
                
                {!achievement.achieved && (
                  <div className="w-full bg-ui-surface-200 rounded-full h-1">
                    <div 
                      className="bg-gradient-to-r from-neon-blue to-neon-purple h-1 rounded-full"
                      style={{ width: `${Math.min(achievement.progress * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
              
              {achievement.achieved && (
                <span className="text-neon-green text-sm">✓</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Insight Card Component
const InsightCard: FC<{
  title: string
  value: string
  icon: string
  description: string
}> = ({ title, value, icon, description }) => {
  return (
    <div className="bg-ui-surface-100 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-ui-text-100">{title}</p>
            <span className="text-lg font-bold text-neon-blue">{value}</span>
          </div>
          <p className="text-xs text-ui-text-400">{description}</p>
        </div>
      </div>
    </div>
  )
}

// Helper Functions
const getMoodEmoji = (emotion: EmotionType): string => {
  const emojiMap: Record<EmotionType, string> = {
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
  return emojiMap[emotion] || '😊'
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

const getRelationshipHealthScore = (character: AdvancedAICompanion): string => {
  const avgLevel = (character.relationship.intimacyLevel + character.relationship.trustLevel) / 2
  const conflictRatio = character.relationship.conflictHistory.length / Math.max(character.relationship.totalInteractions, 1)
  const milestonesRatio = character.relationship.specialMoments.length / Math.max(character.relationship.totalInteractions / 10, 1)
  
  const healthScore = avgLevel * 0.4 + (1 - conflictRatio) * 0.3 + milestonesRatio * 0.3
  return `${Math.round(healthScore * 10)}점`
}

const getRelationshipHealthDescription = (character: AdvancedAICompanion): string => {
  const avgLevel = (character.relationship.intimacyLevel + character.relationship.trustLevel) / 2
  
  if (avgLevel >= 8) return '매우 건강한 관계입니다'
  if (avgLevel >= 6) return '좋은 관계를 유지하고 있습니다'
  if (avgLevel >= 4) return '안정적인 관계입니다'
  return '관계 발전의 여지가 있습니다'
}

const getGrowthPotential = (character: AdvancedAICompanion): string => {
  const growthRate = character.personality.adaptation.growthRate
  const adaptability = character.personality.core.adaptability
  const recentGrowth = character.personality.adaptation.recentGrowth.length
  
  const potential = (growthRate * 0.4 + adaptability * 0.4 + Math.min(recentGrowth / 5, 1) * 0.2) * 100
  return `${Math.round(potential)}%`
}

const getGrowthDescription = (character: AdvancedAICompanion): string => {
  const potential = parseFloat(getGrowthPotential(character).replace('%', ''))
  
  if (potential >= 80) return '높은 성장 잠재력을 가지고 있습니다'
  if (potential >= 60) return '좋은 성장 가능성을 보여줍니다'
  if (potential >= 40) return '꾸준한 발전이 기대됩니다'
  return '성장을 위해 더 많은 상호작용이 필요합니다'
}

export default CharacterStats