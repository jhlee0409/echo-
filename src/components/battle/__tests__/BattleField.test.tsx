/**
 * ⚔️ BattleField UI Component 테스트
 * 
 * 전투 필드 시각화 컴포넌트 테스트 - 유닛 배치, 애니메이션, 데미지 표시
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import BattleField from '../BattleField'
import { createEnemy } from '@systems/battle/enemies'
import type { BattleUnit, BattleEvent } from '@systems/battle/types'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

describe('BattleField Component', () => {
  let mockPlayer: BattleUnit
  let mockCompanion: BattleUnit
  let mockEnemies: BattleUnit[]
  let mockOnUnitClick: ReturnType<typeof vi.fn>

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
      skills: [],
      buffs: [],
      debuffs: [],
      isAlive: true
    }

    mockEnemies = [
      createEnemy('slime', 2),
      createEnemy('goblin', 3)
    ]

    mockOnUnitClick = vi.fn()

    vi.clearAllMocks()
  })

  describe('Unit Positioning', () => {
    test('should render all units in correct positions', () => {
      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          onUnitClick={mockOnUnitClick}
        />
      )

      expect(screen.getByText('테스트 플레이어')).toBeInTheDocument()
      expect(screen.getByText('테스트 동반자')).toBeInTheDocument()
      expect(screen.getByText('슬라임')).toBeInTheDocument()
      expect(screen.getByText('고블린')).toBeInTheDocument()
    })

    test('should position player team on the left side', () => {
      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          onUnitClick={mockOnUnitClick}
        />
      )

      const playerUnits = screen.getAllByTestId(/player-unit/)
      playerUnits.forEach(unit => {
        expect(unit).toHaveClass('player-side')
      })
    })

    test('should position enemy team on the right side', () => {
      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          onUnitClick={mockOnUnitClick}
        />
      )

      const enemyUnits = screen.getAllByTestId(/enemy-unit/)
      enemyUnits.forEach(unit => {
        expect(unit).toHaveClass('enemy-side')
      })
    })

    test('should handle different team sizes gracefully', () => {
      const largeEnemyTeam = [
        createEnemy('slime', 1),
        createEnemy('goblin', 2),
        createEnemy('spider', 2),
        createEnemy('wolf', 3)
      ]

      render(
        <BattleField
          playerTeam={[mockPlayer]}
          enemyTeam={largeEnemyTeam}
          onUnitClick={mockOnUnitClick}
        />
      )

      expect(screen.getByText('테스트 플레이어')).toBeInTheDocument()
      expect(screen.getByText('슬라임')).toBeInTheDocument()
      expect(screen.getByText('고블린')).toBeInTheDocument()
      expect(screen.getByText('거미')).toBeInTheDocument()
      expect(screen.getByText('늑대')).toBeInTheDocument()
    })
  })

  describe('Unit Visual States', () => {
    test('should show healthy units normally', () => {
      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          onUnitClick={mockOnUnitClick}
        />
      )

      const playerUnit = screen.getByTestId('unit-player_test')
      expect(playerUnit).not.toHaveClass('low-health')
      expect(playerUnit).not.toHaveClass('dead')
    })

    test('should highlight low health units', () => {
      const lowHealthPlayer = { ...mockPlayer, hp: 10 } // 10% HP

      render(
        <BattleField
          playerTeam={[lowHealthPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          onUnitClick={mockOnUnitClick}
        />
      )

      const playerUnit = screen.getByTestId('unit-player_test')
      expect(playerUnit).toHaveClass('low-health')
    })

    test('should show dead units with appropriate styling', () => {
      const deadCompanion = { ...mockCompanion, hp: 0, isAlive: false }

      render(
        <BattleField
          playerTeam={[mockPlayer, deadCompanion]}
          enemyTeam={mockEnemies}
          onUnitClick={mockOnUnitClick}
        />
      )

      const companionUnit = screen.getByTestId('unit-companion_test')
      expect(companionUnit).toHaveClass('dead')
    })

    test('should highlight currently acting unit', () => {
      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          currentActor={mockPlayer}
          onUnitClick={mockOnUnitClick}
        />
      )

      const playerUnit = screen.getByTestId('unit-player_test')
      expect(playerUnit).toHaveClass('active')
    })

    test('should show targeted units', () => {
      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          selectedTargets={[mockEnemies[0]]}
          onUnitClick={mockOnUnitClick}
        />
      )

      const targetedEnemy = screen.getByTestId(`unit-${mockEnemies[0].id}`)
      expect(targetedEnemy).toHaveClass('targeted')
    })
  })

  describe('Unit Interactions', () => {
    test('should handle unit click events', () => {
      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          onUnitClick={mockOnUnitClick}
        />
      )

      const enemyUnit = screen.getByTestId(`unit-${mockEnemies[0].id}`)
      fireEvent.click(enemyUnit)

      expect(mockOnUnitClick).toHaveBeenCalledWith(mockEnemies[0])
    })

    test('should prevent clicking on dead units', () => {
      const deadEnemy = { ...mockEnemies[0], hp: 0, isAlive: false }

      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={[deadEnemy, mockEnemies[1]]}
          onUnitClick={mockOnUnitClick}
        />
      )

      const deadEnemyUnit = screen.getByTestId(`unit-${deadEnemy.id}`)
      fireEvent.click(deadEnemyUnit)

      expect(mockOnUnitClick).not.toHaveBeenCalledWith(deadEnemy)
    })

    test('should show hover effects on interactive units', () => {
      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          onUnitClick={mockOnUnitClick}
        />
      )

      const enemyUnit = screen.getByTestId(`unit-${mockEnemies[0].id}`)
      fireEvent.mouseEnter(enemyUnit)

      expect(enemyUnit).toHaveClass('hover')
    })

    test('should disable interactions during animations', () => {
      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          isAnimating={true}
          onUnitClick={mockOnUnitClick}
        />
      )

      const enemyUnit = screen.getByTestId(`unit-${mockEnemies[0].id}`)
      fireEvent.click(enemyUnit)

      expect(mockOnUnitClick).not.toHaveBeenCalled()
    })
  })

  describe('Damage Numbers', () => {
    test('should display floating damage numbers', async () => {
      const damageEvents: BattleEvent[] = [
        {
          id: 'damage_1',
          type: 'damage',
          data: {
            targetId: mockEnemies[0].id,
            damage: 25,
            isCritical: false,
            position: { x: 100, y: 150 }
          }
        }
      ]

      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          damageEvents={damageEvents}
          onUnitClick={mockOnUnitClick}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('-25')).toBeInTheDocument()
      })
    })

    test('should display critical damage differently', async () => {
      const criticalDamageEvents: BattleEvent[] = [
        {
          id: 'crit_damage_1',
          type: 'damage',
          data: {
            targetId: mockEnemies[0].id,
            damage: 45,
            isCritical: true,
            position: { x: 100, y: 150 }
          }
        }
      ]

      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          damageEvents={criticalDamageEvents}
          onUnitClick={mockOnUnitClick}
        />
      )

      await waitFor(() => {
        const critDamage = screen.getByText('-45')
        expect(critDamage).toHaveClass('critical-damage')
      })
    })

    test('should display healing numbers in green', async () => {
      const healingEvents: BattleEvent[] = [
        {
          id: 'heal_1',
          type: 'heal',
          data: {
            targetId: mockPlayer.id,
            healing: 20,
            position: { x: 200, y: 100 }
          }
        }
      ]

      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          damageEvents={healingEvents}
          onUnitClick={mockOnUnitClick}
        />
      )

      await waitFor(() => {
        const healing = screen.getByText('+20')
        expect(healing).toHaveClass('healing')
      })
    })

    test('should handle multiple simultaneous damage events', async () => {
      const multiDamageEvents: BattleEvent[] = [
        {
          id: 'damage_1',
          type: 'damage',
          data: {
            targetId: mockEnemies[0].id,
            damage: 25,
            isCritical: false,
            position: { x: 100, y: 150 }
          }
        },
        {
          id: 'damage_2',
          type: 'damage',
          data: {
            targetId: mockEnemies[1].id,
            damage: 18,
            isCritical: false,
            position: { x: 150, y: 180 }
          }
        }
      ]

      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          damageEvents={multiDamageEvents}
          onUnitClick={mockOnUnitClick}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('-25')).toBeInTheDocument()
        expect(screen.getByText('-18')).toBeInTheDocument()
      })
    })
  })

  describe('Battle Effects', () => {
    test('should show status effect indicators', () => {
      const buffedPlayer = {
        ...mockPlayer,
        buffs: [{
          id: 'strength',
          name: '힘 증가',
          type: 'buff' as const,
          duration: 3,
          statModifiers: { attack: 5 },
          icon: '💪',
          description: '공격력 +5'
        }]
      }

      render(
        <BattleField
          playerTeam={[buffedPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          onUnitClick={mockOnUnitClick}
        />
      )

      expect(screen.getByText('💪')).toBeInTheDocument()
    })

    test('should animate skill effects', async () => {
      const skillEffects: BattleEvent[] = [
        {
          id: 'skill_effect_1',
          type: 'skill_effect',
          data: {
            skillId: 'power_strike',
            casterId: mockPlayer.id,
            targetId: mockEnemies[0].id,
            effect: 'slash',
            position: { x: 125, y: 160 }
          }
        }
      ]

      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          skillEffects={skillEffects}
          onUnitClick={mockOnUnitClick}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('skill-effect-slash')).toBeInTheDocument()
      })
    })

    test('should show environmental effects', () => {
      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          environment="forest"
          onUnitClick={mockOnUnitClick}
        />
      )

      expect(screen.getByTestId('battle-environment')).toHaveClass('forest')
    })
  })

  describe('Accessibility', () => {
    test('should have proper ARIA labels for units', () => {
      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          onUnitClick={mockOnUnitClick}
        />
      )

      expect(screen.getByLabelText('테스트 플레이어, 80/100 HP')).toBeInTheDocument()
      expect(screen.getByLabelText('테스트 동반자, 60/80 HP')).toBeInTheDocument()
      expect(screen.getByLabelText(/슬라임,.*HP/)).toBeInTheDocument()
    })

    test('should support keyboard navigation', () => {
      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          onUnitClick={mockOnUnitClick}
        />
      )

      const firstEnemy = screen.getByTestId(`unit-${mockEnemies[0].id}`)
      firstEnemy.focus()
      
      expect(document.activeElement).toBe(firstEnemy)
      
      // Tab to next enemy
      fireEvent.keyDown(firstEnemy, { key: 'Tab' })
      
      const secondEnemy = screen.getByTestId(`unit-${mockEnemies[1].id}`)
      expect(document.activeElement).toBe(secondEnemy)
    })

    test('should handle Enter key for unit selection', () => {
      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          onUnitClick={mockOnUnitClick}
        />
      )

      const enemyUnit = screen.getByTestId(`unit-${mockEnemies[0].id}`)
      fireEvent.keyDown(enemyUnit, { key: 'Enter' })

      expect(mockOnUnitClick).toHaveBeenCalledWith(mockEnemies[0])
    })

    test('should provide screen reader friendly status updates', () => {
      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          onUnitClick={mockOnUnitClick}
        />
      )

      expect(screen.getByText('전투 필드: 2명의 아군, 2명의 적군')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    test('should render efficiently with many units', () => {
      const largePlayerTeam = Array.from({ length: 4 }, (_, i) => ({
        ...mockPlayer,
        id: `player_${i}`,
        name: `플레이어 ${i + 1}`
      }))

      const largeEnemyTeam = Array.from({ length: 6 }, (_, i) => 
        createEnemy('slime', Math.floor(Math.random() * 5) + 1)
      )

      const startTime = performance.now()
      render(
        <BattleField
          playerTeam={largePlayerTeam}
          enemyTeam={largeEnemyTeam}
          onUnitClick={mockOnUnitClick}
        />
      )
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100) // 100ms 이내
    })

    test('should handle frequent damage events efficiently', async () => {
      const manyDamageEvents: BattleEvent[] = Array.from({ length: 20 }, (_, i) => ({
        id: `damage_${i}`,
        type: 'damage',
        data: {
          targetId: mockEnemies[i % mockEnemies.length].id,
          damage: Math.floor(Math.random() * 30) + 10,
          isCritical: Math.random() > 0.8,
          position: { x: 100 + (i * 10), y: 150 + (i * 5) }
        }
      }))

      const startTime = performance.now()
      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          damageEvents={manyDamageEvents}
          onUnitClick={mockOnUnitClick}
        />
      )

      await waitFor(() => {
        const damageNumbers = screen.getAllByText(/-\d+/)
        expect(damageNumbers.length).toBeGreaterThan(0)
      })

      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(200) // 200ms 이내
    })

    test('should clean up animations properly', async () => {
      const { rerender } = render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          damageEvents={[{
            id: 'damage_1',
            type: 'damage',
            data: {
              targetId: mockEnemies[0].id,
              damage: 25,
              isCritical: false,
              position: { x: 100, y: 150 }
            }
          }]}
          onUnitClick={mockOnUnitClick}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('-25')).toBeInTheDocument()
      })

      // Remove damage events
      rerender(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          damageEvents={[]}
          onUnitClick={mockOnUnitClick}
        />
      )

      // Damage numbers should be cleaned up
      await waitFor(() => {
        expect(screen.queryByText('-25')).not.toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    test('should handle empty teams', () => {
      render(
        <BattleField
          playerTeam={[]}
          enemyTeam={[]}
          onUnitClick={mockOnUnitClick}
        />
      )

      expect(screen.getByText('전투 필드가 비어있습니다')).toBeInTheDocument()
    })

    test('should handle units with extreme HP values', () => {
      const extremeUnit = {
        ...mockPlayer,
        hp: 0,
        maxHp: 999999
      }

      render(
        <BattleField
          playerTeam={[extremeUnit]}
          enemyTeam={mockEnemies}
          onUnitClick={mockOnUnitClick}
        />
      )

      expect(screen.getByText('테스트 플레이어')).toBeInTheDocument()
    })

    test('should handle missing event data gracefully', async () => {
      const malformedEvents: BattleEvent[] = [
        {
          id: 'malformed_1',
          type: 'damage',
          data: {} // Missing required properties
        } as any
      ]

      render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          damageEvents={malformedEvents}
          onUnitClick={mockOnUnitClick}
        />
      )

      // Should not crash
      expect(screen.getByText('테스트 플레이어')).toBeInTheDocument()
    })

    test('should handle rapid unit state changes', () => {
      const { rerender } = render(
        <BattleField
          playerTeam={[mockPlayer, mockCompanion]}
          enemyTeam={mockEnemies}
          onUnitClick={mockOnUnitClick}
        />
      )

      // Rapidly change unit HP
      for (let i = 0; i < 10; i++) {
        const updatedPlayer = { ...mockPlayer, hp: 100 - i * 10 }
        rerender(
          <BattleField
            playerTeam={[updatedPlayer, mockCompanion]}
            enemyTeam={mockEnemies}
            onUnitClick={mockOnUnitClick}
          />
        )
      }

      expect(screen.getByText('테스트 플레이어')).toBeInTheDocument()
    })
  })
})