/**
 * 🎯 Battle Skills Database
 * 
 * Predefined skills for different unit types with balanced stats
 */

import type { BattleSkill, StatusEffect, SkillCondition } from './types'

// Player Skills
export const playerSkills: Record<string, BattleSkill> = {
  power_strike: {
    id: 'power_strike',
    name: '강력한 일격',
    description: '강력한 공격으로 적에게 큰 데미지를 입힙니다.',
    mpCost: 10,
    cooldownTurns: 2,
    currentCooldown: 0,
    damage: 25,
    targetType: 'single',
    element: 'neutral',
    aiPriority: 70
  },
  
  whirlwind: {
    id: 'whirlwind',
    name: '회오리 베기',
    description: '모든 적에게 피해를 입히는 회전 공격입니다.',
    mpCost: 20,
    cooldownTurns: 4,
    currentCooldown: 0,
    damage: 15,
    targetType: 'all_enemies',
    element: 'wind',
    aiPriority: 80
  },
  
  heal: {
    id: 'heal',
    name: '치유',
    description: 'HP를 회복합니다.',
    mpCost: 15,
    cooldownTurns: 1,
    currentCooldown: 0,
    damage: 0,
    healAmount: 40,
    targetType: 'single',
    aiPriority: 90,
    requiredConditions: [{
      type: 'hp_below',
      value: 0.5,
      target: 'self'
    }]
  }
}

// Companion Skills (personality-based)
export const companionSkills: Record<string, BattleSkill> = {
  // Caring personality skills
  gentle_heal: {
    id: 'gentle_heal',
    name: '부드러운 치유',
    description: '동료를 따뜻하게 치유합니다.',
    mpCost: 12,
    cooldownTurns: 1,
    currentCooldown: 0,
    damage: 0,
    healAmount: 35,
    targetType: 'single',
    aiPriority: 95
  },
  
  protective_shield: {
    id: 'protective_shield',
    name: '보호의 방패',
    description: '동료의 방어력을 일시적으로 증가시킵니다.',
    mpCost: 15,
    cooldownTurns: 3,
    currentCooldown: 0,
    damage: 0,
    targetType: 'single',
    statusEffects: [{
      id: 'defense_boost',
      name: '방어 강화',
      type: 'buff',
      duration: 3,
      statModifiers: {
        defense: 10
      },
      icon: '🛡️',
      description: '방어력이 10 증가'
    }],
    aiPriority: 80
  },
  
  // Playful personality skills
  quick_strike: {
    id: 'quick_strike',
    name: '재빠른 일격',
    description: '빠르고 가벼운 공격입니다.',
    mpCost: 8,
    cooldownTurns: 1,
    currentCooldown: 0,
    damage: 18,
    targetType: 'single',
    aiPriority: 60
  },
  
  encouraging_cheer: {
    id: 'encouraging_cheer',
    name: '격려의 응원',
    description: '동료의 공격력과 속도를 증가시킵니다.',
    mpCost: 20,
    cooldownTurns: 4,
    currentCooldown: 0,
    damage: 0,
    targetType: 'all_allies',
    statusEffects: [{
      id: 'morale_boost',
      name: '사기 증진',
      type: 'buff',
      duration: 4,
      statModifiers: {
        attack: 8,
        speed: 5
      },
      icon: '💪',
      description: '공격력 +8, 속도 +5'
    }],
    aiPriority: 85
  },
  
  // Independent personality skills
  solo_focus: {
    id: 'solo_focus',
    name: '집중',
    description: '자신의 능력을 집중시켜 크리티컬 확률을 증가시킵니다.',
    mpCost: 10,
    cooldownTurns: 3,
    currentCooldown: 0,
    damage: 0,
    targetType: 'self',
    statusEffects: [{
      id: 'focus',
      name: '집중',
      type: 'buff',
      duration: 3,
      statModifiers: {
        critRate: 25,
        accuracy: 15
      },
      icon: '🎯',
      description: '크리티컬 확률 +25%, 명중률 +15%'
    }],
    aiPriority: 70
  },
  
  counter_attack: {
    id: 'counter_attack',
    name: '반격',
    description: '다음 턴에 받는 공격에 대해 자동으로 반격합니다.',
    mpCost: 18,
    cooldownTurns: 4,
    currentCooldown: 0,
    damage: 0,
    targetType: 'self',
    statusEffects: [{
      id: 'counter_stance',
      name: '반격 자세',
      type: 'buff',
      duration: 2,
      statModifiers: {},
      icon: '⚔️',
      description: '공격받을 시 자동 반격'
    }],
    aiPriority: 75
  },
  
  // Curious personality skills
  analyze_enemy: {
    id: 'analyze_enemy',
    name: '적 분석',
    description: '적의 약점을 파악하여 팀의 공격력을 증가시킵니다.',
    mpCost: 15,
    cooldownTurns: 3,
    currentCooldown: 0,
    damage: 0,
    targetType: 'single',
    statusEffects: [{
      id: 'weakness_exposed',
      name: '약점 노출',
      type: 'debuff',
      duration: 4,
      statModifiers: {
        defense: -8
      },
      icon: '🔍',
      description: '방어력 -8'
    }],
    aiPriority: 80
  }
}

