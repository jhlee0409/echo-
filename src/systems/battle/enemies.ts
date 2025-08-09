/**
 * 🐺 Enemy Templates and Factory
 * 
 * Predefined enemy templates with balanced stats and AI patterns
 */

import type { BattleUnit, EnemyTemplate, EnemyAIPattern, DropTableEntry } from './types'
import { getEnemySkillsForType } from './skills'

// Enemy AI patterns
export const aiPatterns: Record<string, EnemyAIPattern> = {
  passive: {
    type: 'defensive',
    skillUseProbability: 0.2,
    targetPriority: 'random',
    specialBehaviors: ['flee_when_low_hp']
  },
  
  aggressive: {
    type: 'aggressive',
    skillUseProbability: 0.4,
    targetPriority: 'weakest',
    specialBehaviors: ['berserker_when_low_hp']
  },
  
  balanced: {
    type: 'balanced',
    skillUseProbability: 0.3,
    targetPriority: 'lowest_hp',
    specialBehaviors: []
  },
  
  tactical: {
    type: 'balanced',
    skillUseProbability: 0.5,
    targetPriority: 'highest_threat',
    specialBehaviors: ['use_buffs_first', 'focus_fire']
  },
  
  supportive: {
    type: 'support',
    skillUseProbability: 0.6,
    targetPriority: 'random',
    specialBehaviors: ['heal_allies', 'buff_allies']
  }
}

