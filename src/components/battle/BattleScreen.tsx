/**
 * 🗡️ Main Battle Screen Component
 * 
 * Complete battle interface with real-time combat visualization
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { 
  BattleResult, 
  BattleFormation, 
  BattleUnit, 
  BattleEvent,
  BattleLogEntry 
} from '@/systems/battle/types'
import { AutoBattleSystem } from '@/systems/battle/AutoBattleSystem'
import { BattleHUD } from './BattleHUD'
import { BattleField } from './BattleField'
import { BattleLog } from './BattleLog'
import { SkillMenu } from './SkillMenu'
import { BattleVictoryScreen } from './BattleVictoryScreen'
// import { useCharacterContext } from '@/contexts/CharacterContext' // Context not found

interface BattleScreenProps {
  initialFormation: BattleFormation
  onBattleEnd: (result: BattleResult) => void
  onEscape?: () => void
  className?: string
}

export function BattleScreen({
  initialFormation,
  onBattleEnd,
  onEscape,
  className = ''
}: BattleScreenProps) {
  const [battleState, setBattleState] = useState<'preparing' | 'active' | 'ended'>('preparing')
  const [battleSystem, setBattleSystem] = useState<AutoBattleSystem | null>(null)
  const [currentFormation] = useState<BattleFormation>(initialFormation)
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null)
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([])
  const [currentTurn, setCurrentTurn] = useState<number>(0)
  const [isShowingSkillMenu, setIsShowingSkillMenu] = useState<boolean>(false)
  const [selectedUnit, setSelectedUnit] = useState<BattleUnit | null>(null)
  const [battleEvents, setBattleEvents] = useState<BattleEvent[]>([])
  
  // const { updateCharacterExperience, updateCharacterRelationship } = useCharacterContext() // Context not available

  // Initialize battle system
  useEffect(() => {
    const system = new AutoBattleSystem({
      turnTimeLimit: 30,
      animationSpeed: 1.0,
      difficultyMultiplier: 1.0,
      companionAILevel: 'adaptive',
      enemyAILevel: 'normal',
      allowEscape: true,
      autoRevive: false,
      showDamageNumbers: true
    })

    // Subscribe to battle events
    system.on('battle_start', handleBattleStart)
    system.on('turn_start', handleTurnStart)
    system.on('turn_end', handleTurnEnd)
    system.on('battle_end', handleBattleEnd)
    system.on('unit_death', handleUnitDeath)
    system.on('skill_used', handleSkillUsed)
    system.on('critical_hit', handleCriticalHit)

    setBattleSystem(system)

    return () => {
      // Cleanup event listeners
      system.removeAllListeners()
    }
  }, [])

  // Event handlers
  const handleBattleStart = useCallback((event: BattleEvent) => {
    console.log('🗡️ Battle started:', event.data)
    setBattleState('active')
    addToBattleLog({
      turnNumber: 0,
      actorName: 'System',
      action: 'battle_start',
      message: '전투가 시작되었습니다!',
      timestamp: new Date()
    })
  }, [])

  const handleTurnStart = useCallback((event: BattleEvent) => {
    const { turnNumber } = event.data
    setCurrentTurn(turnNumber)
    setBattleEvents(prev => [...prev, event])
  }, [])

  const handleTurnEnd = useCallback((event: BattleEvent) => {
    // const { turn } = event.data // Turn data not currently used
    // Update formation with latest unit states
    // This would need to be implemented based on battle system integration
    setBattleEvents(prev => [...prev, event])
  }, [])

  const handleBattleEnd = useCallback((event: BattleEvent) => {
    const { result } = event.data
    console.log('⚔️ Battle ended:', result)
    
    setBattleResult(result)
    setBattleState('ended')
    setBattleEvents(prev => [...prev, event])

    // Update character progression
    if (result.victory) {
      updateCharacterExperience(result.experienceGained.companion)
      updateCharacterRelationship(result.experienceGained.companion * 0.1)
      
      addToBattleLog({
        turnNumber: currentTurn,
        actorName: 'System',
        action: 'victory',
        message: `승리! 경험치 ${result.experienceGained.player + result.experienceGained.companion}를 획득했습니다!`,
        timestamp: new Date()
      })
    } else {
      addToBattleLog({
        turnNumber: currentTurn,
        actorName: 'System',
        action: 'defeat',
        message: '패배했습니다...',
        timestamp: new Date()
      })
    }

    // Notify parent component after a brief delay
    setTimeout(() => {
      onBattleEnd(result)
    }, 2000)
  }, [currentTurn, updateCharacterExperience, updateCharacterRelationship, onBattleEnd])

  const handleUnitDeath = useCallback((event: BattleEvent) => {
    const { unit } = event.data
    addToBattleLog({
      turnNumber: currentTurn,
      actorName: unit.name,
      action: 'death',
      message: `${unit.name}이(가) 쓰러졌습니다!`,
      timestamp: new Date()
    })
    setBattleEvents(prev => [...prev, event])
  }, [currentTurn])

  const handleSkillUsed = useCallback((event: BattleEvent) => {
    const { caster, skill, target, damage, healing } = event.data
    let message = `${caster.name}이(가) ${skill.name}을(를) 사용했습니다!`
    
    if (damage > 0 && target) {
      message += ` ${target.name}에게 ${damage} 데미지!`
    }
    if (healing > 0 && target) {
      message += ` ${target.name}을(를) ${healing} 회복!`
    }

    addToBattleLog({
      turnNumber: currentTurn,
      actorName: caster.name,
      action: 'skill',
      targetName: target?.name,
      damage,
      healing,
      message,
      timestamp: new Date()
    })
    setBattleEvents(prev => [...prev, event])
  }, [currentTurn])

  const handleCriticalHit = useCallback((event: BattleEvent) => {
    const { attacker, target, damage } = event.data
    addToBattleLog({
      turnNumber: currentTurn,
      actorName: attacker.name,
      action: 'critical_hit',
      targetName: target.name,
      damage,
      message: `💥 ${attacker.name}의 치명타! ${target.name}에게 ${damage} 데미지!`,
      timestamp: new Date()
    })
    setBattleEvents(prev => [...prev, event])
  }, [currentTurn])

  const addToBattleLog = useCallback((entry: BattleLogEntry) => {
    setBattleLog(prev => [...prev, entry])
  }, [])

  // Start battle when system is ready
  const startBattle = useCallback(async () => {
    if (!battleSystem || battleState !== 'preparing') return

    try {
      console.log('🚀 Starting automated battle...')
      const result = await battleSystem.executeBattle(currentFormation)
      console.log('✅ Battle completed:', result)
    } catch (error) {
      console.error('❌ Battle error:', error)
      addToBattleLog({
        turnNumber: currentTurn,
        actorName: 'System',
        action: 'error',
        message: '전투 중 오류가 발생했습니다.',
        timestamp: new Date()
      })
    }
  }, [battleSystem, battleState, currentFormation, currentTurn])

  // Auto-start battle when ready
  useEffect(() => {
    if (battleSystem && battleState === 'preparing') {
      const timer = setTimeout(startBattle, 1000) // Brief delay for UI setup
      return () => clearTimeout(timer)
    }
  }, [battleSystem, battleState, startBattle])

  const handleSkillSelect = (skillId: string, targetId?: string) => {
    // This would integrate with the battle system for player input
    console.log(`Player selected skill ${skillId} on target ${targetId}`)
    setIsShowingSkillMenu(false)
    setSelectedUnit(null)
  }

  const handleUnitClick = (unit: BattleUnit) => {
    if (unit.type === 'player' || unit.type === 'companion') {
      setSelectedUnit(unit)
      setIsShowingSkillMenu(true)
    }
  }

  const handleEscape = () => {
    if (onEscape) {
      onEscape()
    }
  }

  if (battleState === 'ended' && battleResult) {
    return (
      <BattleVictoryScreen
        result={battleResult}
        onContinue={() => onBattleEnd(battleResult)}
        className={className}
      />
    )
  }

  return (
    <div className={`battle-screen relative w-full h-full bg-gradient-to-b from-slate-900 to-slate-800 ${className}`}>
      {/* Battle HUD */}
      <BattleHUD
        playerTeam={currentFormation.playerTeam}
        enemyTeam={currentFormation.enemyTeam}
        currentTurn={currentTurn}
        onEscape={handleEscape}
        className="absolute top-0 left-0 right-0 z-10"
      />

      {/* Main Battle Area */}
      <div className="flex-1 flex">
        {/* Battle Field */}
        <div className="flex-1 relative">
          <BattleField
            formation={currentFormation}
            battleEvents={battleEvents}
            onUnitClick={handleUnitClick}
            className="h-full"
          />

          {/* Battle Status */}
          {battleState === 'preparing' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            >
              <div className="bg-black/80 backdrop-blur-sm rounded-lg p-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">전투 준비 중...</h2>
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Battle Log */}
        <BattleLog
          entries={battleLog}
          className="w-80 border-l border-slate-700"
        />
      </div>

      {/* Skill Menu Overlay */}
      <AnimatePresence>
        {isShowingSkillMenu && selectedUnit && (
          <SkillMenu
            unit={selectedUnit}
            availableTargets={[...currentFormation.playerTeam, ...currentFormation.enemyTeam].filter(u => u.isAlive)}
            onSkillSelect={handleSkillSelect}
            onClose={() => {
              setIsShowingSkillMenu(false)
              setSelectedUnit(null)
            }}
            className="absolute inset-0 z-50"
          />
        )}
      </AnimatePresence>

      {/* Battle Effects Layer */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* This would contain floating damage numbers, spell effects, etc. */}
      </div>
    </div>
  )
}

export default BattleScreen