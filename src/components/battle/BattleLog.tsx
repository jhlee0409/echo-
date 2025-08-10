/**
 * 📜 Battle Log Component
 * 
 * Real-time battle event logging with auto-scroll and filtering
 */

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BattleLogEntry } from '@/systems/battle/types'

interface BattleLogProps {
  entries: BattleLogEntry[]
  maxEntries?: number
  className?: string
}

type LogFilter = 'all' | 'combat' | 'skills' | 'status'

export function BattleLog({
  entries,
  maxEntries = 100,
  className = ''
}: BattleLogProps) {
  const [filter, setFilter] = useState<LogFilter>('all')
  const [isAutoScroll, setIsAutoScroll] = useState<boolean>(true)
  const logContainerRef = useRef<HTMLDivElement>(null)
  const lastEntryRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (isAutoScroll && lastEntryRef.current) {
      lastEntryRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [entries, isAutoScroll])

  // Handle manual scroll to detect if user scrolled up
  const handleScroll = () => {
    if (!logContainerRef.current) return
    
    const container = logContainerRef.current
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50
    setIsAutoScroll(isAtBottom)
  }

  const getFilteredEntries = (): BattleLogEntry[] => {
    let filtered = entries

    switch (filter) {
      case 'combat':
        filtered = entries.filter(entry => 
          entry.action === 'attack' || 
          entry.action === 'critical_hit' || 
          entry.damage !== undefined
        )
        break
      case 'skills':
        filtered = entries.filter(entry => entry.action === 'skill')
        break
      case 'status':
        filtered = entries.filter(entry => 
          entry.action === 'death' || 
          entry.action === 'victory' || 
          entry.action === 'defeat' ||
          entry.healing !== undefined
        )
        break
      default:
        filtered = entries
    }

    return filtered.slice(-maxEntries)
  }

  const getEntryIcon = (entry: BattleLogEntry): string => {
    switch (entry.action) {
      case 'attack':
        return '⚔️'
      case 'skill':
        return '✨'
      case 'critical_hit':
        return '💥'
      case 'death':
        return '💀'
      case 'victory':
        return '🏆'
      case 'defeat':
        return '💔'
      case 'battle_start':
        return '🚀'
      case 'defend':
        return '🛡️'
      case 'escape':
        return '🏃‍♂️'
      default:
        return '📝'
    }
  }

  const getEntryColor = (entry: BattleLogEntry): string => {
    if (entry.damage && entry.damage > 0) {
      return entry.action === 'critical_hit' ? 'text-orange-400' : 'text-red-400'
    }
    if (entry.healing && entry.healing > 0) {
      return 'text-green-400'
    }
    
    switch (entry.action) {
      case 'victory':
        return 'text-green-400'
      case 'defeat':
      case 'death':
        return 'text-red-400'
      case 'skill':
        return 'text-blue-400'
      case 'battle_start':
        return 'text-yellow-400'
      default:
        return 'text-gray-300'
    }
  }

  const formatTime = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString('ko-KR', { 
      hour12: false,
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const filteredEntries = getFilteredEntries()

  return (
    <div className={`battle-log flex flex-col h-full bg-slate-900/95 backdrop-blur-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h3 className="text-lg font-bold text-white">전투 기록</h3>
        
        {/* Filter Buttons */}
        <div className="flex space-x-1">
          {[
            { key: 'all', label: '전체' },
            { key: 'combat', label: '전투' },
            { key: 'skills', label: '스킬' },
            { key: 'status', label: '상태' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as LogFilter)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                filter === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Log Entries */}
      <div 
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
        onScroll={handleScroll}
      >
        <AnimatePresence initial={false}>
          {filteredEntries.map((entry, index) => (
            <motion.div
              key={`${entry.timestamp.getTime()}-${index}`}
              ref={index === filteredEntries.length - 1 ? lastEntryRef : undefined}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`log-entry bg-slate-800/50 rounded-lg p-3 ${getEntryColor(entry)}`}
            >
              <div className="flex items-start space-x-3">
                {/* Icon */}
                <div className="text-lg shrink-0 mt-0.5">
                  {getEntryIcon(entry)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white">
                        {entry.actorName}
                      </span>
                      {entry.targetName && (
                        <>
                          <span className="text-gray-500">→</span>
                          <span className="text-gray-300">{entry.targetName}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {formatTime(entry.timestamp)}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="text-sm leading-relaxed">
                    {entry.message}
                  </div>

                  {/* Stats */}
                  {(entry.damage || entry.healing) && (
                    <div className="flex items-center space-x-4 mt-2 text-xs">
                      {entry.damage && entry.damage > 0 && (
                        <div className="flex items-center space-x-1">
                          <span className="text-red-400">⚔️</span>
                          <span className="text-red-400 font-medium">
                            {entry.damage} 데미지
                          </span>
                        </div>
                      )}
                      {entry.healing && entry.healing > 0 && (
                        <div className="flex items-center space-x-1">
                          <span className="text-green-400">💚</span>
                          <span className="text-green-400 font-medium">
                            {entry.healing} 회복
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Turn indicator */}
                  <div className="text-xs text-gray-500 mt-1">
                    Turn {entry.turnNumber}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {filteredEntries.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📜</div>
            <div>전투 기록이 없습니다</div>
            <div className="text-sm mt-1">전투가 시작되면 기록이 표시됩니다</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 p-3">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div>
            총 {entries.length}개 기록 
            {filter !== 'all' && ` (${filteredEntries.length}개 표시)`}
          </div>
          
          {/* Auto-scroll indicator */}
          <div className="flex items-center space-x-2">
            {!isAutoScroll && (
              <button
                onClick={() => {
                  setIsAutoScroll(true)
                  lastEntryRef.current?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                ↓ 최신으로
              </button>
            )}
            
            <div className={`flex items-center space-x-1 ${
              isAutoScroll ? 'text-green-400' : 'text-gray-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isAutoScroll ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
              }`} />
              <span>{isAutoScroll ? '자동 스크롤' : '수동 스크롤'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BattleLog