// Enemy Skills
export const enemySkills: Record<string, BattleSkill> = {
  // Basic enemy skills
  bite: {
    id: 'bite',
    name: '물어뜯기',
    description: '날카로운 이빨로 물어뜯습니다.',
    mpCost: 5,
    cooldownTurns: 1,
    currentCooldown: 0,
    damage: 12,
    targetType: 'single',
    aiPriority: 60
  },
  
  poison_spit: {
    id: 'poison_spit',
    name: '독침 뱉기',
    description: '독을 뱉어 지속적인 피해를 입힙니다.',
    mpCost: 10,
    cooldownTurns: 3,
    currentCooldown: 0,
    damage: 8,
    targetType: 'single',
    statusEffects: [{
      id: 'poison',
      name: '독',
      type: 'debuff',
      duration: 3,
      statModifiers: {},
      damagePerTurn: -5,
      icon: '☠️',
      description: '매 턴 5 피해'
    }],
    aiPriority: 70
  },
  
  intimidate: {
    id: 'intimidate',
    name: '위협',
    description: '상대를 위협하여 공격력을 감소시킵니다.',
    mpCost: 8,
    cooldownTurns: 2,
    currentCooldown: 0,
    damage: 0,
    targetType: 'all_enemies',
    statusEffects: [{
      id: 'intimidated',
      name: '위축',
      type: 'debuff',
      duration: 2,
      statModifiers: {
        attack: -6
      },
      icon: '😰',
      description: '공격력 -6'
    }],
    aiPriority: 65
  },
  
  howl: {
    id: 'howl',
    name: '울부짖기',
    description: '동료들의 사기를 북돋워 공격력을 증가시킵니다.',
    mpCost: 12,
    cooldownTurns: 4,
    currentCooldown: 0,
    damage: 0,
    targetType: 'all_allies',
    statusEffects: [{
      id: 'pack_fury',
      name: '무리의 분노',
      type: 'buff',
      duration: 3,
      statModifiers: {
        attack: 7,
        speed: 3
      },
      icon: '🐺',
      description: '공격력 +7, 속도 +3'
    }],
    aiPriority: 75
  },
  
  // Boss skills
  devastating_blow: {
    id: 'devastating_blow',
    name: '파멸의 일격',
    description: '강력한 일격으로 큰 피해를 입힙니다.',
    mpCost: 25,
    cooldownTurns: 5,
    currentCooldown: 0,
    damage: 45,
    targetType: 'single',
    element: 'dark',
    aiPriority: 90,
    requiredConditions: [{
      type: 'hp_below',
      value: 0.5,
      target: 'self'
    }]
  },
  
  area_destruction: {
    id: 'area_destruction',
    name: '광역 파괴',
    description: '모든 적에게 피해를 입히는 강력한 공격입니다.',
    mpCost: 35,
    cooldownTurns: 6,
    currentCooldown: 0,
    damage: 30,
    targetType: 'all_enemies',
    element: 'fire',
    aiPriority: 85
  },
  
  regeneration: {
    id: 'regeneration',
    name: '재생',
    description: 'HP를 대량으로 회복합니다.',
    mpCost: 20,
    cooldownTurns: 4,
    currentCooldown: 0,
    damage: 0,
    healAmount: 60,
    targetType: 'self',
    aiPriority: 95,
    requiredConditions: [{
      type: 'hp_below',
      value: 0.3,
      target: 'self'
    }]
  }
}

