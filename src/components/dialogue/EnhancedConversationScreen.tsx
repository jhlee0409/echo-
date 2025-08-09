/**
 * 💬 Enhanced Conversation Screen
 * 
 * Improved conversation interface that bridges the gap between GameModeRouter
 * and actual chat functionality with Service Integration system support.
 */

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  Settings,
  Zap,
  RefreshCw,
  ChevronUp,
  ChevronDown 
} from 'lucide-react'

import { useGameMode } from '@components/ui/GameUI/GameModeRouter'
import { useDialogueMigrationService } from '@services/dialogue/DialogueMigrationService'
import { useServiceIntegrationStatus } from '@hooks/useServiceIntegration'
import { useCharacterStateAdapter } from '@store/adapters'
import ChatWindow from '@components/chat/ChatWindow'
import DialogueMigrationPanel from './DialogueMigrationPanel'

const EnhancedConversationScreen: React.FC = () => {
  const { currentMode, switchMode } = useGameMode()
  const migrationService = useDialogueMigrationService()
  const { isReady, status } = useServiceIntegrationStatus()
  const characterAdapter = useCharacterStateAdapter()
  
  const [showMigrationPanel, setShowMigrationPanel] = useState(false)
  const [dialogueContext, setDialogueContext] = useState<any>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [contextPanelExpanded, setContextPanelExpanded] = useState(false)
  const [performanceStats, setPerformanceStats] = useState<any>(null)

  // Auto-load dialogue context on mount
  useEffect(() => {
    const loadContext = async () => {
      if (migrationService.isReady()) {
        try {
          const context = await migrationService.getEnhancedDialogueContext(currentMode)
          setDialogueContext(context)
        } catch (error) {
          console.error('Failed to load dialogue context:', error)
        }
      }
    }

    loadContext()
  }, [currentMode, migrationService])

  // Handle performance optimization
  const handleOptimization = async () => {
    setIsOptimizing(true)
    try {
      const result = await migrationService.optimizeDialoguePerformance()
      setPerformanceStats(result)
      
      // Auto-hide performance stats after 5 seconds
      setTimeout(() => setPerformanceStats(null), 5000)
    } catch (error) {
      console.error('Optimization failed:', error)
    } finally {
      setIsOptimizing(false)
    }
  }

  // Get current character info for context display
  const character = characterAdapter.getCharacter()
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-gradient-to-br from-dark-navy to-dark-surface relative"
    >
      {/* Enhanced Header with Context Info */}
      <div className="sticky top-0 z-10 bg-dark-surface/95 backdrop-blur-sm border-b border-ui-border-100">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-neon-blue to-neon-purple rounded-full animate-glow flex items-center justify-center">
                  <MessageCircle size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-ui-text-100">
                    향상된 대화 모드
                  </h1>
                  <p className="text-xs text-ui-text-300">
                    Service Integration • {isReady ? '연결됨' : '연결 중...'}
                  </p>
                </div>
              </div>
              
              {/* Context Indicator */}
              {dialogueContext && (
                <div className="hidden md:flex items-center space-x-2 text-xs text-ui-text-300">
                  <span>컨텍스트:</span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                    {dialogueContext.conversationTopic || '일반'}
                  </span>
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                    친밀도 {Math.round(dialogueContext.intimacyLevel * 100)}%
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Performance Stats Display */}
              <AnimatePresence>
                {performanceStats && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 20 }}
                    className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 text-xs"
                  >
                    <div className="flex items-center space-x-2 text-green-400">
                      <Zap size={12} />
                      <span>
                        성능 향상: +{performanceStats.performanceGain}%
                      </span>
                      {performanceStats.memoryReduction > 0 && (
                        <span>
                          메모리 절약: {performanceStats.memoryReduction}KB
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Control Buttons */}
              <button
                onClick={() => setContextPanelExpanded(!contextPanelExpanded)}
                className="p-2 bg-ui-surface-200 hover:bg-ui-surface-300 rounded-lg transition-colors"
                title="컨텍스트 패널"
              >
                {contextPanelExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              <button
                onClick={handleOptimization}
                disabled={isOptimizing || !isReady}
                className="flex items-center space-x-2 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors disabled:opacity-50"
                title="성능 최적화"
              >
                <Zap size={16} className={isOptimizing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline text-sm">최적화</span>
              </button>
              
              <button
                onClick={() => setShowMigrationPanel(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue rounded-lg transition-colors"
                title="모드 마이그레이션"
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline text-sm">마이그레이션</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Expanded Context Panel */}
        <AnimatePresence>
          {contextPanelExpanded && dialogueContext && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-ui-border-100 bg-ui-surface-50/50"
            >
              <div className="max-w-6xl mx-auto px-4 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-ui-text-300">현재 감정:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      <span className="text-ui-text-100">{dialogueContext.characterEmotion}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-ui-text-300">환경:</span>
                    <div className="text-ui-text-100 mt-1">
                      {dialogueContext.environmentContext?.timeOfDay === 'morning' ? '🌅 아침' :
                       dialogueContext.environmentContext?.timeOfDay === 'afternoon' ? '☀️ 오후' :
                       dialogueContext.environmentContext?.timeOfDay === 'evening' ? '🌆 저녁' : '🌙 밤'}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-ui-text-300">관계 수준:</span>
                    <div className="text-ui-text-100 mt-1">
                      레벨 {character?.relationshipStatus.level || 1}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-ui-text-300">서비스 상태:</span>
                    <div className="text-ui-text-100 mt-1 flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                      <span>{status?.servicesRegistered || 0}개 서비스</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Chat Interface */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Window - Main Content */}
          <div className="lg:col-span-3">
            <div className="h-[calc(100vh-200px)]">
              <ChatWindow />
            </div>
          </div>
          
          {/* Side Panel - Character Status & Quick Actions */}
          <div className="lg:col-span-1 space-y-4">
            {/* Character Status Card */}
            {character && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-dark-surface/50 backdrop-blur-sm rounded-xl border border-ui-border-100 p-4"
              >
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-neon-blue to-neon-purple rounded-full mx-auto mb-3 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">
                      {character.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-bold text-ui-text-100">{character.name}</h3>
                  <p className="text-sm text-ui-text-300">
                    {character.currentEmotion.dominant} • 친밀도 {Math.round(character.relationshipStatus.intimacyLevel * 100)}%
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-ui-text-300">관계 레벨</span>
                      <span className="text-ui-text-100">{character.relationshipStatus.level}</span>
                    </div>
                    <div className="w-full bg-dark-surface rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-neon-blue to-neon-purple h-2 rounded-full"
                        style={{
                          width: `${(character.relationshipStatus.experience / character.relationshipStatus.experienceToNext) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-ui-text-300">신뢰도</span>
                      <span className="text-ui-text-100">{Math.round(character.relationshipStatus.trustLevel * 100)}%</span>
                    </div>
                    <div className="w-full bg-dark-surface rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full"
                        style={{ width: `${character.relationshipStatus.trustLevel * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Quick Mode Switch */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-dark-surface/50 backdrop-blur-sm rounded-xl border border-ui-border-100 p-4"
            >
              <h4 className="font-semibold text-ui-text-100 mb-3">빠른 모드 전환</h4>
              <div className="space-y-2">
                {[
                  { mode: 'emotion_sync' as const, label: '감정 교감', icon: '💕' },
                  { mode: 'daily_activity' as const, label: '일상 활동', icon: '🌱' },
                  { mode: 'exploration' as const, label: '탐험', icon: '🗺️' }
                ].map((item) => (
                  <button
                    key={item.mode}
                    onClick={() => switchMode(item.mode)}
                    className="w-full flex items-center space-x-3 p-2 bg-ui-surface-100 hover:bg-ui-surface-200 rounded-lg transition-colors text-left"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm text-ui-text-100">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
            
            {/* Service Integration Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-dark-surface/50 backdrop-blur-sm rounded-xl border border-ui-border-100 p-4"
            >
              <h4 className="font-semibold text-ui-text-100 mb-3">시스템 상태</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ui-text-300">서비스 통합</span>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                    <span className="text-ui-text-100">{isReady ? '활성' : '준비 중'}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-ui-text-300">등록된 서비스</span>
                  <span className="text-ui-text-100">{status?.servicesRegistered || 0}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ui-text-300">건강 검사</span>
                  <span className={`text-sm ${status?.healthChecksEnabled ? 'text-green-400' : 'text-gray-400'}`}>
                    {status?.healthChecksEnabled ? '활성' : '비활성'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Migration Panel */}
      <DialogueMigrationPanel
        isOpen={showMigrationPanel}
        onClose={() => setShowMigrationPanel(false)}
        onMigrationComplete={(targetMode) => {
          console.log(`Migration completed to ${targetMode}`)
        }}
      />
      
      {/* Loading Overlay */}
      <AnimatePresence>
        {!isReady && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-dark-navy/80 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-neon-blue/20 border-t-neon-blue rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-ui-text-100 font-medium">Service Integration 초기화 중...</p>
              <p className="text-sm text-ui-text-300 mt-2">
                대화 기능을 위한 서비스를 준비하고 있습니다
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default EnhancedConversationScreen