// Enemy templates
export const enemyTemplates: Record<string, EnemyTemplate> = {
  // Level 1-3 enemies
  slime: {
    id: 'slime',
    name: '슬라임',
    description: '젤리 같은 몸체를 가진 가장 기본적인 몬스터입니다.',
    
    // Base stats (level 1)
    baseHp: 40,
    baseAttack: 6,
    baseDefense: 3,
    baseSpeed: 4,
    
    // Growth per level
    hpGrowth: 8,
    attackGrowth: 1.2,
    defenseGrowth: 0.8,
    
    skillSet: ['bite'],
    aiPattern: aiPatterns.passive,
    
    baseExp: 15,
    baseGold: 8,
    dropTable: [
      {
        itemId: 'slime_gel',
        probability: 0.6,
        minQuantity: 1,
        maxQuantity: 2
      },
      {
        itemId: 'small_potion',
        probability: 0.2,
        minQuantity: 1,
        maxQuantity: 1
      }
    ],
    
    sprite: '🟢'
  },
  
  goblin: {
    id: 'goblin',
    name: '고블린',
    description: '작지만 영리한 몬스터로, 무리를 지어 다닙니다.',
    
    baseHp: 60,
    baseAttack: 10,
    baseDefense: 6,
    baseSpeed: 8,
    
    hpGrowth: 12,
    attackGrowth: 2,
    defenseGrowth: 1.2,
    
    skillSet: ['bite', 'intimidate'],
    aiPattern: aiPatterns.tactical,
    
    baseExp: 25,
    baseGold: 15,
    dropTable: [
      {
        itemId: 'rusty_dagger',
        probability: 0.3,
        minQuantity: 1,
        maxQuantity: 1
      },
      {
        itemId: 'goblin_ear',
        probability: 0.8,
        minQuantity: 1,
        maxQuantity: 2
      },
      {
        itemId: 'bronze_coin',
        probability: 0.5,
        minQuantity: 3,
        maxQuantity: 8
      }
    ],
    
    sprite: '👹'
  },
  
  spider: {
    id: 'spider',
    name: '거미',
    description: '독을 가진 위험한 거미입니다.',
    
    baseHp: 35,
    baseAttack: 8,
    baseDefense: 4,
    baseSpeed: 12,
    
    hpGrowth: 7,
    attackGrowth: 1.5,
    defenseGrowth: 1,
    
    skillSet: ['bite', 'poison_spit'],
    aiPattern: aiPatterns.aggressive,
    
    baseExp: 20,
    baseGold: 10,
    dropTable: [
      {
        itemId: 'spider_silk',
        probability: 0.7,
        minQuantity: 2,
        maxQuantity: 4
      },
      {
        itemId: 'poison_sac',
        probability: 0.4,
        minQuantity: 1,
        maxQuantity: 2
      }
    ],
    
    sprite: '🕷️'
  },
  
  // Level 4-6 enemies
  orc: {
    id: 'orc',
    name: '오크',
    description: '강력한 근력을 가진 전사 타입 몬스터입니다.',
    
    baseHp: 100,
    baseAttack: 15,
    baseDefense: 10,
    baseSpeed: 6,
    
    hpGrowth: 18,
    attackGrowth: 3,
    defenseGrowth: 2,
    
    skillSet: ['bite', 'intimidate'],
    aiPattern: aiPatterns.aggressive,
    
    baseExp: 45,
    baseGold: 30,
    dropTable: [
      {
        itemId: 'orc_tooth',
        probability: 0.6,
        minQuantity: 1,
        maxQuantity: 3
      },
      {
        itemId: 'crude_axe',
        probability: 0.25,
        minQuantity: 1,
        maxQuantity: 1
      }
    ],
    
    sprite: '👹'
  },
  
  wolf: {
    id: 'wolf',
    name: '늑대',
    description: '빠르고 영리한 포식자입니다.',
    
    baseHp: 80,
    baseAttack: 12,
    baseDefense: 8,
    baseSpeed: 15,
    
    hpGrowth: 15,
    attackGrowth: 2.5,
    defenseGrowth: 1.5,
    
    skillSet: ['bite', 'howl'],
    aiPattern: aiPatterns.tactical,
    
    baseExp: 35,
    baseGold: 22,
    dropTable: [
      {
        itemId: 'wolf_pelt',
        probability: 0.7,
        minQuantity: 1,
        maxQuantity: 1
      },
      {
        itemId: 'wolf_fang',
        probability: 0.5,
        minQuantity: 1,
        maxQuantity: 2
      }
    ],
    
    sprite: '🐺'
  },
  
  // Level 7-10 enemies  
  troll: {
    id: 'troll',
    name: '트롤',
    description: '거대한 체격과 재생 능력을 가진 강력한 몬스터입니다.',
    
    baseHp: 150,
    baseAttack: 20,
    baseDefense: 15,
    baseSpeed: 4,
    
    hpGrowth: 25,
    attackGrowth: 4,
    defenseGrowth: 3,
    
    skillSet: ['devastating_blow', 'regeneration'],
    aiPattern: aiPatterns.balanced,
    
    baseExp: 80,
    baseGold: 50,
    dropTable: [
      {
        itemId: 'troll_hide',
        probability: 0.8,
        minQuantity: 1,
        maxQuantity: 2
      },
      {
        itemId: 'regeneration_stone',
        probability: 0.3,
        minQuantity: 1,
        maxQuantity: 1
      }
    ],
    
    sprite: '👹'
  },
  
  // Boss enemies
  goblin_chief: {
    id: 'goblin_chief',
    name: '고블린 족장',
    description: '고블린 무리의 지휘관으로 강력한 리더십을 가집니다.',
    
    baseHp: 200,
    baseAttack: 25,
    baseDefense: 18,
    baseSpeed: 10,
    
    hpGrowth: 30,
    attackGrowth: 5,
    defenseGrowth: 3,
    
    skillSet: ['devastating_blow', 'intimidate', 'howl'],
    aiPattern: aiPatterns.tactical,
    
    baseExp: 150,
    baseGold: 100,
    dropTable: [
      {
        itemId: 'chief_crown',
        probability: 1.0,
        minQuantity: 1,
        maxQuantity: 1
      },
      {
        itemId: 'magic_stone',
        probability: 0.7,
        minQuantity: 1,
        maxQuantity: 3
      }
    ],
    
    sprite: '👑'
  },
  
  shadow_wolf: {
    id: 'shadow_wolf',
    name: '그림자 늑대',
    description: '어둠의 힘을 가진 신비한 늑대입니다.',
    
    baseHp: 180,
    baseAttack: 22,
    baseDefense: 12,
    baseSpeed: 20,
    
    hpGrowth: 25,
    attackGrowth: 4.5,
    defenseGrowth: 2,
    
    skillSet: ['bite', 'howl', 'devastating_blow'],
    aiPattern: aiPatterns.aggressive,
    
    baseExp: 120,
    baseGold: 80,
    dropTable: [
      {
        itemId: 'shadow_essence',
        probability: 0.9,
        minQuantity: 2,
        maxQuantity: 4
      },
      {
        itemId: 'dark_crystal',
        probability: 0.4,
        minQuantity: 1,
        maxQuantity: 2
      }
    ],
    
    sprite: '🌑'
  },
  
  dragon_hatchling: {
    id: 'dragon_hatchling',
    name: '드래곤 새끼',
    description: '아직 어리지만 이미 강력한 마력을 가진 드래곤입니다.',
    
    baseHp: 300,
    baseAttack: 35,
    baseDefense: 25,
    baseSpeed: 8,
    
    hpGrowth: 50,
    attackGrowth: 8,
    defenseGrowth: 5,
    
    skillSet: ['devastating_blow', 'area_destruction', 'regeneration'],
    aiPattern: aiPatterns.balanced,
    
    baseExp: 300,
    baseGold: 200,
    dropTable: [
      {
        itemId: 'dragon_scale',
        probability: 1.0,
        minQuantity: 3,
        maxQuantity: 6
      },
      {
        itemId: 'fire_gem',
        probability: 0.8,
        minQuantity: 1,
        maxQuantity: 3
      },
      {
        itemId: 'legendary_treasure',
        probability: 0.2,
        minQuantity: 1,
        maxQuantity: 1
      }
    ],
    
    sprite: '🐉'
  }
}

