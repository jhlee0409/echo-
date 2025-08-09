/**
 * 🎯 SkillMenu UI Component 테스트
 * 
 * 스킬 선택 메뉴 컴포넌트 테스트 - 스킬 목록, 타겟 선택, MP 비용 검증
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import SkillMenu from '../SkillMenu'
import { playerSkills, companionSkills } from '@systems/battle/skills'
import { createEnemy } from '@systems/battle/enemies'
import type { BattleUnit, BattleSkill } from '@systems/battle/types'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

describe('SkillMenu Component', () => {
  let mockPlayer: BattleUnit
  let mockCompanion: BattleUnit
  let mockEnemies: BattleUnit[]
  let mockOnSkillSelect: ReturnType<typeof vi.fn>
  let mockOnTargetSelect: ReturnType<typeof vi.fn>
  let mockOnCancel: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockPlayer = {
      id: 'player_test',
      name: '테스트 플레이어',
      type: 'player',
      hp: 80,
      maxHp: 100,
      mp: 30,
      maxMp: 50,
      attack: 20,
      defense: 10,
      speed: 12,
      critRate: 15,
      critDamage: 150,
      accuracy: 95,
      evasion: 5,
      skills: [
        playerSkills.power_strike,
        playerSkills.heal,
        playerSkills.whirlwind,
        {
          ...playerSkills.power_strike,
          id: 'expensive_skill',
          name: '비싼 스킬',
          mpCost: 60, // Player MP(30)보다 높음
          currentCooldown: 0
        }
      ],
      buffs: [],
      debuffs: [],
      isAlive: true
    }

    mockCompanion = {
      id: 'companion_test',
      name: '테스트 동반자',
      type: 'companion',
      hp: 60,
      maxHp: 80,
      mp: 25,
      maxMp: 40,
      attack: 15,
      defense: 8,
      speed: 10,
      critRate: 10,
      critDamage: 140,
      accuracy: 90,
      evasion: 8,
      skills: [companionSkills.gentle_heal, companionSkills.protective_shield],
      buffs: [],
      debuffs: [],
      isAlive: true
    }

    mockEnemies = [
      createEnemy('slime', 2),
      createEnemy('goblin', 3)
    ]

    mockOnSkillSelect = vi.fn()
    mockOnTargetSelect = vi.fn()
    mockOnCancel = vi.fn()

    vi.clearAllMocks()
  })

  describe('Skill List Display', () => {
    test('should display available skills', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={mockEnemies}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('강타')).toBeInTheDocument()
      expect(screen.getByText('치유')).toBeInTheDocument()
      expect(screen.getByText('회전베기')).toBeInTheDocument()
    })

    test('should show skill descriptions and costs', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={mockEnemies}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('MP 15')).toBeInTheDocument() // Power strike cost
      expect(screen.getByText('MP 10')).toBeInTheDocument() // Heal cost
      expect(screen.getByText('MP 20')).toBeInTheDocument() // Whirlwind cost
    })

    test('should disable skills with insufficient MP', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={mockEnemies}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      const expensiveSkill = screen.getByText('비싼 스킬')
      expect(expensiveSkill.closest('button')).toBeDisabled()
      expect(screen.getByText('MP 부족')).toBeInTheDocument()
    })

    test('should show skills on cooldown', () => {
      const skillOnCooldown = {
        ...playerSkills.power_strike,
        id: 'cooldown_skill',
        name: '쿨다운 스킬',
        currentCooldown: 2
      }

      const playerWithCooldown = {
        ...mockPlayer,
        skills: [skillOnCooldown, playerSkills.heal]
      }

      render(
        <SkillMenu
          caster={playerWithCooldown}
          availableTargets={mockEnemies}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      const cooldownSkill = screen.getByText('쿨다운 스킬')
      expect(cooldownSkill.closest('button')).toBeDisabled()
      expect(screen.getByText('2턴 남음')).toBeInTheDocument()
    })

    test('should categorize skills by type', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={mockEnemies}
          showCategories={true}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('공격 스킬')).toBeInTheDocument()
      expect(screen.getByText('치유 스킬')).toBeInTheDocument()
    })
  })

  describe('Skill Selection', () => {
    test('should handle skill selection', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={mockEnemies}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      const powerStrike = screen.getByText('강타')
      fireEvent.click(powerStrike)

      expect(mockOnSkillSelect).toHaveBeenCalledWith(playerSkills.power_strike)
    })

    test('should prevent selection of disabled skills', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={mockEnemies}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      const expensiveSkill = screen.getByText('비싼 스킬').closest('button')!
      fireEvent.click(expensiveSkill)

      expect(mockOnSkillSelect).not.toHaveBeenCalled()
    })

    test('should show target selection after skill selection', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={mockEnemies}
          selectedSkill={playerSkills.power_strike}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('타겟 선택')).toBeInTheDocument()
      expect(screen.getByText('슬라임')).toBeInTheDocument()
      expect(screen.getByText('고블린')).toBeInTheDocument()
    })

    test('should handle target selection', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={mockEnemies}
          selectedSkill={playerSkills.power_strike}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      const slime = screen.getByText('슬라임')
      fireEvent.click(slime)

      expect(mockOnTargetSelect).toHaveBeenCalledWith(mockEnemies[0])
    })

    test('should handle ally target selection for healing skills', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={[mockPlayer, mockCompanion]}
          selectedSkill={playerSkills.heal}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('테스트 플레이어')).toBeInTheDocument()
      expect(screen.getByText('테스트 동반자')).toBeInTheDocument()

      const companion = screen.getByText('테스트 동반자')
      fireEvent.click(companion)

      expect(mockOnTargetSelect).toHaveBeenCalledWith(mockCompanion)
    })
  })

  describe('Skill Information', () => {
    test('should display detailed skill information on hover', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={mockEnemies}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      const powerStrike = screen.getByText('강타')
      fireEvent.mouseEnter(powerStrike)

      expect(screen.getByText(/강력한 단일 공격/)).toBeInTheDocument()
      expect(screen.getByText(/데미지: 25/)).toBeInTheDocument()
    })

    test('should show damage calculation preview', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={mockEnemies}
          selectedSkill={playerSkills.power_strike}
          selectedTarget={mockEnemies[0]}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText(/예상 데미지:/)).toBeInTheDocument()
    })

    test('should show healing calculation preview', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={[mockCompanion]}
          selectedSkill={playerSkills.heal}
          selectedTarget={mockCompanion}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText(/예상 회복:/)).toBeInTheDocument()
    })

    test('should show status effects information', () => {
      render(
        <SkillMenu
          caster={mockCompanion}
          availableTargets={[mockPlayer]}
          selectedSkill={companionSkills.protective_shield}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText(/방어력 증가/)).toBeInTheDocument()
      expect(screen.getByText(/3턴 지속/)).toBeInTheDocument()
    })
  })

  describe('Target Validation', () => {
    test('should filter valid targets for single-target skills', () => {
      const deadEnemy = { ...mockEnemies[1], hp: 0, isAlive: false }

      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={[mockEnemies[0], deadEnemy]}
          selectedSkill={playerSkills.power_strike}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('슬라임')).toBeInTheDocument()
      expect(screen.queryByText('고블린')).not.toBeInTheDocument() // Dead enemy should not appear
    })

    test('should handle area-effect skills differently', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={mockEnemies}
          selectedSkill={playerSkills.whirlwind} // Area attack
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('모든 적 대상')).toBeInTheDocument()
    })

    test('should show self-target skills appropriately', () => {
      const selfBuffSkill = {
        ...playerSkills.heal,
        id: 'self_buff',
        name: '자기 강화',
        targetType: 'self' as const
      }

      const playerWithSelfSkill = {
        ...mockPlayer,
        skills: [selfBuffSkill]
      }

      render(
        <SkillMenu
          caster={playerWithSelfSkill}
          availableTargets={[playerWithSelfSkill]}
          selectedSkill={selfBuffSkill}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('자기 자신')).toBeInTheDocument()
    })

    test('should prevent targeting invalid units', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={[]} // No valid targets
          selectedSkill={playerSkills.power_strike}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('유효한 타겟이 없습니다')).toBeInTheDocument()
    })
  })

  describe('User Interface', () => {
    test('should show cancel button', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={mockEnemies}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      const cancelButton = screen.getByText('취소')
      expect(cancelButton).toBeInTheDocument()

      fireEvent.click(cancelButton)
      expect(mockOnCancel).toHaveBeenCalled()
    })

    test('should show back button in target selection mode', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={mockEnemies}
          selectedSkill={playerSkills.power_strike}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      const backButton = screen.getByText('뒤로')
      expect(backButton).toBeInTheDocument()

      fireEvent.click(backButton)
      expect(screen.getByText('스킬 선택')).toBeInTheDocument()
    })

    test('should display current MP and remaining MP after skill use', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={mockEnemies}
          selectedSkill={playerSkills.power_strike}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('현재 MP: 30')).toBeInTheDocument()
      expect(screen.getByText('사용 후: 15')).toBeInTheDocument()
    })

    test('should show skill icons', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={mockEnemies}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      // Skill icons should be present
      const skillIcons = screen.getAllByTestId('skill-icon')
      expect(skillIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={mockEnemies}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByLabelText('스킬 메뉴')).toBeInTheDocument()
      expect(screen.getByLabelText('강타 스킬, MP 15 소모')).toBeInTheDocument()
    })

    test('should support keyboard navigation', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={mockEnemies}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      const firstSkill = screen.getByText('강타')
      const secondSkill = screen.getByText('치유')

      firstSkill.focus()
      expect(document.activeElement).toBe(firstSkill)

      fireEvent.keyDown(firstSkill, { key: 'ArrowDown' })
      expect(document.activeElement).toBe(secondSkill)
    })

    test('should handle Enter key for selection', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={mockEnemies}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      const powerStrike = screen.getByText('강타')
      fireEvent.keyDown(powerStrike, { key: 'Enter' })

      expect(mockOnSkillSelect).toHaveBeenCalledWith(playerSkills.power_strike)
    })

    test('should handle Escape key for cancel', () => {
      render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={mockEnemies}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      fireEvent.keyDown(document, { key: 'Escape' })
      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('Performance', () => {
    test('should render efficiently with many skills', () => {
      const manySkills = Array.from({ length: 20 }, (_, i) => ({
        ...playerSkills.power_strike,
        id: `skill_${i}`,
        name: `스킬 ${i + 1}`,
        mpCost: (i % 5) + 5
      }))

      const playerWithManySkills = {
        ...mockPlayer,
        skills: manySkills
      }

      const startTime = performance.now()
      render(
        <SkillMenu
          caster={playerWithManySkills}
          availableTargets={mockEnemies}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100) // 100ms 이내
    })

    test('should handle rapid skill selection changes', () => {
      const { rerender } = render(
        <SkillMenu
          caster={mockPlayer}
          availableTargets={mockEnemies}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      // Rapidly change selected skills
      const skills = [playerSkills.power_strike, playerSkills.heal, playerSkills.whirlwind]
      
      skills.forEach(skill => {
        rerender(
          <SkillMenu
            caster={mockPlayer}
            availableTargets={mockEnemies}
            selectedSkill={skill}
            onSkillSelect={mockOnSkillSelect}
            onTargetSelect={mockOnTargetSelect}
            onCancel={mockOnCancel}
          />
        )
      })

      expect(screen.getByText('타겟 선택')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('should handle caster with no skills', () => {
      const noSkillsPlayer = { ...mockPlayer, skills: [] }

      render(
        <SkillMenu
          caster={noSkillsPlayer}
          availableTargets={mockEnemies}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('사용 가능한 스킬이 없습니다')).toBeInTheDocument()
    })

    test('should handle all skills on cooldown', () => {
      const cooldownSkills = mockPlayer.skills.map(skill => ({
        ...skill,
        currentCooldown: 3
      }))

      const playerWithCooldowns = {
        ...mockPlayer,
        skills: cooldownSkills
      }

      render(
        <SkillMenu
          caster={playerWithCooldowns}
          availableTargets={mockEnemies}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('모든 스킬이 쿨다운 중입니다')).toBeInTheDocument()
    })

    test('should handle zero MP caster', () => {
      const noMpPlayer = { ...mockPlayer, mp: 0 }

      render(
        <SkillMenu
          caster={noMpPlayer}
          availableTargets={mockEnemies}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      const skills = screen.getAllByText(/MP 부족/)
      expect(skills.length).toBeGreaterThan(0)
    })

    test('should handle malformed skill data', () => {
      const malformedSkill = {
        id: 'malformed',
        name: '',
        description: '',
        mpCost: -1,
        cooldownTurns: -1,
        currentCooldown: 0,
        damage: NaN,
        targetType: 'invalid' as any,
        aiPriority: 150
      }

      const playerWithMalformedSkill = {
        ...mockPlayer,
        skills: [malformedSkill, ...mockPlayer.skills]
      }

      render(
        <SkillMenu
          caster={playerWithMalformedSkill}
          availableTargets={mockEnemies}
          onSkillSelect={mockOnSkillSelect}
          onTargetSelect={mockOnTargetSelect}
          onCancel={mockOnCancel}
        />
      )

      // Should not crash and should show valid skills
      expect(screen.getByText('강타')).toBeInTheDocument()
    })
  })
})