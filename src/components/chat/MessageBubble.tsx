import { FC } from 'react'
import { Message } from '@types'
import { cn } from '@utils'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  isLoading?: boolean
}

const MessageBubble: FC<MessageBubbleProps> = ({ 
  message, 
  isOwn, 
  isLoading = false 
}) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEmotionColor = (emotion?: string) => {
    const emotionColors: Record<string, string> = {
      happy: 'from-yellow-400 to-orange-400',
      sad: 'from-blue-400 to-blue-600',
      excited: 'from-pink-400 to-purple-400',
      calm: 'from-green-400 to-blue-400',
      curious: 'from-purple-400 to-indigo-400',
      playful: 'from-orange-400 to-pink-400',
      thoughtful: 'from-indigo-400 to-purple-400',
      caring: 'from-pink-400 to-red-400',
      default: 'from-neon-blue to-neon-purple'
    }
    
    return emotionColors[emotion || 'default'] || emotionColors.default
  }

  const getEmotionEmoji = (emotion?: string) => {
    const emotionEmojis: Record<string, string> = {
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
    
    return emotionEmojis[emotion || 'default'] || emotionEmojis.default
  }

  return (
    <div className={cn(
      'flex items-end space-x-2',
      isOwn ? 'justify-end' : 'justify-start'
    )}>
      {/* Avatar (AI only) */}
      {!isOwn && (
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isLoading ? 'animate-pulse' : '',
          `bg-gradient-to-br ${getEmotionColor(message.emotion)}`
        )}>
          <span className="text-sm text-dark-navy">
            {isLoading ? '⋯' : getEmotionEmoji(message.emotion)}
          </span>
        </div>
      )}

      {/* Message Container */}
      <div className={cn(
        'flex flex-col max-w-xs lg:max-w-md',
        isOwn ? 'items-end' : 'items-start'
      )}>
        {/* Message Bubble */}
        <div
          className={cn(
            'px-4 py-2 rounded-2xl break-words',
            isOwn
              ? 'bg-neon-blue text-dark-navy rounded-br-md'
              : 'bg-ui-surface-200 text-ui-text-100 rounded-bl-md',
            isLoading && 'animate-pulse'
          )}
        >
          {isLoading ? (
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-ui-text-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-ui-text-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-ui-text-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          )}
        </div>

        {/* Timestamp */}
        {!isLoading && (
          <div className={cn(
            'text-xs text-ui-text-400 mt-1 px-1',
            isOwn ? 'text-right' : 'text-left'
          )}>
            {formatTime(message.timestamp)}
            {message.emotion && !isOwn && (
              <span className="ml-1 opacity-60">
                · {message.emotion}
              </span>
            )}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isOwn && (
        <div className="w-8 h-8 bg-gradient-to-br from-ui-surface-300 to-ui-surface-400 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm text-ui-text-200">👤</span>
        </div>
      )}
    </div>
  )
}

export default MessageBubble