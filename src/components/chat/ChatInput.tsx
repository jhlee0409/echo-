import { FC, useRef } from 'react'
import Button from '../ui/Button'
import { cn } from '@utils'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (message: string) => void
  onKeyPress?: (e: React.KeyboardEvent) => void
  disabled?: boolean
  placeholder?: string
  maxLength?: number
}

const ChatInput: FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onKeyPress,
  disabled = false,
  placeholder = '메시지를 입력하세요...',
  maxLength = 500
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim())
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length <= maxLength) {
      onChange(newValue)
    }
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (onKeyPress) {
      onKeyPress(e)
    }
    
    // Handle Enter key
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const characterCount = value.length
  const isNearLimit = characterCount > maxLength * 0.8
  const isAtLimit = characterCount >= maxLength

  return (
    <div className="space-y-2">
      {/* Input Container */}
      <div className="flex items-end space-x-2">
        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className={cn(
              'w-full px-4 py-3 bg-ui-surface-100 border border-ui-border-200 rounded-lg',
              'text-ui-text-100 placeholder-ui-text-400',
              'resize-none overflow-hidden',
              'focus:outline-none focus:ring-2 focus:ring-neon-blue/50 focus:border-neon-blue',
              'transition-all duration-200',
              disabled && 'opacity-50 cursor-not-allowed',
              'scrollbar-thin scrollbar-track-ui-surface-200 scrollbar-thumb-ui-surface-400'
            )}
            style={{
              maxHeight: '120px',
              minHeight: '48px'
            }}
          />
          
          {/* Character Counter */}
          {isNearLimit && (
            <div className={cn(
              'absolute bottom-1 right-2 text-xs px-1 rounded',
              isAtLimit ? 'text-red-400' : 'text-ui-text-400'
            )}>
              {characterCount}/{maxLength}
            </div>
          )}
        </div>

        {/* Send Button */}
        <Button
          variant="primary"
          size="md"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="shrink-0 h-12 px-4"
          title="메시지 전송 (Enter)"
        >
          {disabled ? (
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </Button>
      </div>

      {/* Helper Text */}
      <div className="flex justify-between items-center text-xs text-ui-text-400">
        <div className="flex items-center space-x-4">
          <span>
            Shift + Enter로 줄바꿈
          </span>
          {disabled && (
            <span className="text-ui-text-500">
              AI가 응답하는 중...
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {value.trim() && (
            <button
              onClick={() => onChange('')}
              className="text-ui-text-400 hover:text-ui-text-200 transition-colors"
              title="입력 내용 지우기"
            >
              지우기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatInput