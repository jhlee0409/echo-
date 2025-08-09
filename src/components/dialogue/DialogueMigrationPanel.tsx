/**
 * 🔄 Dialogue Migration Panel
 * 
 * Interactive UI component for managing dialogue mode migrations.
 * Provides safe migration controls with preview functionality.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  ArrowRight, 
  Eye, 
  Settings,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Zap
} from 'lucide-react'

import { useGameMode } from '@components/ui/GameUI/GameModeRouter'
import { useDialogueMigrationService } from '@services/dialogue/DialogueMigrationService'
import type { GameMode } from '@components/ui/GameUI/GameModeRouter'
import type { DialogueContext, DialogueMigrationConfig } from '@services/dialogue/DialogueMigrationService'

interface DialogueMigrationPanelProps {
  isOpen: boolean
  onClose: () => void
  onMigrationComplete?: (targetMode: GameMode) => void
}

const DialogueMigrationPanel: React.FC<DialogueMigrationPanelProps> = ({
  isOpen,
  onClose,
  onMigrationComplete
}) => {
  const { currentMode, switchMode, canSwitchTo } = useGameMode()
  const migrationService = useDialogueMigrationService()
  
  const [selectedMode, setSelectedMode] = useState<GameMode>('conversation')
  const [migrationConfig, setMigrationConfig] = useState<DialogueMigrationConfig>(
    migrationService.getConfig()
  )
  const [previewData, setPreviewData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [migrationState, setMigrationState] = useState(migrationService.getMigrationState())

  // Game mode options with metadata
  const gameModes: Array<{
    mode: GameMode
    label: string
    description: string
    icon: React.ReactNode
    difficulty: 'easy' | 'medium' | 'hard'
  }> = [
    {
      mode: 'conversation',
      label: '대화 모드',
      description: 'AI와 자유로운 대화',
      icon: <MessageCircle size={20} />,
      difficulty: 'easy'
    },
    {
      mode: 'emotion_sync',
      label: '감정 교감 모드',
      description: '깊은 감정적 연결',
      icon: <span className="text-pink-400">💕</span>,
      difficulty: 'medium'
    },
    {
      mode: 'exploration',
      label: '탐험 모드',
      description: '함께 새로운 경험 탐색',
      icon: <span className="text-yellow-400">🗺️</span>,
      difficulty: 'medium'
    },
    {
      mode: 'daily_activity',
      label: '일상 활동 모드',
      description: '일상을 함께 공유',
      icon: <span className="text-green-400">🌱</span>,
      difficulty: 'easy'
    },
    {
      mode: 'battle',
      label: '전투 모드',
      description: '협력하여 도전 극복',
      icon: <span className="text-red-400">⚔️</span>,
      difficulty: 'hard'
    }
  ]

  // Update migration state periodically
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setMigrationState(migrationService.getMigrationState())
    }, 500)

    return () => clearInterval(interval)
  }, [isOpen, migrationService])

  // Handle preview generation
  const handlePreview = useCallback(async (targetMode: GameMode) => {
    if (targetMode === currentMode) return

    setIsLoading(true)
    try {
      const context = await migrationService.getEnhancedDialogueContext(currentMode)
      const preview = await migrationService.previewMigration(targetMode, context)
      setPreviewData(preview)
    } catch (error) {
      console.error('Preview failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentMode, migrationService])

  // Handle migration execution
  const handleMigration = useCallback(async (targetMode: GameMode) => {
    if (targetMode === currentMode || !canSwitchTo(targetMode)) return

    setIsLoading(true)
    try {
      const context = await migrationService.getEnhancedDialogueContext(currentMode)
      const result = await migrationService.startMigration(targetMode, context)
      
      if (result.success) {
        // Execute actual mode switch
        switchMode(targetMode)
        onMigrationComplete?.(targetMode)
        onClose()
      }
    } catch (error) {
      console.error('Migration failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentMode, canSwitchTo, migrationService, switchMode, onMigrationComplete, onClose])

  // Handle optimization
  const handleOptimization = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await migrationService.optimizeDialoguePerformance()
      console.log('Performance optimized:', result)
    } catch (error) {
      console.error('Optimization failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [migrationService])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-dark-surface border border-ui-border-100 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-dark-surface/95 backdrop-blur-sm border-b border-ui-border-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-neon-blue to-neon-purple rounded-full flex items-center justify-center">
                  <RefreshCw size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-ui-text-100">
                    대화 모드 마이그레이션
                  </h2>
                  <p className="text-sm text-ui-text-300">
                    현재: <span className="font-medium text-neon-blue">{currentMode}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleOptimization}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Zap size={16} />
                  <span className="text-sm">최적화</span>
                </button>
                
                <button
                  onClick={onClose}
                  className="w-8 h-8 bg-ui-surface-200 hover:bg-ui-surface-300 rounded-lg flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Migration Progress */}
            {migrationState.isActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-400">
                    마이그레이션 진행 중: {migrationState.currentPhase}
                  </span>
                  <span className="text-sm text-ui-text-300">
                    {migrationState.progress}%
                  </span>
                </div>
                <div className="w-full bg-dark-surface rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${migrationState.progress}%` }}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}

            {/* Configuration Panel */}
            <div className="bg-ui-surface-100 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-ui-text-100 mb-4 flex items-center space-x-2">
                <Settings size={20} />
                <span>마이그레이션 설정</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={migrationConfig.preserveState}
                    onChange={(e) => setMigrationConfig(prev => ({
                      ...prev,
                      preserveState: e.target.checked
                    }))}
                    className="w-4 h-4 text-neon-blue bg-dark-surface border-ui-border-200 rounded focus:ring-neon-blue focus:ring-2"
                  />
                  <span className="text-sm text-ui-text-200">상태 보존</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={migrationConfig.contextAwareness}
                    onChange={(e) => setMigrationConfig(prev => ({
                      ...prev,
                      contextAwareness: e.target.checked
                    }))}
                    className="w-4 h-4 text-neon-blue bg-dark-surface border-ui-border-200 rounded focus:ring-neon-blue focus:ring-2"
                  />
                  <span className="text-sm text-ui-text-200">컨텍스트 인식</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={migrationConfig.enhancedUI}
                    onChange={(e) => setMigrationConfig(prev => ({
                      ...prev,
                      enhancedUI: e.target.checked
                    }))}
                    className="w-4 h-4 text-neon-blue bg-dark-surface border-ui-border-200 rounded focus:ring-neon-blue focus:ring-2"
                  />
                  <span className="text-sm text-ui-text-200">향상된 UI</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={migrationConfig.enablePreview}
                    onChange={(e) => setMigrationConfig(prev => ({
                      ...prev,
                      enablePreview: e.target.checked
                    }))}
                    className="w-4 h-4 text-neon-blue bg-dark-surface border-ui-border-200 rounded focus:ring-neon-blue focus:ring-2"
                  />
                  <span className="text-sm text-ui-text-200">미리보기 활성화</span>
                </label>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm text-ui-text-200 mb-2">성능 모드</label>
                <select
                  value={migrationConfig.performanceMode}
                  onChange={(e) => setMigrationConfig(prev => ({
                    ...prev,
                    performanceMode: e.target.value as any
                  }))}
                  className="w-full bg-dark-surface border border-ui-border-200 rounded-lg px-3 py-2 text-ui-text-100 focus:outline-none focus:ring-2 focus:ring-neon-blue"
                >
                  <option value="standard">표준</option>
                  <option value="optimized">최적화</option>
                  <option value="experimental">실험적</option>
                </select>
              </div>
            </div>

            {/* Mode Selection Grid */}
            <div>
              <h3 className="text-lg font-semibold text-ui-text-100 mb-4">
                대상 모드 선택
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gameModes.map((mode) => {
                  const isCurrentMode = mode.mode === currentMode
                  const canSwitch = canSwitchTo(mode.mode)
                  const isSelected = selectedMode === mode.mode
                  
                  return (
                    <motion.div
                      key={mode.mode}
                      className={`
                        relative border rounded-lg p-4 cursor-pointer transition-all duration-200
                        ${isCurrentMode 
                          ? 'bg-neon-blue/10 border-neon-blue/30 cursor-not-allowed' 
                          : canSwitch 
                            ? 'bg-ui-surface-100 border-ui-border-200 hover:border-neon-blue/50' 
                            : 'bg-ui-surface-50 border-ui-border-100 opacity-50 cursor-not-allowed'
                        }
                        ${isSelected ? 'ring-2 ring-neon-blue' : ''}
                      `}
                      whileHover={canSwitch && !isCurrentMode ? { scale: 1.02 } : {}}
                      onClick={() => {
                        if (canSwitch && !isCurrentMode) {
                          setSelectedMode(mode.mode)
                          if (migrationConfig.enablePreview) {
                            handlePreview(mode.mode)
                          }
                        }
                      }}
                    >
                      {isCurrentMode && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle size={16} className="text-neon-blue" />
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-3 mb-2">
                        {mode.icon}
                        <div>
                          <h4 className="font-semibold text-ui-text-100">
                            {mode.label}
                          </h4>
                          <p className="text-sm text-ui-text-300">
                            {mode.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`
                          text-xs px-2 py-1 rounded-full
                          ${mode.difficulty === 'easy' 
                            ? 'bg-green-500/20 text-green-400' 
                            : mode.difficulty === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }
                        `}>
                          {mode.difficulty === 'easy' ? '쉬움' : mode.difficulty === 'medium' ? '보통' : '어려움'}
                        </span>
                        
                        {isSelected && canSwitch && (
                          <div className="flex items-center space-x-2">
                            {migrationConfig.enablePreview && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePreview(mode.mode)
                                }}
                                disabled={isLoading}
                                className="flex items-center space-x-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs rounded transition-colors disabled:opacity-50"
                              >
                                <Eye size={12} />
                                <span>미리보기</span>
                              </button>
                            )}
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMigration(mode.mode)
                              }}
                              disabled={isLoading || migrationState.isActive}
                              className="flex items-center space-x-1 px-3 py-1 bg-neon-blue hover:bg-neon-blue/80 text-white text-xs rounded transition-colors disabled:opacity-50"
                            >
                              <ArrowRight size={12} />
                              <span>마이그레이션</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Preview Results */}
            {previewData && selectedMode !== currentMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-ui-surface-100 rounded-lg p-4"
              >
                <h3 className="text-lg font-semibold text-ui-text-100 mb-4 flex items-center space-x-2">
                  <Eye size={20} />
                  <span>마이그레이션 미리보기</span>
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    {previewData.feasible ? (
                      <CheckCircle size={16} className="text-green-400" />
                    ) : (
                      <AlertTriangle size={16} className="text-red-400" />
                    )}
                    <span className={`text-sm font-medium ${
                      previewData.feasible ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {previewData.feasible ? '마이그레이션 가능' : '마이그레이션 불가'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-ui-text-300">예상 소요시간:</span>
                      <span className="ml-2 text-ui-text-100">{previewData.estimatedDuration}ms</span>
                    </div>
                    <div>
                      <span className="text-ui-text-300">위험도:</span>
                      <span className={`ml-2 font-medium ${
                        previewData.riskLevel === 'low' 
                          ? 'text-green-400' 
                          : previewData.riskLevel === 'medium' 
                            ? 'text-yellow-400' 
                            : 'text-red-400'
                      }`}>
                        {previewData.riskLevel === 'low' ? '낮음' : previewData.riskLevel === 'medium' ? '보통' : '높음'}
                      </span>
                    </div>
                  </div>
                  
                  {previewData.requiredChanges.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-ui-text-100 mb-2">필요한 변경사항:</h4>
                      <ul className="space-y-1">
                        {previewData.requiredChanges.map((change: string, index: number) => (
                          <li key={index} className="text-sm text-ui-text-300 flex items-start space-x-2">
                            <span className="text-yellow-400">•</span>
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {previewData.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-ui-text-100 mb-2">권장사항:</h4>
                      <ul className="space-y-1">
                        {previewData.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="text-sm text-ui-text-300 flex items-start space-x-2">
                            <span className="text-blue-400">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default DialogueMigrationPanel