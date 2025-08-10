/**
 * ⚔️ Battle Field Component
 * 
 * 3D-style battle arena with animated units and effects
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BattleFormation, BattleUnit, BattleEvent } from '@/systems/battle/types'

interface BattleFieldProps {
  formation: BattleFormation
  battleEvents: BattleEvent[]
  onUnitClick?: (unit: BattleUnit) => void
  className?: string
}

interface FloatingText {
  id: string
  text: string
  type: 'damage' | 'healing' | 'miss' | 'critical'
  x: number
  y: number
  timestamp: number
}

export function BattleField({
  formation,
  battleEvents,
  onUnitClick,
  className = ''
}: BattleFieldProps) {
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([])
  const [animations, setAnimations] = useState<Map<string, string>>(new Map())

  // Process battle events for visual effects
  useEffect(() => {
    const latestEvent = battleEvents[battleEvents.length - 1]
    if (!latestEvent) return

    switch (latestEvent.type) {
      case 'skill_used':
        handleSkillUsedAnimation(latestEvent)
        break
      case 'critical_hit':
        handleCriticalHitAnimation(latestEvent)
        break
      case 'unit_death':
        handleUnitDeathAnimation(latestEvent)
        break
    }
  }, [battleEvents])

  const handleSkillUsedAnimation = (event: BattleEvent) => {
    const { caster, target, damage, healing } = event.data
    
    // Add skill animation to caster
    setAnimations(prev => new Map(prev.set(caster.id, 'attacking')))
    setTimeout(() => {
      setAnimations(prev => {
        const newMap = new Map(prev)
        newMap.delete(caster.id)
        return newMap
      })
    }, 600)

    // Add floating text for damage/healing
    if (target && (damage > 0 || healing > 0)) {
      addFloatingText(
        damage > 0 ? `-${damage}` : `+${healing}`,
        damage > 0 ? 'damage' : 'healing',
        target.id
      )
    }

    // Target hit animation
    if (target && damage > 0) {
      setAnimations(prev => new Map(prev.set(target.id, 'damaged')))
      setTimeout(() => {
        setAnimations(prev => {
          const newMap = new Map(prev)
          newMap.delete(target.id)
          return newMap
        })
      }, 400)
    }
  }

  const handleCriticalHitAnimation = (event: BattleEvent) => {
    const { target, damage } = event.data
    
    addFloatingText(`-${damage}`, 'critical', target.id)
    
    setAnimations(prev => new Map(prev.set(target.id, 'critical-hit')))
    setTimeout(() => {
      setAnimations(prev => {
        const newMap = new Map(prev)
        newMap.delete(target.id)
        return newMap
      })
    }, 800)
  }

  const handleUnitDeathAnimation = (event: BattleEvent) => {
    const { unit } = event.data
    
    setAnimations(prev => new Map(prev.set(unit.id, 'dying')))
    // Death animation persists until component unmounts
  }

  const addFloatingText = (text: string, type: FloatingText['type'], unitId: string) => {
    // Find unit position (simplified - would need actual positioning logic)
    const isPlayerTeam = formation.playerTeam.some(u => u.id === unitId)
    const baseX = isPlayerTeam ? 200 : 600
    const baseY = 300
    
    const floatingText: FloatingText = {
      id: `${unitId}-${Date.now()}-${Math.random()}`,
      text,
      type,
      x: baseX + (Math.random() - 0.5) * 100,
      y: baseY + (Math.random() - 0.5) * 50,
      timestamp: Date.now()
    }

    setFloatingTexts(prev => [...prev, floatingText])

    // Remove after animation
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(ft => ft.id !== floatingText.id))
    }, 2000)
  }

  const getUnitSprite = (unit: BattleUnit): string => {
    // Map unit types to emoji sprites (could be actual images)
    const spriteMap: Record<string, string> = {
      player: '🤺',
      companion: '🧚‍♀️',
      enemy: '👹',
      boss: '👺',
      slime: '🟢',
      goblin: '👹',
      wolf: '🐺',
      spider: '🕷️',
      orc: '👹',
      troll: '👹',
      dragon_hatchling: '🐉'
    }

    return spriteMap[unit.id.split('_')[0]] || spriteMap[unit.type] || '❓'
  }

  const getAnimationClass = (unitId: string): string => {
    const animation = animations.get(unitId)
    switch (animation) {
      case 'attacking':
        return 'animate-pulse scale-110'
      case 'damaged':
        return 'animate-bounce text-red-500'
      case 'critical-hit':
        return 'animate-ping scale-125 text-orange-500'
      case 'dying':
        return 'opacity-30 scale-75 grayscale'
      default:
        return ''
    }
  }

  const renderUnit = (unit: BattleUnit, isPlayerTeam: boolean, index: number) => {
    const positionClass = isPlayerTeam
      ? `left-${16 + index * 24}` // Player team on left
      : `right-${16 + index * 24}` // Enemy team on right

    return (
      <motion.div
        key={unit.id}
        className={`absolute bottom-20 ${positionClass} cursor-pointer select-none ${getAnimationClass(unit.id)}`}
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ 
          opacity: unit.isAlive ? 1 : 0.3, 
          y: 0, 
          scale: unit.isAlive ? 1 : 0.8,
          filter: unit.isAlive ? 'none' : 'grayscale(100%)'
        }}
        whileHover={{ scale: 1.1, y: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onUnitClick?.(unit)}
        style={{
          left: isPlayerTeam ? `${16 + index * 15}%` : 'auto',
          right: isPlayerTeam ? 'auto' : `${16 + index * 15}%`
        }}
      >
        {/* Unit Sprite */}
        <div className="text-6xl mb-2 transition-all duration-300">
          {getUnitSprite(unit)}
        </div>

        {/* Unit Name */}
        <div className="text-center">
          <div className="bg-black/60 backdrop-blur-sm rounded px-2 py-1 text-sm text-white font-medium">
            {unit.name}
          </div>
        </div>

        {/* HP Bar (simplified) */}
        <div className="w-16 h-1.5 bg-gray-700 rounded-full mt-1 mx-auto">
          <motion.div
            className={`h-full rounded-full transition-all duration-300 ${
              unit.hp / unit.maxHp > 0.5 ? 'bg-green-500' :
              unit.hp / unit.maxHp > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }}
            animate={{ width: `${(unit.hp / unit.maxHp) * 100}%` }}
          />
        </div>

        {/* Status Effects */}
        {((unit.buffs?.length || 0) > 0 || (unit.debuffs?.length || 0) > 0) && (
          <div className="flex justify-center mt-1 space-x-1">
            {unit.buffs?.slice(0, 3).map((buff, i) => (
              <div
                key={`buff-${i}`}
                className="w-3 h-3 bg-green-500 rounded-full text-xs flex items-center justify-center"
                title={buff.description}
              >
                {buff.icon || '+'}
              </div>
            ))}
            {unit.debuffs?.slice(0, 3).map((debuff, i) => (
              <div
                key={`debuff-${i}`}
                className="w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center"
                title={debuff.description}
              >
                {debuff.icon || '-'}
              </div>
            ))}
          </div>
        )}

        {/* Selection Ring */}
        <motion.div
          className="absolute inset-0 border-2 border-blue-400 rounded-full opacity-0"
          whileHover={{ opacity: 1, scale: 1.2 }}
          style={{ borderRadius: '50%' }}
        />
      </motion.div>
    )
  }

  return (
    <div className={`battle-field relative w-full h-full overflow-hidden ${className}`}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-blue-900/20">
        {/* Battle Arena Floor */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-700 to-transparent opacity-60" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
        </div>
      </div>

      {/* Battle Environment Effects */}
      {formation.environment && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Environment-specific visual effects would go here */}
        </div>
      )}

      {/* Player Team */}
      <div className="absolute left-0 top-0 w-1/2 h-full">
        {formation.playerTeam.map((unit, index) => 
          renderUnit(unit, true, index)
        )}
      </div>

      {/* Enemy Team */}
      <div className="absolute right-0 top-0 w-1/2 h-full">
        {formation.enemyTeam.map((unit, index) => 
          renderUnit(unit, false, index)
        )}
      </div>

      {/* Center Divider */}
      <div className="absolute left-1/2 top-0 w-px h-full bg-gradient-to-b from-transparent via-slate-400/30 to-transparent transform -translate-x-px" />

      {/* Floating Damage Text */}
      <AnimatePresence>
        {floatingTexts.map((floatingText) => (
          <motion.div
            key={floatingText.id}
            className={`absolute pointer-events-none text-2xl font-bold z-30 ${
              floatingText.type === 'damage' ? 'text-red-400' :
              floatingText.type === 'healing' ? 'text-green-400' :
              floatingText.type === 'critical' ? 'text-orange-400 text-3xl' :
              'text-gray-400'
            }`}
            style={{ left: floatingText.x, top: floatingText.y }}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              y: -60,
              scale: floatingText.type === 'critical' ? [0.8, 1.3, 1.2, 1] : [0.8, 1.1, 1, 1],
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 2, ease: 'easeOut' }}
          >
            {floatingText.text}
            {floatingText.type === 'critical' && (
              <div className="text-sm text-orange-300 ml-1 inline-block animate-pulse">
                💥
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Battle Effect Overlays */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* Screen shake, flash effects, etc. would go here */}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
          <div className="text-sm text-gray-300">
            유닛을 클릭하여 스킬을 사용하거나 상태를 확인하세요
          </div>
        </div>
      </div>
    </div>
  )
}

export default BattleField