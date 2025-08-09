/**
 * 🗡️ Battle System Types - execution-plan.md Implementation
 * 
 * Core types for the automated battle system including:
 * - Battle units and stats
 * - Combat mechanics
 * - Battle results and rewards
 */

import type { EmotionType } from '@types'

// Core battle unit interface
export interface BattleUnit {
  // Identity
  id: string
  name: string
  type: 'player' | 'companion' | 'enemy' | 'boss'

  // Core Stats
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  attack: number
  defense: number
  speed: number

  // Advanced Combat Stats
  critRate: number          // Critical hit rate (0-100)
  critDamage: number        // Critical hit damage multiplier (default 150)
  accuracy: number          // Hit chance (0-100)
  evasion: number          // Dodge chance (0-100)

  // Skills and Effects
  skills: BattleSkill[]
  buffs: StatusEffect[]
  debuffs: StatusEffect[]

  // State
  isAlive: boolean
  
  // AI Companion specific
  personality?: PersonalityInfluence
  emotionalState?: EmotionType
}

export interface BattleSkill {
  id: string
  name: string
  description: string
  
  // Costs and Requirements
  mpCost: number
  cooldownTurns: number
  currentCooldown: number
  
  // Effects
  damage: number
  healAmount?: number
  targetType: 'single' | 'all_enemies' | 'all_allies' | 'self'
  element?: ElementType
  
  // Status Effects
  statusEffects?: StatusEffect[]
  
  // AI Usage
  aiPriority: number        // 0-100, higher = more likely to use
  requiredConditions?: SkillCondition[]
}

export interface StatusEffect {
  id: string
  name: string
  type: 'buff' | 'debuff'
  duration: number          // Remaining turns
  
  // Stat modifications
  statModifiers: {
    attack?: number
    defense?: number
    speed?: number
    critRate?: number
    accuracy?: number
    evasion?: number
  }
  
  // Per-turn effects
  damagePerTurn?: number    // DoT/HoT
  mpRegenPerTurn?: number
  
  // Visual
  icon: string
  description: string
}

export interface PersonalityInfluence {
  // How personality affects battle behavior
  aggression: number        // 0-1, affects attack frequency
  caution: number          // 0-1, affects defensive actions
  support: number          // 0-1, affects healing/buff priority
  independence: number     // 0-1, affects solo vs team actions
}

export type ElementType = 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark' | 'neutral'

export interface SkillCondition {
  type: 'hp_below' | 'hp_above' | 'mp_above' | 'ally_hp_below' | 'enemy_count'
  value: number
  target?: 'self' | 'ally' | 'enemy'
}

// Battle flow types
export interface BattleAction {
  actorId: string
  actionType: 'attack' | 'skill' | 'defend' | 'item' | 'escape'
  targetId?: string
  skillId?: string
  itemId?: string
}

export interface BattleTurn {
  turnNumber: number
  actions: BattleActionResult[]
  turnOrder: string[]       // Unit IDs in speed order
}

export interface BattleActionResult {
  action: BattleAction
  success: boolean
  damage?: number
  healing?: number
  criticalHit: boolean
  missed: boolean
  dodged: boolean
  statusEffectsApplied: StatusEffect[]
  message: string           // Battle log message
}

export interface BattleResult {
  victory: boolean
  turns: number
  battleLog: BattleLogEntry[]
  statistics: BattleStatistics
  rewards: BattleRewards
  experienceGained: {
    player: number
    companion: number
  }
}

export interface BattleLogEntry {
  turnNumber: number
  actorName: string
  action: string
  targetName?: string
  damage?: number
  healing?: number
  message: string
  timestamp: Date
}

export interface BattleStatistics {
  totalDamageDealt: number
  totalDamageReceived: number
  totalHealing: number
  skillsUsed: number
  criticalHits: number
  missedAttacks: number
  statusEffectsApplied: number
}

export interface BattleRewards {
  experience: number
  gold: number
  items: BattleItem[]
  relationshipBonus?: number  // For companion bonding
}

export interface BattleItem {
  id: string
  name: string
  type: 'consumable' | 'equipment' | 'material'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  quantity: number
}

// Battle configuration
export interface BattleConfig {
  // Timing
  turnTimeLimit: number     // Seconds for player decision
  animationSpeed: number    // Battle animation speed multiplier
  
  // Difficulty
  difficultyMultiplier: number  // Global difficulty modifier
  
  // AI Behavior
  companionAILevel: 'basic' | 'adaptive' | 'advanced'
  enemyAILevel: 'simple' | 'normal' | 'intelligent'
  
  // Features
  allowEscape: boolean
  autoRevive: boolean
  showDamageNumbers: boolean
}

// Enemy templates
export interface EnemyTemplate {
  id: string
  name: string
  description: string
  
  // Base stats (scaled by level)
  baseHp: number
  baseAttack: number
  baseDefense: number
  baseSpeed: number
  
  // Growth per level
  hpGrowth: number
  attackGrowth: number
  defenseGrowth: number
  
  // Skills
  skillSet: string[]        // Skill IDs
  
  // Behavior
  aiPattern: EnemyAIPattern
  
  // Rewards
  baseExp: number
  baseGold: number
  dropTable: DropTableEntry[]
  
  // Visual
  sprite: string
  battleSprite?: string
}

export interface EnemyAIPattern {
  type: 'aggressive' | 'defensive' | 'balanced' | 'support' | 'berserker'
  skillUseProbability: number    // 0-1
  targetPriority: TargetPriority
  specialBehaviors: string[]     // Special AI behaviors
}

export type TargetPriority = 'weakest' | 'strongest' | 'lowest_hp' | 'highest_threat' | 'random'

export interface DropTableEntry {
  itemId: string
  probability: number      // 0-1
  minQuantity: number
  maxQuantity: number
}

// Battle formation and setup
export interface BattleFormation {
  playerTeam: BattleUnit[]
  enemyTeam: BattleUnit[]
  environment?: BattleEnvironment
}

export interface BattleEnvironment {
  id: string
  name: string
  description: string
  effects: EnvironmentEffect[]
  backgroundImage: string
  music?: string
}

export interface EnvironmentEffect {
  type: 'stat_modifier' | 'damage_over_time' | 'skill_boost'
  target: 'all' | 'player_team' | 'enemy_team'
  value: number
  description: string
}

// Event system
export type BattleEventType = 
  | 'battle_start'
  | 'battle_end' 
  | 'turn_start'
  | 'turn_end'
  | 'unit_death'
  | 'skill_used'
  | 'critical_hit'
  | 'status_applied'

export interface BattleEvent {
  type: BattleEventType
  data: any
  timestamp: Date
}

export type BattleEventListener = (event: BattleEvent) => void