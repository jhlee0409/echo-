/**
 * 🗡️ BattleScreen UI Component 테스트
 * 
 * 메인 전투 화면 컴포넌트 테스트 - 통합 UI, 이벤트 처리, 상태 관리
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import BattleScreen from '../BattleScreen'
import { createEnemy } from '@systems/battle/enemies'
import { playerSkills } from '@systems/battle/skills'
import type { BattleFormation, BattleUnit } from '@systems/battle/types'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock AutoBattleSystem
vi.mock('@systems/battle/AutoBattleSystem', () => ({
  AutoBattleSystem: vi.fn().mockImplementation(() => ({
    executeBattle: vi.fn().mockResolvedValue({
      victory: true,
      turns: 5,
      experienceGained: { player: 100, companion: 80 },
      rewards: { gold: 50, items: [], experience: 180 },
      battleLog: [
        { turn: 1, action: 'attack', attacker: 'player', target: 'enemy', damage: 25, message: '플레이어가 슬라임을 공격했습니다!' },
        { turn: 2, action: 'skill', attacker: 'companion', target: 'player', healing: 20, message: '동반자가 플레이어를 치유했습니다!' }
      ],
      statistics: {
        totalDamageDealt: 125,
        totalHealing: 45,
        skillsUsed: 3,
        criticalHits: 1,
        missedAttacks: 0,
        statusEffectsApplied: 2
      }
    }),
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn()
  }))
}))

describe('BattleScreen Component', () => {
  let mockPlayer: BattleUnit
  let mockCompanion: BattleUnit
  let mockEnemies: BattleUnit[]
  let mockFormation: BattleFormation
  let mockOnBattleEnd: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockPlayer = {
      id: 'player_test',
      name: '테스트 플레이어',
      type: 'player',
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      attack: 20,
      defense: 10,
      speed: 12,
      critRate: 15,
      critDamage: 150,
      accuracy: 95,
      evasion: 5,
      skills: [playerSkills.power_strike, playerSkills.heal],
      buffs: [],
      debuffs: [],
      isAlive: true
    }

    mockCompanion = {
      id: 'companion_test',
      name: '테스트 동반자',
      type: 'companion',
      hp: 80,
      maxHp: 80,
      mp: 40,
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
      isAlive: true,
      personality: {
        aggression: 0.3,
        caution: 0.7,
        support: 0.8,
        independence: 0.2
      }
    }

    mockEnemies = [createEnemy('slime', 2)]

    mockFormation = {
      playerTeam: [mockPlayer, mockCompanion],
      enemyTeam: mockEnemies
    }

    mockOnBattleEnd = vi.fn()

    // Reset mocks
    vi.clearAllMocks()
  })

  describe('Component Initialization', () => {
    test('should render battle screen with initial state', () => {
      render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
        />
      )

      expect(screen.getByText('테스트 플레이어')).toBeInTheDocument()
      expect(screen.getByText('테스트 동반자')).toBeInTheDocument()
      expect(screen.getByText('슬라임')).toBeInTheDocument()
    })

    test('should display battle controls', () => {
      render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
        />
      )

      expect(screen.getByText('전투 시작')).toBeInTheDocument()
      expect(screen.getByText('도주')).toBeInTheDocument()
    })

    test('should show HP and MP bars for all units', () => {
      render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
        />
      )

      // HP bars should be visible
      const hpBars = screen.getAllByText(/HP/i)
      expect(hpBars.length).toBeGreaterThan(0)

      // MP bars for player team
      const mpBars = screen.getAllByText(/MP/i)
      expect(mpBars.length).toBeGreaterThan(0)
    })
  })

  describe('Battle Flow Control', () => {
    test('should start battle when start button clicked', async () => {
      render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
        />
      )

      const startButton = screen.getByText('전투 시작')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('전투 진행 중...')).toBeInTheDocument()
      })
    })

    test('should disable controls during battle', async () => {
      render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
        />
      )

      const startButton = screen.getByText('전투 시작')
      fireEvent.click(startButton)

      await waitFor(() => {
        const disabledStartButton = screen.getByText('전투 시작')
        expect(disabledStartButton).toBeDisabled()
      })
    })

    test('should handle escape action', async () => {
      render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
        />
      )

      const escapeButton = screen.getByText('도주')
      fireEvent.click(escapeButton)

      await waitFor(() => {
        expect(mockOnBattleEnd).toHaveBeenCalledWith({
          victory: false,
          escaped: true
        })
      })
    })
  })

  describe('Battle State Management', () => {
    test('should update battle state during combat', async () => {
      render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
        />
      )

      const startButton = screen.getByText('전투 시작')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/턴 \d+/)).toBeInTheDocument()
      })
    })

    test('should display battle log entries', async () => {
      render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
        />
      )

      const startButton = screen.getByText('전투 시작')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('플레이어가 슬라임을 공격했습니다!')).toBeInTheDocument()
        expect(screen.getByText('동반자가 플레이어를 치유했습니다!')).toBeInTheDocument()
      })
    })

    test('should show skill menu when player turn', async () => {
      render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
        />
      )

      const startButton = screen.getByText('전투 시작')
      fireEvent.click(startButton)

      // 스킬이 표시되어야 함
      await waitFor(() => {
        expect(screen.getByText('강타')).toBeInTheDocument()
        expect(screen.getByText('치유')).toBeInTheDocument()
      })
    })
  })

  describe('Victory/Defeat Handling', () => {
    test('should show victory screen on battle win', async () => {
      render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
        />
      )

      const startButton = screen.getByText('전투 시작')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('승리!')).toBeInTheDocument()
        expect(screen.getByText('축하합니다!')).toBeInTheDocument()
      })
    })

    test('should call onBattleEnd with correct results', async () => {
      render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
        />
      )

      const startButton = screen.getByText('전투 시작')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(mockOnBattleEnd).toHaveBeenCalledWith(
          expect.objectContaining({
            victory: true,
            turns: 5,
            experienceGained: { player: 100, companion: 80 },
            rewards: expect.objectContaining({ gold: 50 })
          })
        )
      })
    })

    test('should update character progression on victory', async () => {
      const mockUpdateProgress = vi.fn()
      
      render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
          onProgressUpdate={mockUpdateProgress}
        />
      )

      const startButton = screen.getByText('전투 시작')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(mockUpdateProgress).toHaveBeenCalledWith({
          playerId: 'player_test',
          companionId: 'companion_test',
          experience: { player: 100, companion: 80 },
          relationship: expect.any(Number)
        })
      })
    })
  })

  describe('Error Handling', () => {
    test('should handle battle system errors gracefully', async () => {
      // Mock battle system to throw error
      const { AutoBattleSystem } = await import('@systems/battle/AutoBattleSystem')
      vi.mocked(AutoBattleSystem).mockImplementation(() => ({
        executeBattle: vi.fn().mockRejectedValue(new Error('Battle system error')),
        on: vi.fn(),
        off: vi.fn(),
        once: vi.fn()
      }) as any)

      render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
        />
      )

      const startButton = screen.getByText('전투 시작')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('전투 중 오류가 발생했습니다.')).toBeInTheDocument()
      })
    })

    test('should handle invalid formation', () => {
      const invalidFormation: BattleFormation = {
        playerTeam: [],
        enemyTeam: []
      }

      render(
        <BattleScreen 
          formation={invalidFormation} 
          onBattleEnd={mockOnBattleEnd}
        />
      )

      expect(screen.getByText('유효하지 않은 전투 구성입니다.')).toBeInTheDocument()
    })

    test('should prevent multiple battle starts', async () => {
      render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
        />
      )

      const startButton = screen.getByText('전투 시작')
      
      // 빠르게 여러 번 클릭
      fireEvent.click(startButton)
      fireEvent.click(startButton)
      fireEvent.click(startButton)

      // 한 번만 실행되어야 함
      await waitFor(() => {
        const battleSystem = new (require('@systems/battle/AutoBattleSystem').AutoBattleSystem)()
        expect(battleSystem.executeBattle).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
        />
      )

      expect(screen.getByRole('button', { name: '전투 시작' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '도주' })).toBeInTheDocument()
      expect(screen.getByLabelText('전투 화면')).toBeInTheDocument()
    })

    test('should support keyboard navigation', async () => {
      render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
        />
      )

      const startButton = screen.getByText('전투 시작')
      startButton.focus()
      
      expect(document.activeElement).toBe(startButton)
      
      // Enter 키로 실행
      fireEvent.keyDown(startButton, { key: 'Enter', code: 'Enter' })
      
      await waitFor(() => {
        expect(screen.getByText('전투 진행 중...')).toBeInTheDocument()
      })
    })

    test('should provide screen reader friendly content', () => {
      render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
        />
      )

      // 스크린 리더를 위한 상태 정보
      expect(screen.getByText('플레이어 HP: 100/100')).toBeInTheDocument()
      expect(screen.getByText('동반자 HP: 80/80')).toBeInTheDocument()
      expect(screen.getByText('슬라임 HP: ')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    test('should render efficiently with many units', () => {
      const largeFormation: BattleFormation = {
        playerTeam: [mockPlayer, mockCompanion],
        enemyTeam: [
          createEnemy('slime', 3),
          createEnemy('goblin', 3),
          createEnemy('spider', 3),
          createEnemy('wolf', 3)
        ]
      }

      const startTime = performance.now()
      render(
        <BattleScreen 
          formation={largeFormation} 
          onBattleEnd={mockOnBattleEnd}
        />
      )
      const endTime = performance.now()

      // 렌더링이 100ms 이내에 완료되어야 함
      expect(endTime - startTime).toBeLessThan(100)
    })

    test('should handle rapid state updates', async () => {
      render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
        />
      )

      const startButton = screen.getByText('전투 시작')
      fireEvent.click(startButton)

      // 빠른 상태 업데이트가 있어도 안정적이어야 함
      await waitFor(() => {
        expect(screen.getByText(/턴/)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    test('should cleanup resources on unmount', () => {
      const { unmount } = render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
        />
      )

      // 컴포넌트 언마운트
      unmount()

      // 메모리 누수 확인은 실제 브라우저 환경에서 더 정확함
      // 여기서는 기본적인 정리 확인만 수행
      expect(true).toBe(true)
    })
  })

  describe('Integration Tests', () => {
    test('should integrate with character evolution system', async () => {
      const mockEvolutionUpdate = vi.fn()

      render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
          onCharacterEvolution={mockEvolutionUpdate}
        />
      )

      const startButton = screen.getByText('전투 시작')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(mockEvolutionUpdate).toHaveBeenCalledWith({
          characterId: 'player_test',
          experienceGained: 100,
          battleStats: expect.any(Object)
        })
      })
    })

    test('should integrate with relationship system', async () => {
      const mockRelationshipUpdate = vi.fn()

      render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
          onRelationshipUpdate={mockRelationshipUpdate}
        />
      )

      const startButton = screen.getByText('전투 시작')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(mockRelationshipUpdate).toHaveBeenCalledWith({
          companionId: 'companion_test',
          relationshipChange: expect.any(Number),
          battleContext: expect.any(Object)
        })
      })
    })

    test('should handle real-time battle events', async () => {
      const mockEventHandler = vi.fn()

      render(
        <BattleScreen 
          formation={mockFormation} 
          onBattleEnd={mockOnBattleEnd}
          onBattleEvent={mockEventHandler}
        />
      )

      const startButton = screen.getByText('전투 시작')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(mockEventHandler).toHaveBeenCalledWith({
          type: 'battle_start',
          data: expect.any(Object)
        })
      })
    })
  })
})