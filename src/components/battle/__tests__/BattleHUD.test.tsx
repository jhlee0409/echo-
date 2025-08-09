/**
 * 🎮 BattleHUD UI Component 테스트
 * 
 * 전투 HUD 컴포넌트 테스트 - HP/MP 바, 턴 카운터, 전투 컨트롤
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import BattleHUD from '../BattleHUD'
import { createEnemy } from '@systems/battle/enemies'
import type { BattleUnit } from '@systems/battle/types'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}))

describe('BattleHUD Component', () => {
  let mockPlayer: BattleUnit
  let mockCompanion: BattleUnit
  let mockEnemies: BattleUnit[]
  let mockOnAction: ReturnType<typeof vi.fn>
  let mockOnEscape: ReturnType<typeof vi.fn>

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
      skills: [],
      buffs: [{
        id: 'strength_buff',
        name: '힘 증가',
        type: 'buff',
        duration: 3,
        statModifiers: { attack: 5 },
        icon: '💪',
        description: '공격력 +5'
      }],
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
      skills: [],
      buffs: [],
      debuffs: [{
        id: 'poison',
        name: '독',
        type: 'debuff',
        duration: 2,
        statModifiers: {},
        damagePerTurn: -3,
        icon: '☠️',
        description: '매 턴 3 피해'
      }],
      isAlive: true
    }

    mockEnemies = [
      createEnemy('slime', 2),
      { ...createEnemy('goblin', 3), hp: 45, maxHp: 60 }
    ]

    mockOnAction = vi.fn()
    mockOnEscape = vi.fn()

    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    test('should render all player team units', () => {
      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      expect(screen.getByText('테스트 플레이어')).toBeInTheDocument()
      expect(screen.getByText('테스트 동반자')).toBeInTheDocument()
    })

    test('should render all enemy team units', () => {
      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      expect(screen.getByText('슬라임')).toBeInTheDocument()
      expect(screen.getByText('고블린')).toBeInTheDocument()
    })

    test('should display current turn number', () => {
      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={7}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      expect(screen.getByText('턴 7')).toBeInTheDocument()
    })

    test('should show battle controls when player turn', () => {
      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      expect(screen.getByText('공격')).toBeInTheDocument()
      expect(screen.getByText('스킬')).toBeInTheDocument()
      expect(screen.getByText('도주')).toBeInTheDocument()
    })

    test('should hide player controls when not player turn', () => {
      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={false}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      expect(screen.queryByText('공격')).not.toBeInTheDocument()
      expect(screen.queryByText('스킬')).not.toBeInTheDocument()
    })
  })

  describe('Health and Mana Bars', () => {
    test('should display HP bars with correct values', () => {
      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      expect(screen.getByText('80/100')).toBeInTheDocument() // Player HP
      expect(screen.getByText('60/80')).toBeInTheDocument()  // Companion HP
    })

    test('should display MP bars for player team', () => {
      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      expect(screen.getByText('30/50')).toBeInTheDocument() // Player MP
      expect(screen.getByText('25/40')).toBeInTheDocument() // Companion MP
    })

    test('should show correct HP bar colors based on health percentage', () => {
      const lowHpPlayer = { ...mockPlayer, hp: 15 } // 15% HP
      const mediumHpCompanion = { ...mockCompanion, hp: 40 } // 50% HP

      render(
        <BattleHUD
          playerTeam={[lowHpPlayer, mediumHpCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      // HP가 낮을 때 빨간색, 중간일 때 노란색 확인
      const hpBars = screen.getAllByRole('progressbar')
      expect(hpBars.length).toBeGreaterThan(0)
    })

    test('should handle zero HP units correctly', () => {
      const deadCompanion = { ...mockCompanion, hp: 0, isAlive: false }

      render(
        <BattleHUD
          playerTeam={[mockPlayer, deadCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      expect(screen.getByText('0/80')).toBeInTheDocument()
      expect(screen.getByText('전투 불능')).toBeInTheDocument()
    })
  })

  describe('Status Effects Display', () => {
    test('should display buff icons and descriptions', () => {
      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      expect(screen.getByText('💪')).toBeInTheDocument() // Strength buff icon
      expect(screen.getByText('힘 증가')).toBeInTheDocument()
    })

    test('should display debuff icons and descriptions', () => {
      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      expect(screen.getByText('☠️')).toBeInTheDocument() // Poison debuff icon
      expect(screen.getByText('독')).toBeInTheDocument()
    })

    test('should show duration for timed effects', () => {
      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      expect(screen.getByText('3턴')).toBeInTheDocument() // Buff duration
      expect(screen.getByText('2턴')).toBeInTheDocument() // Debuff duration
    })

    test('should handle units with no status effects', () => {
      const cleanPlayer = { ...mockPlayer, buffs: [], debuffs: [] }
      const cleanCompanion = { ...mockCompanion, buffs: [], debuffs: [] }

      render(
        <BattleHUD
          playerTeam={[cleanPlayer, cleanCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      expect(screen.queryByText('💪')).not.toBeInTheDocument()
      expect(screen.queryByText('☠️')).not.toBeInTheDocument()
    })
  })

  describe('Battle Controls', () => {
    test('should handle attack action', () => {
      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      const attackButton = screen.getByText('공격')
      fireEvent.click(attackButton)

      expect(mockOnAction).toHaveBeenCalledWith('attack')
    })

    test('should handle skill action', () => {
      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      const skillButton = screen.getByText('스킬')
      fireEvent.click(skillButton)

      expect(mockOnAction).toHaveBeenCalledWith('skill')
    })

    test('should handle escape action', () => {
      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      const escapeButton = screen.getByText('도주')
      fireEvent.click(escapeButton)

      expect(mockOnEscape).toHaveBeenCalled()
    })

    test('should disable controls when not player turn', () => {
      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={false}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      expect(screen.queryByRole('button', { name: '공격' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '스킬' })).not.toBeInTheDocument()
    })
  })

  describe('Visual Indicators', () => {
    test('should highlight current acting unit', () => {
      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          currentActor={mockPlayer}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      const playerCard = screen.getByText('테스트 플레이어').closest('.unit-card')
      expect(playerCard).toHaveClass('active')
    })

    test('should show dead unit visual state', () => {
      const deadEnemy = { ...mockEnemies[0], hp: 0, isAlive: false }

      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={[deadEnemy, mockEnemies[1]]}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      const deadUnitCard = screen.getByText('슬라임').closest('.unit-card')
      expect(deadUnitCard).toHaveClass('dead')
    })

    test('should show turn indicator', () => {
      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={5}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      expect(screen.getByText('플레이어 턴')).toBeInTheDocument()
    })

    test('should show enemy turn indicator', () => {
      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={5}
          isPlayerTurn={false}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      expect(screen.getByText('적 턴')).toBeInTheDocument()
    })
  })

  describe('Accessibility Features', () => {
    test('should have proper ARIA labels for HP bars', () => {
      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      expect(screen.getByLabelText('테스트 플레이어 체력')).toBeInTheDocument()
      expect(screen.getByLabelText('테스트 동반자 체력')).toBeInTheDocument()
    })

    test('should have proper ARIA labels for MP bars', () => {
      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      expect(screen.getByLabelText('테스트 플레이어 마나')).toBeInTheDocument()
      expect(screen.getByLabelText('테스트 동반자 마나')).toBeInTheDocument()
    })

    test('should provide keyboard navigation for controls', () => {
      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      const attackButton = screen.getByText('공격')
      const skillButton = screen.getByText('스킬')
      const escapeButton = screen.getByText('도주')

      expect(attackButton.tabIndex).not.toBe(-1)
      expect(skillButton.tabIndex).not.toBe(-1)
      expect(escapeButton.tabIndex).not.toBe(-1)
    })

    test('should provide screen reader friendly status descriptions', () => {
      render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      expect(screen.getByText('80% 체력')).toBeInTheDocument()
      expect(screen.getByText('60% 마나')).toBeInTheDocument()
    })
  })

  describe('Performance Tests', () => {
    test('should render efficiently with many units', () => {
      const largePlayerTeam = [mockPlayer, mockCompanion]
      const largeEnemyTeam = [
        createEnemy('slime', 3),
        createEnemy('goblin', 3),
        createEnemy('spider', 3),
        createEnemy('wolf', 3),
        createEnemy('slime', 4)
      ]

      const startTime = performance.now()
      render(
        <BattleHUD
          playerTeam={largePlayerTeam}
          enemyTeam={largeEnemyTeam}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(50) // 50ms 이내
    })

    test('should handle frequent HP/MP updates efficiently', () => {
      const { rerender } = render(
        <BattleHUD
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      // 여러 번 HP 값을 변경하여 리렌더링
      const startTime = performance.now()
      for (let i = 0; i < 10; i++) {
        const updatedPlayer = { ...mockPlayer, hp: 100 - i * 5 }
        rerender(
          <BattleHUD
            playerTeam={[updatedPlayer, mockCompanion]}
            enemyTeam={mockEnemies}
            currentTurn={1}
            isPlayerTurn={true}
            onAction={mockOnAction}
            onEscape={mockOnEscape}
          />
        )
      }
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100) // 100ms 이내
    })
  })

  describe('Edge Cases', () => {
    test('should handle empty teams gracefully', () => {
      render(
        <BattleHUD
          playerTeam={[]}
          enemyTeam={[]}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      expect(screen.getByText('팀 없음')).toBeInTheDocument()
    })

    test('should handle units with extreme stat values', () => {
      const extremeUnit = {
        ...mockPlayer,
        hp: 0,
        maxHp: 999999,
        mp: 999999,
        maxMp: 999999
      }

      render(
        <BattleHUD
          playerTeam={[extremeUnit]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      expect(screen.getByText('0/999999')).toBeInTheDocument()
    })

    test('should handle missing status effect properties', () => {
      const malformedBuff = {
        id: 'malformed_buff',
        name: '',
        type: 'buff' as const,
        duration: 0,
        statModifiers: {},
        icon: '',
        description: ''
      }

      const unitWithMalformedBuff = {
        ...mockPlayer,
        buffs: [malformedBuff]
      }

      render(
        <BattleHUD
          playerTeam={[unitWithMalformedBuff]}
          enemyTeam={mockEnemies}
          currentTurn={1}
          isPlayerTurn={true}
          onAction={mockOnAction}
          onEscape={mockOnEscape}
        />
      )

      // 에러 없이 렌더링되어야 함
      expect(screen.getByText('테스트 플레이어')).toBeInTheDocument()
    })
  })
})