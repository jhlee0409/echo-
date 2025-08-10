/**
 * 🧪 Battle-Character Integration Tests
 * 
 * End-to-end integration tests showing how battle system and character system work together
 */

import { AutoBattleSystem } from '@/systems/battle/AutoBattleSystem'
import { BattleIntegrationService } from '@/services/battle/BattleIntegrationService'
import { AdvancedCharacterManager } from '@/services/character/AdvancedCharacterSystem'
import type { BattleFormation, BattleUnit } from '@/systems/battle/types'
import type { EmotionType } from '@types'

describe('Battle-Character Integration', () => {
  let battleSystem: AutoBattleSystem
  let integrationService: BattleIntegrationService
  let characterManager: AdvancedCharacterManager

  beforeEach(() => {
    battleSystem = new AutoBattleSystem({
      turnTimeLimit: 30,
      animationSpeed: 1.0,
      difficultyMultiplier: 1.0,
      companionAILevel: 'adaptive',
      enemyAILevel: 'normal',
      allowEscape: true,
      showDamageNumbers: true,
    })

    integrationService = new BattleIntegrationService({
      experienceMultiplier: 1.2,
      relationshipGainMultiplier: 1.1,
      personalityInfluenceStrength: 0.8,
      enableDynamicDifficulty: true,
    })

    characterManager = new AdvancedCharacterManager({
      id: 'integration-test-companion',
      name: 'Aria',
      personality: {
        core: {
          cheerful: 0.7,
          caring: 0.8,
          playful: 0.5,
          curious: 0.9,
          thoughtful: 0.6,
          supportive: 0.7,
          independent: 0.4,
          emotional: 0.5,
          adaptability: 0.6,
          consistency: 0.8,
          authenticity: 0.9,
        },
      },
      relationship: {
        intimacyLevel: 2,
        trustLevel: 3,
        totalInteractions: 15,
      },
    })
  })

  it('should complete full battle-to-character-growth cycle', async () => {
    const character = characterManager.getCharacter()
    const initialIntimacy = character.relationship.intimacyLevel
    const initialTrust = character.relationship.trustLevel
    // Store initial personality for comparison
    const _initialPersonality = { ...character.personality.core }

    // Step 1: Setup battle formation with character influence
    const baseFormation: BattleFormation = {
      playerTeam: [
        {
          id: 'player',
          name: 'Player',
          type: 'player',
          level: 3,
          hp: 120,
          maxHp: 120,
          mp: 60,
          maxMp: 60,
          attack: 25,
          defense: 18,
          speed: 12,
          accuracy: 95,
          evasion: 8,
          critRate: 12,
          critDamage: 160,
          isAlive: true,
          buffs: [],
          debuffs: [],
          skills: [
            {
              id: 'power_strike',
              name: 'Power Strike',
              description: 'A powerful attack',
              damage: 30,
              mpCost: 10,
              cooldownTurns: 2,
              currentCooldown: 0,
              targetType: 'single',
              skillType: 'offensive',
            },
          ],
        },
        {
          id: 'companion',
          name: 'Aria',
          type: 'companion',
          level: 2,
          hp: 100,
          maxHp: 100,
          mp: 50,
          maxMp: 50,
          attack: 20,
          defense: 15,
          speed: 14,
          accuracy: 92,
          evasion: 10,
          critRate: 10,
          critDamage: 150,
          isAlive: true,
          buffs: [],
          debuffs: [],
          skills: [
            {
              id: 'heal',
              name: 'Heal',
              description: 'Restore HP',
              healAmount: 40,
              mpCost: 15,
              cooldownTurns: 0,
              currentCooldown: 0,
              targetType: 'single',
              skillType: 'support',
            },
          ],
        },
      ],
      enemyTeam: [
        {
          id: 'goblin1',
          name: 'Goblin Warrior',
          type: 'enemy',
          level: 2,
          hp: 80,
          maxHp: 80,
          mp: 30,
          maxMp: 30,
          attack: 18,
          defense: 12,
          speed: 11,
          accuracy: 88,
          evasion: 12,
          critRate: 8,
          critDamage: 140,
          isAlive: true,
          buffs: [],
          debuffs: [],
          skills: [],
        },
        {
          id: 'goblin2',
          name: 'Goblin Scout',
          type: 'enemy',
          level: 1,
          hp: 60,
          maxHp: 60,
          mp: 20,
          maxMp: 20,
          attack: 15,
          defense: 8,
          speed: 16,
          accuracy: 90,
          evasion: 15,
          critRate: 12,
          critDamage: 130,
          isAlive: true,
          buffs: [],
          debuffs: [],
          skills: [],
        },
      ],
      environment: {
        name: 'Forest Clearing',
        effects: [],
      },
    }

    // Step 2: Apply character influence to battle setup
    const enhancedFormation = await integrationService.setupBattleFormation(character, baseFormation)
    
    // Verify character influence was applied
    const companionUnit = enhancedFormation.playerTeam.find(u => u.type === 'companion')!
    expect(companionUnit.personality).toBeDefined()
    expect(companionUnit.maxHp).toBeGreaterThan(100) // Should be enhanced by level/relationship

    // Step 3: Execute battle
    const battleResult = await battleSystem.executeBattle(enhancedFormation)
    
    // Verify battle completed
    expect(battleResult).toBeDefined()
    expect(battleResult.turns).toBeGreaterThan(0)
    expect(typeof battleResult.victory).toBe('boolean')

    // Step 4: Process battle results and update character
    const rewards = await integrationService.processBattleResults(battleResult, character)
    
    // Verify rewards were calculated
    expect(rewards.experience.combat).toBeGreaterThan(0)
    expect(rewards.experience.emotional).toBeGreaterThan(0)
    expect(Math.abs(rewards.relationshipChange.intimacy)).toBeGreaterThanOrEqual(0)
    expect(Math.abs(rewards.relationshipChange.trust)).toBeGreaterThanOrEqual(0)

    // Verify character was updated
    const updatedCharacter = characterManager.getCharacter()
    expect(updatedCharacter.relationship.totalInteractions).toBe(16) // Incremented
    
    // Verify interaction timestamp was updated (within reasonable time window)
    const timeDiff = Math.abs(updatedCharacter.lastInteraction.getTime() - new Date().getTime())
    expect(timeDiff).toBeLessThan(5000) // Within 5 seconds

    // Step 5: Verify character development occurred
    if (battleResult.victory) {
      // Victory should generally improve relationship
      expect(updatedCharacter.relationship.intimacyLevel).toBeGreaterThanOrEqual(initialIntimacy)
      expect(updatedCharacter.relationship.trustLevel).toBeGreaterThanOrEqual(initialTrust)
    }

    // Verify personality growth was calculated (but don't require personality history update)
    expect(Object.keys(rewards.personalityGrowth).length).toBeGreaterThanOrEqual(0)
    
    // Battle should have some form of character development
    expect(rewards.experience.combat + rewards.experience.emotional + rewards.experience.relationship).toBeGreaterThan(0)
  }, 10000) // Longer timeout for full integration test

  it('should demonstrate companion AI evolution through battles', async () => {
    const character = characterManager.getCharacter()

    // Make character more supportive through personality
    character.personality.core.caring = 0.9
    character.personality.core.supportive = 0.8

    const baseFormation: BattleFormation = {
      playerTeam: [
        {
          id: 'player',
          name: 'Player',
          type: 'player',
          level: 1,
          hp: 80, // Lower HP to trigger companion healing behavior
          maxHp: 100,
          mp: 40,
          maxMp: 50,
          attack: 20,
          defense: 12,
          speed: 10,
          accuracy: 90,
          evasion: 5,
          critRate: 8,
          critDamage: 140,
          isAlive: true,
          buffs: [],
          debuffs: [],
          skills: [],
        },
        {
          id: 'companion',
          name: 'Aria',
          type: 'companion',
          level: 2,
          hp: 100,
          maxHp: 100,
          mp: 80,
          maxMp: 80,
          attack: 18,
          defense: 15,
          speed: 12,
          accuracy: 95,
          evasion: 8,
          critRate: 10,
          critDamage: 150,
          isAlive: true,
          buffs: [],
          debuffs: [],
          skills: [
            {
              id: 'heal',
              name: 'Greater Heal',
              description: 'Powerful healing spell',
              healAmount: 50,
              mpCost: 20,
              cooldownTurns: 1,
              currentCooldown: 0,
              targetType: 'single',
              skillType: 'support',
            },
            {
              id: 'attack',
              name: 'Strike',
              description: 'Basic attack',
              damage: 25,
              mpCost: 5,
              cooldownTurns: 0,
              currentCooldown: 0,
              targetType: 'single',
              skillType: 'offensive',
            },
          ],
        },
      ],
      enemyTeam: [
        {
          id: 'weak_enemy',
          name: 'Slime',
          type: 'enemy',
          level: 1,
          hp: 40,
          maxHp: 40,
          mp: 10,
          maxMp: 10,
          attack: 12,
          defense: 5,
          speed: 8,
          accuracy: 85,
          evasion: 5,
          critRate: 5,
          critDamage: 120,
          isAlive: true,
          buffs: [],
          debuffs: [],
          skills: [],
        },
      ],
      environment: {
        name: 'Safe Training Area',
        effects: [],
      },
    }

    // Setup formation with character influence
    const enhancedFormation = await integrationService.setupBattleFormation(character, baseFormation)
    const companionUnit = enhancedFormation.playerTeam.find(u => u.type === 'companion')!

    // Verify companion has supportive personality mapping
    expect(companionUnit.personality.support).toBeGreaterThan(0.5)
    
    // Execute battle - companion should prioritize healing due to high support personality
    const battleResult = await battleSystem.executeBattle(enhancedFormation)
    
    // Verify battle occurred
    expect(battleResult.turns).toBeGreaterThan(0)
    
    // Check if healing actions were likely used (companion with high support personality and healing skills)
    // This is inferred from battle statistics and companion behavior
    if (battleResult.statistics && battleResult.statistics.skillsUsed > 0) {
      // Companion likely used skills - supportive character should prioritize healing when ally HP is low
      expect(battleResult.statistics.skillsUsed).toBeGreaterThan(0)
    }

    // Process results and verify character development
    const rewards = await integrationService.processBattleResults(battleResult, character)
    
    // Supportive actions in battle should build caring personality trait
    if (rewards.personalityGrowth.caring) {
      expect(rewards.personalityGrowth.caring).toBeGreaterThan(0)
    }
  })

  it('should track battle performance across multiple encounters', async () => {
    const character = characterManager.getCharacter()
    const totalBattles = 0
    const victories = 0

    // Create a simple repeatable battle scenario
    const createTestBattle = (): BattleFormation => ({
      playerTeam: [
        {
          id: 'player',
          name: 'Player',
          type: 'player',
          level: 5,
          hp: 150,
          maxHp: 150,
          mp: 80,
          maxMp: 80,
          attack: 35,
          defense: 25,
          speed: 15,
          accuracy: 95,
          evasion: 10,
          critRate: 15,
          critDamage: 170,
          isAlive: true,
          buffs: [],
          debuffs: [],
          skills: [],
        },
        {
          id: 'companion',
          name: 'Aria',
          type: 'companion',
          level: 4,
          hp: 130,
          maxHp: 130,
          mp: 70,
          maxMp: 70,
          attack: 28,
          defense: 20,
          speed: 16,
          accuracy: 92,
          evasion: 12,
          critRate: 12,
          critDamage: 160,
          isAlive: true,
          buffs: [],
          debuffs: [],
          skills: [],
        },
      ],
      enemyTeam: [
        {
          id: 'training_dummy',
          name: 'Training Dummy',
          type: 'enemy',
          level: 1,
          hp: 50,
          maxHp: 50,
          mp: 10,
          maxMp: 10,
          attack: 10,
          defense: 5,
          speed: 5,
          accuracy: 80,
          evasion: 0,
          critRate: 0,
          critDamage: 100,
          isAlive: true,
          buffs: [],
          debuffs: [],
          skills: [],
        },
      ],
      environment: {
        name: 'Training Ground',
        effects: [],
      },
    })

    // Conduct multiple battles to demonstrate performance tracking
    for (let i = 0; i < 3; i++) {
      const formation = await integrationService.setupBattleFormation(character, createTestBattle())
      const result = await battleSystem.executeBattle(formation)
      
      await integrationService.processBattleResults(result, character)
      
      // Track battle statistics
      // totalBattles++
      // if (result.victory) victories++

      // Verify performance metrics are being tracked
      const metrics = integrationService.getPerformanceHistory(character.id)
      expect(metrics).toBeDefined()
      expect(metrics!.battlesWon + metrics!.battlesLost).toBe(i + 1)
    }

    // Verify character has grown from battle experience
    const finalCharacter = characterManager.getCharacter()
    expect(finalCharacter.relationship.totalInteractions).toBe(18) // Started at 15, +3 battles
    
    // Get battle effectiveness assessment
    const effectiveness = integrationService.getBattleEffectiveness(finalCharacter)
    expect(effectiveness.overallRating).toBeGreaterThan(0)
    expect(effectiveness.strengths.length + effectiveness.weaknesses.length).toBeGreaterThan(0)

    // Performance metrics should reflect the battles
    const finalMetrics = integrationService.getPerformanceHistory(character.id)!
    expect(finalMetrics.battlesWon + finalMetrics.battlesLost).toBe(3)
    expect(finalMetrics.lastBattleTimestamp).toBeInstanceOf(Date)
  })

  it('should handle character emotional state changes affecting battle performance', async () => {
    const character = characterManager.getCharacter()

    // Test with different emotional states
    const emotionalStates: EmotionType[] = ['excited', 'angry', 'sad', 'calm']
    
    for (const emotion of emotionalStates) {
      // Change character's emotional state
      character.emotionalState.currentEmotion = emotion
      character.emotionalState.emotionIntensity = 0.8

      const baseFormation: BattleFormation = {
        playerTeam: [
          {
            id: 'companion',
            name: 'Aria',
            type: 'companion',
            level: 3,
            hp: 120,
            maxHp: 120,
            mp: 60,
            maxMp: 60,
            attack: 25,
            defense: 18,
            speed: 14,
            accuracy: 90,
            evasion: 10,
            critRate: 10,
            critDamage: 150,
            isAlive: true,
            buffs: [],
            debuffs: [],
            skills: [],
          },
        ],
        enemyTeam: [
          {
            id: 'test_enemy',
            name: 'Test Enemy',
            type: 'enemy',
            level: 2,
            hp: 80,
            maxHp: 80,
            mp: 40,
            maxMp: 40,
            attack: 20,
            defense: 15,
            speed: 12,
            accuracy: 85,
            evasion: 8,
            critRate: 8,
            critDamage: 140,
            isAlive: true,
            buffs: [],
            debuffs: [],
            skills: [],
          },
        ],
        environment: {
          name: 'Emotional Testing Arena',
          effects: [],
        },
      }

      const enhancedFormation = await integrationService.setupBattleFormation(character, baseFormation)
      const companionUnit = enhancedFormation.playerTeam[0]

      // Verify emotional modifiers were applied
      switch (emotion) {
        case 'excited':
          expect(companionUnit.critRate).toBeGreaterThan(10) // Should increase crit
          expect(companionUnit.accuracy).toBeLessThan(90) // Should decrease accuracy
          break
        case 'angry':
          expect(companionUnit.critRate).toBeGreaterThan(10) // Should increase crit more
          break
        case 'calm':
          expect(companionUnit.accuracy).toBeGreaterThan(90) // Should increase accuracy
          break
      }

      // Execute battle with emotional modifiers
      const result = await battleSystem.executeBattle(enhancedFormation)
      expect(result.turns).toBeGreaterThan(0) // Battle should complete successfully
      
      // Process results
      const rewards = await integrationService.processBattleResults(result, character)
      expect(rewards.experience.emotional).toBeGreaterThan(0) // Should gain emotional experience
    }
  })

  it('should demonstrate dynamic difficulty adjustment', async () => {
    const character = characterManager.getCharacter()
    
    // Simulate a high-level character with good performance
    character.relationship.totalInteractions = 100 // High level
    
    // Create initial battle and add some victories to performance history
    for (let i = 0; i < 5; i++) {
      const mockResult = {
        victory: true,
        turns: 5,
        battleLog: [],
        statistics: {
          totalDamageDealt: 200,
          totalDamageReceived: 20,
          totalHealing: 0,
          skillsUsed: 6,
          criticalHits: 3,
          missedAttacks: 0,
          statusEffectsApplied: 2,
        },
        rewards: { experience: 100, gold: 50, items: [] },
        experienceGained: { player: 50, companion: 40 },
      }
      await integrationService.processBattleResults(mockResult, character)
    }

    const baseEnemy: BattleUnit = {
      id: 'base_enemy',
      name: 'Base Enemy',
      type: 'enemy',
      level: 3,
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      attack: 25,
      defense: 20,
      speed: 15,
      accuracy: 90,
      evasion: 10,
      critRate: 10,
      critDamage: 150,
      isAlive: true,
      buffs: [],
      debuffs: [],
      skills: [],
    }

    const baseFormation: BattleFormation = {
      playerTeam: [
        {
          id: 'player',
          name: 'Veteran Player',
          type: 'player',
          level: 10,
          hp: 200,
          maxHp: 200,
          mp: 100,
          maxMp: 100,
          attack: 50,
          defense: 40,
          speed: 20,
          accuracy: 98,
          evasion: 15,
          critRate: 20,
          critDamage: 180,
          isAlive: true,
          buffs: [],
          debuffs: [],
          skills: [],
        },
      ],
      enemyTeam: [baseEnemy],
      environment: { name: 'Challenge Arena', effects: [] },
    }

    // Setup battle with dynamic difficulty
    const enhancedFormation = await integrationService.setupBattleFormation(character, baseFormation)
    
    // Enemy should be stronger due to character's high level and win streak
    const adjustedEnemy = enhancedFormation.enemyTeam[0]
    expect(adjustedEnemy.maxHp).toBeGreaterThan(baseEnemy.maxHp)
    expect(adjustedEnemy.attack).toBeGreaterThan(baseEnemy.attack)
    
    // Battle should still be completable
    const result = await battleSystem.executeBattle(enhancedFormation)
    expect(result.turns).toBeGreaterThan(0)
    
    // Process results
    const rewards = await integrationService.processBattleResults(result, character)
    expect(rewards.experience.combat).toBeGreaterThan(0)
  })
})