// Skill utility functions
export function getSkillsByPersonality(personalityTraits: any): BattleSkill[] {
  const skills: BattleSkill[] = []
  
  // Add skills based on dominant personality traits
  if (personalityTraits.caring > 0.6) {
    skills.push(companionSkills.gentle_heal, companionSkills.protective_shield)
  }
  
  if (personalityTraits.playful > 0.6) {
    skills.push(companionSkills.quick_strike, companionSkills.encouraging_cheer)
  }
  
  if (personalityTraits.independent > 0.6) {
    skills.push(companionSkills.solo_focus, companionSkills.counter_attack)
  }
  
  if (personalityTraits.curious > 0.6) {
    skills.push(companionSkills.analyze_enemy)
  }
  
  // Ensure every companion has at least some basic skills
  if (skills.length === 0) {
    skills.push(companionSkills.quick_strike, companionSkills.gentle_heal)
  }
  
  return skills
}

export function getPlayerSkillsForLevel(level: number): BattleSkill[] {
  const skills: BattleSkill[] = []
  
  // Basic attack skill always available
  skills.push(playerSkills.power_strike)
  
  if (level >= 3) {
    skills.push(playerSkills.heal)
  }
  
  if (level >= 5) {
    skills.push(playerSkills.whirlwind)
  }
  
  return skills
}

export function getEnemySkillsForType(enemyType: string): BattleSkill[] {
  const skillSets: Record<string, BattleSkill[]> = {
    slime: [enemySkills.bite],
    goblin: [enemySkills.bite, enemySkills.intimidate],
    wolf: [enemySkills.bite, enemySkills.howl],
    spider: [enemySkills.bite, enemySkills.poison_spit],
    boss_wolf: [enemySkills.bite, enemySkills.howl, enemySkills.devastating_blow],
    boss_dragon: [enemySkills.devastating_blow, enemySkills.area_destruction, enemySkills.regeneration]
  }
  
  return skillSets[enemyType] || [enemySkills.bite]
}

export function createCustomSkill(
  id: string,
  name: string,
  description: string,
  config: Partial<BattleSkill>
): BattleSkill {
  return {
    id,
    name,
    description,
    mpCost: 10,
    cooldownTurns: 1,
    currentCooldown: 0,
    damage: 0,
    targetType: 'single',
    aiPriority: 50,
    ...config
  }
}

// Skill balance constants
export const SKILL_BALANCE = {
  // Damage scaling factors
  BASIC_SKILL_DAMAGE: 20,
  ADVANCED_SKILL_DAMAGE: 35,
  ULTIMATE_SKILL_DAMAGE: 50,
  
  // MP cost scaling
  LOW_MP_COST: 8,
  MEDIUM_MP_COST: 15,
  HIGH_MP_COST: 25,
  
  // Cooldown ranges
  SHORT_COOLDOWN: 1,
  MEDIUM_COOLDOWN: 3,
  LONG_COOLDOWN: 5,
  
  // Healing amounts
  BASIC_HEAL: 30,
  STRONG_HEAL: 50,
  MASTER_HEAL: 80
}

export default {
  playerSkills,
  companionSkills,
  enemySkills,
  getSkillsByPersonality,
  getPlayerSkillsForLevel,
  getEnemySkillsForType,
  createCustomSkill,
  SKILL_BALANCE
}