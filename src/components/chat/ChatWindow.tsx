import { FC, useState, useRef, useEffect } from 'react'
import { useGameStore } from '@hooks'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import Button from '../ui/Button'

const ChatWindow: FC = () => {
  const { companion, conversationHistory, sendMessage, isLoading } = useGameStore()
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversationHistory])

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return

    setInputMessage('')
    await sendMessage(message.trim())
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputMessage)
    }
  }

  return (
    <div className="h-full flex flex-col bg-dark-surface rounded-lg border border-ui-border-100 overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-ui-border-200 bg-dark-surface/80 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-neon-blue to-neon-purple rounded-full animate-glow flex items-center justify-center">
            <span className="text-sm font-bold text-dark-navy">
              {companion?.name?.charAt(0) || 'S'}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-ui-text-100">
              {companion?.name || '소울메이트'}
            </h3>
            <p className="text-xs text-ui-text-400">
              {isLoading ? '입력 중...' : '온라인'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => messagesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-xs"
          >
            ⬆️
          </Button>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-track-ui-surface-100 scrollbar-thumb-ui-surface-300"
      >
        {conversationHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">👋</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-ui-text-100 mb-2">
                안녕하세요! / Hello!
              </h3>
              <p className="text-sm text-ui-text-300 max-w-sm">
                {companion?.name || '소울메이트'}와의 대화를 시작해보세요. 
                무엇이든 물어보거나 이야기하고 싶은 것을 말해주세요.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                '안녕! 반가워',
                '오늘 기분이 어때?',
                '무엇을 좋아해?',
                '같이 게임할래?'
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="ghost"
                  size="sm"
                  onClick={() => setInputMessage(suggestion)}
                  className="text-xs border border-ui-border-200 hover:border-neon-blue/50"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {conversationHistory.map((message, index) => (
              <MessageBubble
                key={`${message.timestamp}-${index}`}
                message={message}
                isOwn={message.sender === 'user'}
              />
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <MessageBubble
                message={{
                  id: 'loading',
                  sender: 'ai',
                  content: '',
                  timestamp: Date.now(),
                  emotion: 'thoughtful'
                }}
                isOwn={false}
                isLoading={true}
              />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="border-t border-ui-border-200 p-4">
        <ChatInput
          value={inputMessage}
          onChange={setInputMessage}
          onSend={handleSendMessage}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          placeholder={
            companion 
              ? `${companion.name}에게 메시지를 보내세요...`
              : '메시지를 입력하세요...'
          }
        />
        
        {/* Quick Actions */}
        <div className="flex justify-between items-center mt-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setInputMessage('😊')}
              className="text-lg hover:scale-110 transition-transform"
              title="이모지 추가"
            >
              😊
            </button>
            <button
              onClick={() => setInputMessage('❤️')}
              className="text-lg hover:scale-110 transition-transform"
              title="하트"
            >
              ❤️
            </button>
            <button
              onClick={() => setInputMessage('🤔')}
              className="text-lg hover:scale-110 transition-transform"
              title="생각"
            >
              🤔
            </button>
          </div>
          
          <div className="text-xs text-ui-text-400">
            {conversationHistory.length} 메시지
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatWindow