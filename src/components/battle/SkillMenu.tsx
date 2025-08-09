/**
 * 🎯 Skill Menu Component
 * 
 * Interactive skill selection with target choosing and cooldown tracking
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BattleUnit, BattleSkill } from '@systems/battle/types'

interface SkillMenuProps {
  unit: BattleUnit
  availableTargets: BattleUnit[]
  onSkillSelect: (skillId: string, targetId?: string) => void
  onClose: () => void
  className?: string
}

interface TargetSelectionState {
  skill: BattleSkill
  isSelectingTarget: boolean
}

export function SkillMenu({
  unit,
  availableTargets,
  onSkillSelect,
  onClose,
  className = ''
}: SkillMenuProps) {
  const [targetSelection, setTargetSelection] = useState<TargetSelectionState | null>(null)

  const canUseSkill = (skill: BattleSkill): boolean => {
    return unit.mp >= skill.mpCost && skill.currentCooldown === 0
  }

  const getSkillTargets = (skill: BattleSkill): BattleUnit[] => {
    switch (skill.targetType) {
      case 'self':
        return [unit]
      case 'single':
        return availableTargets
      case 'all_allies':
        return availableTargets.filter(target => 
          target.type === 'player' || target.type === 'companion'
        )
      case 'all_enemies':
        return availableTargets.filter(target => 
          target.type === 'enemy' || target.type === 'boss'
        )
      default:
        return availableTargets
    }
  }

  const handleSkillClick = (skill: BattleSkill) => {
    if (!canUseSkill(skill)) return

    const targets = getSkillTargets(skill)
    
    // Auto-target skills don't need target selection
    if (skill.targetType === 'self' || skill.targetType === 'all_allies' || skill.targetType === 'all_enemies') {
      onSkillSelect(skill.id, targets[0]?.id)
      return
    }

    // Single target skills need target selection
    if (targets.length > 1) {
      setTargetSelection({
        skill,
        isSelectingTarget: true
      })
    } else if (targets.length === 1) {
      onSkillSelect(skill.id, targets[0].id)
    }
  }

  const handleTargetSelect = (targetId: string) => {
    if (targetSelection) {
      onSkillSelect(targetSelection.skill.id, targetId)
    }
  }

  const getSkillCooldownText = (skill: BattleSkill): string => {
    if (skill.currentCooldown > 0) {
      return `${skill.currentCooldown}턴 후`
    }
    return ''
  }

  const getSkillTypeIcon = (skill: BattleSkill): string => {
    if (skill.damage > 0) return '⚔️'
    if (skill.healAmount && skill.healAmount > 0) return '💚'
    if (skill.statusEffects && skill.statusEffects.length > 0) {
      const hasBuffs = skill.statusEffects.some(effect => effect.type === 'buff')
      const hasDebuffs = skill.statusEffects.some(effect => effect.type === 'debuff')
      if (hasBuffs && hasDebuffs) return '🔮'
      if (hasBuffs) return '✨'
      if (hasDebuffs) return '🌪️'
    }
    return '🎯'
  }

  const getElementColor = (element?: string): string => {
    switch (element) {
      case 'fire': return 'text-red-400'
      case 'water': return 'text-blue-400'
      case 'earth': return 'text-green-400'
      case 'wind': return 'text-cyan-400'
      case 'light': return 'text-yellow-400'
      case 'dark': return 'text-purple-400'
      default: return 'text-gray-300'
    }
  }

  if (targetSelection?.isSelectingTarget) {
    const targets = getSkillTargets(targetSelection.skill)
    
    return (
      <motion.div
        className={`skill-menu-overlay ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setTargetSelection(null)}
        />

        {/* Target Selection */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="bg-slate-800 rounded-lg border border-slate-600 p-6 max-w-md w-full mx-4"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-white mb-2">
                대상 선택
              </h3>
              <div className="text-sm text-gray-300">
                <span className="text-blue-400">{targetSelection.skill.name}</span>의 대상을 선택하세요
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {targets.map((target) => (
                <button
                  key={target.id}
                  onClick={() => handleTargetSelect(target.id)}
                  className="w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{target.name}</div>
                      <div className="text-sm text-gray-400">
                        HP: {target.hp}/{target.maxHp} | MP: {target.mp}/{target.maxMp}
                      </div>
                    </div>
                    <div className="text-2xl">
                      {target.type === 'player' || target.type === 'companion' ? '🤝' : '🎯'}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => setTargetSelection(null)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                취소
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`skill-menu-overlay ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Skill Menu */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="bg-slate-800 rounded-lg border border-slate-600 p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">{unit.name}의 스킬</h3>
              <div className="text-sm text-gray-400 mt-1">
                MP: {unit.mp}/{unit.maxMp}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl"
            >
              ✕
            </button>
          </div>

          {/* Skills List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {unit.skills.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎯</div>
                <div>사용 가능한 스킬이 없습니다</div>
              </div>
            ) : (
              unit.skills.map((skill) => {
                const isUsable = canUseSkill(skill)
                const cooldownText = getSkillCooldownText(skill)

                return (
                  <motion.button
                    key={skill.id}
                    onClick={() => handleSkillClick(skill)}
                    disabled={!isUsable}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      isUsable
                        ? 'bg-slate-700 hover:bg-slate-600 border-slate-600 hover:border-blue-500'
                        : 'bg-slate-800 border-slate-700 opacity-50 cursor-not-allowed'
                    }`}
                    whileHover={isUsable ? { scale: 1.02 } : undefined}
                    whileTap={isUsable ? { scale: 0.98 } : undefined}
                  >
                    <div className="flex items-start justify-between">
                      {/* Skill Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">{getSkillTypeIcon(skill)}</span>
                          <span className={`font-semibold ${getElementColor(skill.element)}`}>
                            {skill.name}
                          </span>
                          {skill.element && (
                            <span className="text-xs px-2 py-1 bg-slate-600 rounded">
                              {skill.element}
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-300 mb-2">
                          {skill.description}
                        </div>

                        {/* Effects */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          {skill.damage > 0 && (
                            <span className="bg-red-600/20 text-red-400 px-2 py-1 rounded">
                              데미지: {skill.damage}
                            </span>
                          )}
                          {skill.healAmount && skill.healAmount > 0 && (
                            <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded">
                              회복: {skill.healAmount}
                            </span>
                          )}
                          {skill.statusEffects && skill.statusEffects.length > 0 && (
                            <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                              효과: {skill.statusEffects.length}개
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cost & Cooldown */}
                      <div className="text-right ml-4">
                        <div className="text-sm text-blue-400 mb-1">
                          MP {skill.mpCost}
                        </div>
                        {cooldownText && (
                          <div className="text-xs text-orange-400">
                            {cooldownText}
                          </div>
                        )}
                        {skill.cooldownTurns > 0 && skill.currentCooldown === 0 && (
                          <div className="text-xs text-gray-500">
                            쿨다운 {skill.cooldownTurns}턴
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Target Type */}
                    <div className="mt-2 text-xs text-gray-500">
                      {skill.targetType === 'self' && '자신 대상'}
                      {skill.targetType === 'single' && '단일 대상'}
                      {skill.targetType === 'all_allies' && '모든 아군'}
                      {skill.targetType === 'all_enemies' && '모든 적'}
                    </div>
                  </motion.button>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex space-x-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
            >
              닫기
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default SkillMenu