import { FC } from 'react'
import { useGameStore } from '@hooks'

const CharacterStatus: FC = () => {
  const { companion, gameState } = useGameStore()

  if (!companion) {
    return (
      <div className="bg-dark-surface rounded-lg border border-ui-border-100 p-4">
        <div className="text-center text-ui-text-300">
          AI 컴패니언을 불러오는 중...
        </div>
      </div>
    )
  }

  const relationshipLevel = companion.relationshipStatus.level
  const relationshipProgress = companion.relationshipStatus.experience / companion.relationshipStatus.experienceToNext * 100

  return (
    <div className="bg-dark-surface rounded-lg border border-ui-border-100 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-neon-blue to-neon-purple rounded-full animate-glow flex items-center justify-center">
          <span className="text-lg font-bold text-dark-navy">
            {companion.name.charAt(0)}
          </span>
        </div>
        <div>
          <h3 className="font-bold text-ui-text-100">{companion.name}</h3>
          <p className="text-sm text-ui-text-300">AI 컴패니언</p>
        </div>
      </div>

      {/* Relationship Status */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-ui-text-200">관계도</span>
          <span className="text-sm text-neon-blue">Level {relationshipLevel}</span>
        </div>
        <div className="w-full bg-ui-surface-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-neon-blue to-neon-purple h-2 rounded-full transition-all duration-500"
            style={{ width: `${relationshipProgress}%` }}
          />
        </div>
        <div className="text-xs text-ui-text-400">
          {companion.relationshipStatus.experience} / {companion.relationshipStatus.experienceToNext} XP
        </div>
      </div>

      {/* Personality Traits */}
      <div className="space-y-3">
        <h4 className="font-medium text-ui-text-100">성격 특성</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(companion.personalityTraits).map(([trait, value]) => (
            <div key={trait} className="space-y-1">
              <div className="flex justify-between">
                <span className="text-ui-text-300 capitalize">{trait}</span>
                <span className="text-neon-blue">{Math.round((value as number) * 100)}%</span>
              </div>
              <div className="w-full bg-ui-surface-200 rounded-full h-1">
                <div 
                  className="bg-neon-blue h-1 rounded-full transition-all duration-300"
                  style={{ width: `${(value as number) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Mood */}
      <div className="border-t border-ui-border-200 pt-3 space-y-2">
        <h4 className="font-medium text-ui-text-100">현재 기분</h4>
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getMoodEmoji(companion.currentEmotion.dominant)}</span>
          <div>
            <p className="text-sm text-ui-text-200 capitalize">
              {companion.currentEmotion.dominant}
            </p>
            <p className="text-xs text-ui-text-400">
              강도: {Math.round(companion.currentEmotion.intensity * 100)}%
            </p>
          </div>
        </div>
      </div>

      {/* Game Stats */}
      <div className="border-t border-ui-border-200 pt-3 space-y-2">
        <h4 className="font-medium text-ui-text-100">게임 통계</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-center p-2 bg-ui-surface-100 rounded">
            <p className="text-neon-blue font-bold">{gameState?.conversationCount || 0}</p>
            <p className="text-xs text-ui-text-400">대화 수</p>
          </div>
          <div className="text-center p-2 bg-ui-surface-100 rounded">
            <p className="text-neon-purple font-bold">{gameState?.daysSinceStart || 0}</p>
            <p className="text-xs text-ui-text-400">함께한 일수</p>
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