// Enemy factory functions
export function createEnemy(templateId: string, level: number = 1): BattleUnit {
  const template = enemyTemplates[templateId]
  if (!template) {
    throw new Error(`Unknown enemy template: ${templateId}`)
  }
  
  // Calculate level-scaled stats
  const scaledHp = Math.floor(template.baseHp + (level - 1) * template.hpGrowth)
  const scaledAttack = Math.floor(template.baseAttack + (level - 1) * template.attackGrowth)
  const scaledDefense = Math.floor(template.baseDefense + (level - 1) * template.defenseGrowth)
  
  // Create battle unit
  const enemy: BattleUnit = {
    id: `${template.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: template.name,
    type: templateId.includes('boss') || templateId.includes('chief') || templateId.includes('dragon') ? 'boss' : 'enemy',
    
    // Scaled stats
    hp: scaledHp,
    maxHp: scaledHp,
    mp: 30 + level * 5,
    maxMp: 30 + level * 5,
    attack: scaledAttack,
    defense: scaledDefense,
    speed: template.baseSpeed + Math.floor(level / 3),
    
    // Combat stats
    critRate: 5 + Math.floor(level / 2),
    critDamage: 140 + level * 2,
    accuracy: 85 + level,
    evasion: Math.max(5, 15 - level),
    
    // Initialize arrays
    skills: getEnemySkillsForType(templateId),
    buffs: [],
    debuffs: [],
    
    isAlive: true
  }
  
  return enemy
}

export function createEnemyGroup(encounters: Array<{templateId: string, level: number, count?: number}>): BattleUnit[] {
  const enemies: BattleUnit[] = []
  
  encounters.forEach(encounter => {
    const count = encounter.count || 1
    for (let i = 0; i < count; i++) {
      const enemy = createEnemy(encounter.templateId, encounter.level)
      // Add suffix for multiple enemies of same type
      if (count > 1) {
        enemy.name = `${enemy.name} ${i + 1}`
      }
      enemies.push(enemy)
    }
  })
  
  return enemies
}

// Predefined encounter groups
export const encounterGroups = {
  // Early game (Level 1-3)
  slime_pack: () => createEnemyGroup([
    { templateId: 'slime', level: 1, count: 2 }
  ]),
  
  mixed_weak: () => createEnemyGroup([
    { templateId: 'slime', level: 2 },
    { templateId: 'goblin', level: 1 }
  ]),
  
  spider_nest: () => createEnemyGroup([
    { templateId: 'spider', level: 2, count: 3 }
  ]),
  
  // Mid game (Level 4-6)
  goblin_patrol: () => createEnemyGroup([
    { templateId: 'goblin', level: 4, count: 2 },
    { templateId: 'orc', level: 3 }
  ]),
  
  wolf_pack: () => createEnemyGroup([
    { templateId: 'wolf', level: 5, count: 3 }
  ]),
  
  mixed_medium: () => createEnemyGroup([
    { templateId: 'orc', level: 4 },
    { templateId: 'goblin', level: 5, count: 2 }
  ]),
  
  // Late game (Level 7-10)
  troll_encounter: () => createEnemyGroup([
    { templateId: 'troll', level: 7 }
  ]),
  
  elite_pack: () => createEnemyGroup([
    { templateId: 'wolf', level: 8 },
    { templateId: 'orc', level: 8 },
    { templateId: 'spider', level: 7 }
  ]),
  
  // Boss encounters
  goblin_chief_battle: () => createEnemyGroup([
    { templateId: 'goblin_chief', level: 6 },
    { templateId: 'goblin', level: 5, count: 2 }
  ]),
  
  shadow_wolf_hunt: () => createEnemyGroup([
    { templateId: 'shadow_wolf', level: 8 },
    { templateId: 'wolf', level: 7, count: 2 }
  ]),
  
  dragon_lair: () => createEnemyGroup([
    { templateId: 'dragon_hatchling', level: 10 }
  ])
}

// Difficulty scaling functions
export function scaleEnemyForDifficulty(enemy: BattleUnit, difficultyMultiplier: number): BattleUnit {
  const scaled = { ...enemy }
  
  scaled.hp = Math.floor(scaled.hp * difficultyMultiplier)
  scaled.maxHp = scaled.hp
  scaled.attack = Math.floor(scaled.attack * difficultyMultiplier)
  scaled.defense = Math.floor(scaled.defense * difficultyMultiplier * 0.8) // Defense scales less
  
  return scaled
}

export function getEnemyTemplate(templateId: string): EnemyTemplate | null {
  return enemyTemplates[templateId] || null
}

export function getAllEnemyTemplateIds(): string[] {
  return Object.keys(enemyTemplates)
}

export function getEnemiesForLevel(level: number): string[] {
  if (level <= 3) {
    return ['slime', 'goblin', 'spider']
  } else if (level <= 6) {
    return ['goblin', 'spider', 'orc', 'wolf']  
  } else if (level <= 9) {
    return ['orc', 'wolf', 'troll']
  } else {
    return ['troll', 'goblin_chief', 'shadow_wolf', 'dragon_hatchling']
  }
}

export function generateRandomEncounter(level: number, partySize: number = 2): BattleUnit[] {
  const availableEnemies = getEnemiesForLevel(level)
  const enemyCount = Math.min(4, Math.max(1, partySize + Math.floor(Math.random() * 2)))
  
  const encounters: Array<{templateId: string, level: number}> = []
  
  for (let i = 0; i < enemyCount; i++) {
    const templateId = availableEnemies[Math.floor(Math.random() * availableEnemies.length)]
    const enemyLevel = level + Math.floor(Math.random() * 3) - 1 // ±1 level variance
    encounters.push({ templateId, level: Math.max(1, enemyLevel) })
  }
  
  return createEnemyGroup(encounters)
}

export default {
  enemyTemplates,
  aiPatterns,
  createEnemy,
  createEnemyGroup,
  encounterGroups,
  scaleEnemyForDifficulty,
  getEnemyTemplate,
  getAllEnemyTemplateIds,
  getEnemiesForLevel,
  generateRandomEncounter
}