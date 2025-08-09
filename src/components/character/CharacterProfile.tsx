/**
 * 🎮 Character Profile Component - Advanced Character UI
 * 
 * Features:
 * - Dynamic personality display
 * - Emotion state visualization
 * - Relationship progression
 * - Memory insights
 * - Privacy-aware data display
 */

import { FC, useState, useEffect } from 'react'
import { AdvancedCharacterManager, AdvancedAICompanion } from '@services/character/AdvancedCharacterSystem'
import type { EmotionType } from '@types'

interface CharacterProfileProps {
  character?: AdvancedAICompanion
  onCharacterUpdate?: (character: AdvancedAICompanion) => void
  showPrivacyControls?: boolean
}

const CharacterProfile: FC<CharacterProfileProps> = ({
  character,
  onCharacterUpdate,
  showPrivacyControls = false
}) => {
  const [characterManager, setCharacterManager] = useState<AdvancedCharacterManager | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'personality' | 'emotions' | 'relationship' | 'memory' | 'privacy'>('personality')

  useEffect(() => {
    if (character) {
      const manager = new AdvancedCharacterManager(character)
      setCharacterManager(manager)
    }
  }, [character])

  if (!character || !characterManager) {
    return (
      <div className="bg-dark-surface rounded-xl border border-ui-border-100 p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-ui-surface-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-ui-surface-200 rounded w-32"></div>
              <div className="h-3 bg-ui-surface-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { personality, emotionalState, relationship, memory, privacy } = character
  const emotionalContext = characterManager.getEmotionalContext()
  const recentMemories = characterManager.getRecentMemories(3)

  return (
    <div className="bg-dark-surface rounded-xl border border-ui-border-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-ui-border-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-neon-blue to-neon-purple rounded-full animate-glow flex items-center justify-center">
                <span className="text-2xl font-bold text-dark-navy">
                  {character.name.charAt(0)}
                </span>
              </div>
              {/* Mood indicator */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-dark-surface rounded-full border-2 border-ui-border-100 flex items-center justify-center">
                <span className="text-sm">{getMoodEmoji(emotionalState.currentEmotion)}</span>
              </div>
            </div>

            {/* Basic info */}
            <div>
              <h3 className="text-xl font-bold text-ui-text-100">{character.name}</h3>
              <p className="text-sm text-ui-text-300">AI 컴패니언</p>
              <p className="text-xs text-ui-text-400">
                관계: {getRelationshipKorean(relationship.relationshipType)} • 
                함께한 일수: {Math.floor((Date.now() - character.createdAt.getTime()) / (1000 * 60 * 60 * 24))}일
              </p>
            </div>
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-ui-surface-100 rounded-lg transition-colors"
          >
            <span className={`text-ui-text-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
        </div>

        {/* Quick stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-neon-blue">{Math.round(relationship.intimacyLevel)}/10</p>
            <p className="text-xs text-ui-text-400">친밀도</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-neon-purple">{Math.round(relationship.trustLevel)}/10</p>
            <p className="text-xs text-ui-text-400">신뢰도</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-neon-green">{relationship.totalInteractions}</p>
            <p className="text-xs text-ui-text-400">대화 수</p>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-6">
          {/* Tab navigation */}
          <div className="flex space-x-1 mb-6 bg-ui-surface-100 rounded-lg p-1">
            {(['personality', 'emotions', 'relationship', 'memory', 'privacy'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-neon-blue text-dark-navy'
                    : 'text-ui-text-300 hover:text-ui-text-100'
                }`}
              >
                {getTabKorean(tab)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="space-y-4">
            {activeTab === 'personality' && (
              <PersonalityTab personality={personality} />
            )}
            
            {activeTab === 'emotions' && (
              <EmotionsTab emotionalState={emotionalState} emotionalContext={emotionalContext} />
            )}
            
            {activeTab === 'relationship' && (
              <RelationshipTab relationship={relationship} />
            )}
            
            {activeTab === 'memory' && (
              <MemoryTab memory={memory} recentMemories={recentMemories} />
            )}
            
            {activeTab === 'privacy' && showPrivacyControls && (
              <PrivacyTab privacy={privacy} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Personality Tab Component
const PersonalityTab: FC<{ personality: AdvancedAICompanion['personality'] }> = ({ personality }) => {
  const { core, current, adaptation } = personality

  return (
    <div className="space-y-4">
      {/* Core traits */}
      <div>
        <h4 className="font-medium text-ui-text-100 mb-3">핵심 성격</h4>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(core).map(([trait, value]) => {
            if (typeof value !== 'number' || ['adaptability', 'consistency', 'authenticity'].includes(trait)) return null
            
            return (
              <div key={trait} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-ui-text-200 capitalize">{getTraitKorean(trait)}</span>
                  <span className="text-xs text-neon-blue">{Math.round(value * 100)}%</span>
                </div>
                <div className="w-full bg-ui-surface-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-neon-blue to-neon-purple h-2 rounded-full transition-all duration-300"
                    style={{ width: `${value * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Current mood */}
      <div className="border-t border-ui-border-200 pt-4">
        <h4 className="font-medium text-ui-text-100 mb-3">현재 상태</h4>
        <div className="bg-ui-surface-100 rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getMoodEmoji(current.dominantMood)}</span>
            <div>
              <p className="text-sm font-medium text-ui-text-100 capitalize">
                {getEmotionKorean(current.dominantMood)}
              </p>
              <p className="text-xs text-ui-text-400">
                강도: {Math.round(current.moodIntensity * 100)}% • 
                지속시간: {current.moodDuration}분 / {current.expectedDuration}분
              </p>
            </div>
          </div>
          
          {current.moodTrigger && (
            <p className="text-xs text-ui-text-400">
              원인: {current.moodTrigger}
            </p>
          )}
        </div>
      </div>

      {/* Growth info */}
      <div className="border-t border-ui-border-200 pt-4">
        <h4 className="font-medium text-ui-text-100 mb-3">성장 현황</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-ui-surface-100 rounded-lg p-3">
            <p className="text-ui-text-300">발달 단계</p>
            <p className="font-medium text-ui-text-100">{getDevelopmentStageKorean(adaptation.developmentStage)}</p>
          </div>
          <div className="bg-ui-surface-100 rounded-lg p-3">
            <p className="text-ui-text-300">성장률</p>
            <p className="font-medium text-neon-blue">{Math.round(adaptation.growthRate * 100)}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Emotions Tab Component
const EmotionsTab: FC<{ 
  emotionalState: AdvancedAICompanion['emotionalState']
  emotionalContext: any 
}> = ({ emotionalState, emotionalContext }) => {
  const recentEmotions = emotionalState.emotionHistory.slice(-5).reverse()

  return (
    <div className="space-y-4">
      {/* Current emotion */}
      <div>
        <h4 className="font-medium text-ui-text-100 mb-3">현재 감정</h4>
        <div className="bg-ui-surface-100 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-3xl">{getMoodEmoji(emotionalState.currentEmotion)}</span>
            <div>
              <p className="font-medium text-ui-text-100">{getEmotionKorean(emotionalState.currentEmotion)}</p>
              <p className="text-sm text-ui-text-300">강도: {Math.round(emotionalState.emotionIntensity * 100)}%</p>
            </div>
          </div>
          <div className="w-full bg-ui-surface-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-neon-blue to-neon-purple h-2 rounded-full"
              style={{ width: `${emotionalState.emotionIntensity * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Emotional stability */}
      <div>
        <h4 className="font-medium text-ui-text-100 mb-3">감정 안정성</h4>
        <div className="bg-ui-surface-100 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-ui-text-200">안정성 지수</span>
            <span className="text-sm font-medium text-neon-green">
              {Math.round(emotionalState.stability * 100)}%
            </span>
          </div>
          <div className="w-full bg-ui-surface-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-neon-green to-neon-blue h-2 rounded-full"
              style={{ width: `${emotionalState.stability * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recent emotion history */}
      <div>
        <h4 className="font-medium text-ui-text-100 mb-3">최근 감정 변화</h4>
        <div className="space-y-2">
          {recentEmotions.length > 0 ? (
            recentEmotions.map((emotion, index) => (
              <div key={emotion.id} className="bg-ui-surface-100 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>{getMoodEmoji(emotion.emotion)}</span>
                    <span className="text-ui-text-100">{getEmotionKorean(emotion.emotion)}</span>
                  </div>
                  <div className="text-xs text-ui-text-400">
                    {new Date(emotion.timestamp).toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
                {emotion.context && (
                  <p className="text-xs text-ui-text-400 mt-1">{emotion.context}</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-ui-text-400 text-center py-4">아직 감정 변화 기록이 없습니다</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Relationship Tab Component
const RelationshipTab: FC<{ relationship: AdvancedAICompanion['relationship'] }> = ({ relationship }) => {
  const recentMilestones = relationship.specialMoments.slice(-3).reverse()

  return (
    <div className="space-y-4">
      {/* Relationship levels */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-ui-surface-100 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-ui-text-200">친밀도</span>
            <span className="text-sm font-bold text-neon-blue">{Math.round(relationship.intimacyLevel)}/10</span>
          </div>
          <div className="w-full bg-ui-surface-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-neon-blue to-neon-purple h-2 rounded-full"
              style={{ width: `${(relationship.intimacyLevel / 10) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-ui-surface-100 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-ui-text-200">신뢰도</span>
            <span className="text-sm font-bold text-neon-purple">{Math.round(relationship.trustLevel)}/10</span>
          </div>
          <div className="w-full bg-ui-surface-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-neon-purple to-neon-blue h-2 rounded-full"
              style={{ width: `${(relationship.trustLevel / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Relationship type */}
      <div>
        <h4 className="font-medium text-ui-text-100 mb-3">관계 유형</h4>
        <div className="bg-ui-surface-100 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getRelationshipEmoji(relationship.relationshipType)}</span>
            <div>
              <p className="font-medium text-ui-text-100">{getRelationshipKorean(relationship.relationshipType)}</p>
              <p className="text-sm text-ui-text-300">
                일일 대화: {relationship.dailyInteractions} • 총 대화: {relationship.totalInteractions}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Special moments */}
      <div>
        <h4 className="font-medium text-ui-text-100 mb-3">특별한 순간들</h4>
        <div className="space-y-2">
          {recentMilestones.length > 0 ? (
            recentMilestones.map((milestone) => (
              <div key={milestone.id} className="bg-ui-surface-100 rounded-lg p-3">
                <div className="flex items-start space-x-3">
                  <span className="text-lg">{getMilestoneEmoji(milestone.milestoneType)}</span>
                  <div className="flex-1">
                    <p className="font-medium text-ui-text-100">{milestone.title}</p>
                    <p className="text-sm text-ui-text-300">{milestone.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-ui-text-400">
                        {milestone.achievedAt.toLocaleDateString('ko-KR')}
                      </span>
                      <span className="text-xs text-neon-blue">
                        의미도: {Math.round(milestone.significance * 100)}%
                      </span>
                    </div>
                    {milestone.commemorativeMessage && (
                      <p className="text-xs text-ui-text-400 mt-1 italic">
                        "{milestone.commemorativeMessage}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-ui-text-400 text-center py-4">아직 특별한 순간이 기록되지 않았습니다</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Memory Tab Component  
const MemoryTab: FC<{ 
  memory: AdvancedAICompanion['memory']
  recentMemories: any[] 
}> = ({ memory, recentMemories }) => {
  return (
    <div className="space-y-4">
      {/* Memory stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-ui-surface-100 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-neon-blue">{memory.preferences.length}</p>
          <p className="text-xs text-ui-text-400">학습된 선호도</p>
        </div>
        <div className="bg-ui-surface-100 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-neon-purple">{memory.facts.length}</p>
          <p className="text-xs text-ui-text-400">기억된 사실</p>
        </div>
      </div>

      {/* Recent conversations */}
      <div>
        <h4 className="font-medium text-ui-text-100 mb-3">최근 대화</h4>
        <div className="space-y-2">
          {recentMemories.length > 0 ? (
            recentMemories.map((memory) => (
              <div key={memory.id} className="bg-ui-surface-100 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-ui-text-100 line-clamp-2">{memory.userMessage}</p>
                  <span className="text-xs text-ui-text-400 whitespace-nowrap ml-2">
                    {new Date(memory.timestamp).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {memory.topics?.map((topic: string, index: number) => (
                      <span key={index} className="text-xs bg-ui-surface-200 px-2 py-1 rounded">
                        {topic}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-neon-blue">
                    의미도: {Math.round((memory.significance || 0) * 100)}%
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-ui-text-400 text-center py-4">아직 대화 기록이 없습니다</p>
          )}
        </div>
      </div>

      {/* Top preferences */}
      <div>
        <h4 className="font-medium text-ui-text-100 mb-3">학습된 선호도</h4>
        <div className="space-y-2">
          {memory.preferences.slice(0, 3).map((pref) => (
            <div key={pref.id} className="bg-ui-surface-100 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <p className="text-sm text-ui-text-100">{pref.preference}</p>
                <span className="text-xs text-neon-green">
                  신뢰도: {Math.round(pref.confidence * 100)}%
                </span>
              </div>
              <p className="text-xs text-ui-text-400 capitalize">{pref.category}</p>
            </div>
          )) }
          {memory.preferences.length === 0 && (
            <p className="text-sm text-ui-text-400 text-center py-4">아직 선호도를 학습하지 않았습니다</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Privacy Tab Component
const PrivacyTab: FC<{ privacy: AdvancedAICompanion['privacy'] }> = ({ privacy }) => {
  return (
    <div className="space-y-4">
      <div className="bg-ui-surface-100 rounded-lg p-4">
        <h4 className="font-medium text-ui-text-100 mb-3">개인정보 설정</h4>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-ui-text-200">동의 레벨</span>
            <span className="text-ui-text-100">{getConsentLevelKorean(privacy.consentLevel)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-ui-text-200">데이터 보관</span>
            <span className="text-ui-text-100">{getRetentionPolicyKorean(privacy.dataRetention)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-ui-text-200">익명화</span>
            <span className={privacy.anonymization ? 'text-neon-green' : 'text-ui-text-400'}>
              {privacy.anonymization ? '활성화' : '비활성화'}
            </span>
          </div>

          {privacy.parentalControls && (
            <div className="flex justify-between">
              <span className="text-ui-text-200">보호자 제어</span>
              <span className="text-neon-blue">활성화</span>
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-ui-text-400 bg-ui-surface-100 rounded-lg p-3">
        <p className="mb-2">🔒 개인정보 보호</p>
        <p>모든 데이터는 설정된 개인정보 정책에 따라 안전하게 보관되며, 언제든지 설정을 변경하거나 데이터를 삭제할 수 있습니다.</p>
      </div>
    </div>
  )
}

// Helper functions
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

const getRelationshipEmoji = (type: string): string => {
  const emojiMap: Record<string, string> = {
    friend: '👫',
    close_friend: '👭',
    best_friend: '💝',
    romantic_interest: '💕',
    life_partner: '💑',
    mentor: '🎓',
    confidant: '🤝'
  }
  return emojiMap[type] || '👫'
}

const getMilestoneEmoji = (type: string): string => {
  const emojiMap: Record<string, string> = {
    relationship_level_up: '📈',
    trust_breakthrough: '🤝',
    emotional_connection: '❤️',
    shared_secret: '🤫',
    difficult_conversation: '💪',
    celebration_together: '🎉'
  }
  return emojiMap[type] || '✨'
}

const getTabKorean = (tab: string): string => {
  const tabMap: Record<string, string> = {
    personality: '성격',
    emotions: '감정',
    relationship: '관계',
    memory: '기억',
    privacy: '개인정보'
  }
  return tabMap[tab] || tab
}

const getTraitKorean = (trait: string): string => {
  const traitMap: Record<string, string> = {
    cheerful: '밝음',
    caring: '배려심',
    playful: '장난기',
    curious: '호기심',
    thoughtful: '사려깊음',
    supportive: '지지적',
    independent: '독립적',
    emotional: '감정적'
  }
  return traitMap[trait] || trait
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

const getRelationshipKorean = (type: string): string => {
  const relationshipMap: Record<string, string> = {
    friend: '친구',
    close_friend: '가까운 친구',
    best_friend: '절친',
    romantic_interest: '연인',
    life_partner: '인생 파트너',
    mentor: '멘토',
    confidant: '절친한 조언자'
  }
  return relationshipMap[type] || type
}

const getDevelopmentStageKorean = (stage: string): string => {
  const stageMap: Record<string, string> = {
    early: '초기',
    growing: '성장',
    mature: '성숙',
    evolving: '진화'
  }
  return stageMap[stage] || stage
}

const getConsentLevelKorean = (level: string): string => {
  const levelMap: Record<string, string> = {
    minimal: '최소',
    standard: '표준',
    enhanced: '고급',
    research: '연구용'
  }
  return levelMap[level] || level
}

const getRetentionPolicyKorean = (policy: string): string => {
  const policyMap: Record<string, string> = {
    session_only: '세션만',
    short_term: '단기',
    standard: '표준',
    long_term: '장기',
    permanent: '영구'
  }
  return policyMap[policy] || policy
}

export default CharacterProfile