/**
 * 🏆 Battle Victory Screen Component
 * 
 * Victory/defeat results with rewards and progression display
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BattleResult, BattleRewards } from '@/systems/battle/types'

interface BattleVictoryScreenProps {
  result: BattleResult
  onContinue: () => void
  className?: string
}

export function BattleVictoryScreen({
  result,
  onContinue,
  className = ''
}: BattleVictoryScreenProps) {
  const [showRewards, setShowRewards] = useState(false)
  const [showStats, setShowStats] = useState(false)

  useEffect(() => {
    const timer1 = setTimeout(() => setShowRewards(true), 1000)
    const timer2 = setTimeout(() => setShowStats(true), 2000)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'common': return 'text-gray-300 bg-gray-600/20'
      case 'rare': return 'text-blue-400 bg-blue-600/20'
      case 'epic': return 'text-purple-400 bg-purple-600/20'
      case 'legendary': return 'text-orange-400 bg-orange-600/20'
      default: return 'text-gray-300 bg-gray-600/20'
    }
  }

  const getBattleGrade = (): { grade: string, color: string, description: string } => {
    if (!result.victory) {
      return { grade: 'D', color: 'text-red-400', description: '패배' }
    }

    const { statistics, turns } = result
    const totalDamage = statistics.totalDamageDealt
    const critRate = statistics.criticalHits / Math.max(1, statistics.totalDamageDealt / 100)
    const efficiency = totalDamage / Math.max(1, turns)

    if (turns <= 3 && critRate >= 0.2 && efficiency >= 100) {
      return { grade: 'S+', color: 'text-yellow-400', description: '완벽한 승리' }
    } else if (turns <= 5 && critRate >= 0.15) {
      return { grade: 'S', color: 'text-yellow-300', description: '훌륭한 승리' }
    } else if (turns <= 8 && critRate >= 0.1) {
      return { grade: 'A', color: 'text-green-400', description: '좋은 승리' }
    } else if (turns <= 12) {
      return { grade: 'B', color: 'text-blue-400', description: '보통 승리' }
    } else {
      return { grade: 'C', color: 'text-gray-400', description: '어려운 승리' }
    }
  }

  const battleGrade = getBattleGrade()

  return (
    <div className={`battle-victory-screen fixed inset-0 z-50 ${className}`}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-2 h-2 rounded-full ${
                result.victory ? 'bg-yellow-400' : 'bg-red-400'
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-20, -100],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        
        {/* Main Result */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: 'spring',
            stiffness: 200,
            damping: 15,
            duration: 0.8 
          }}
          className="text-center mb-8"
        >
          <div className={`text-8xl mb-4 ${result.victory ? 'animate-bounce' : ''}`}>
            {result.victory ? '🏆' : '💔'}
          </div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`text-4xl font-bold mb-2 ${
              result.victory ? 'text-yellow-400' : 'text-red-400'
            }`}
          >
            {result.victory ? '승리!' : '패배...'}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-gray-300"
          >
            {result.victory ? '축하합니다!' : '다시 도전해보세요!'}
          </motion.div>

          {/* Battle Grade */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-4"
          >
            <div className={`inline-block px-6 py-3 rounded-lg bg-black/40 backdrop-blur-sm border-2 ${
              battleGrade.color.replace('text-', 'border-')
            }`}>
              <div className={`text-3xl font-bold ${battleGrade.color}`}>
                {battleGrade.grade}
              </div>
              <div className="text-sm text-gray-300 mt-1">
                {battleGrade.description}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Battle Statistics */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="bg-black/40 backdrop-blur-sm rounded-lg p-6 mb-8 w-full max-w-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-4 text-center">전투 통계</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-400">
                    {result.turns}
                  </div>
                  <div className="text-sm text-gray-400">턴 수</div>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-red-400">
                    {formatNumber(result.statistics.totalDamageDealt)}
                  </div>
                  <div className="text-sm text-gray-400">총 데미지</div>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-400">
                    {formatNumber(result.statistics.totalHealing)}
                  </div>
                  <div className="text-sm text-gray-400">총 회복</div>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-orange-400">
                    {result.statistics.criticalHits}
                  </div>
                  <div className="text-sm text-gray-400">치명타</div>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-400">
                    {result.statistics.skillsUsed}
                  </div>
                  <div className="text-sm text-gray-400">스킬 사용</div>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-cyan-400">
                    {result.statistics.statusEffectsApplied}
                  </div>
                  <div className="text-sm text-gray-400">상태 효과</div>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-400">
                    {result.statistics.missedAttacks}
                  </div>
                  <div className="text-sm text-gray-400">빗나간 공격</div>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-yellow-400">
                    {Math.round((result.statistics.criticalHits / Math.max(1, result.statistics.totalDamageDealt / 100)) * 100)}%
                  </div>
                  <div className="text-sm text-gray-400">치명타율</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rewards */}
        <AnimatePresence>
          {showRewards && result.victory && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="bg-black/40 backdrop-blur-sm rounded-lg p-6 mb-8 w-full max-w-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-4 text-center">보상</h2>
              
              <div className="space-y-4">
                {/* Experience */}
                <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">⭐</div>
                    <div>
                      <div className="text-white font-medium">경험치</div>
                      <div className="text-sm text-gray-400">
                        플레이어: {formatNumber(result.experienceGained.player)} | 
                        동반자: {formatNumber(result.experienceGained.companion)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-yellow-400">
                    +{formatNumber(result.experienceGained.player + result.experienceGained.companion)}
                  </div>
                </div>

                {/* Gold */}
                <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">💰</div>
                    <div>
                      <div className="text-white font-medium">골드</div>
                      <div className="text-sm text-gray-400">전투 보상</div>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-yellow-400">
                    +{formatNumber(result.rewards.gold)}
                  </div>
                </div>

                {/* Items */}
                {result.rewards.items && result.rewards.items.length > 0 && (
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="text-white font-medium mb-3 flex items-center">
                      <span className="text-2xl mr-2">🎁</span>
                      획득 아이템
                    </div>
                    <div className="space-y-2">
                      {result.rewards.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`px-2 py-1 rounded text-xs ${getRarityColor(item.rarity)}`}>
                              {item.rarity}
                            </div>
                            <div className="text-gray-300">{item.name}</div>
                          </div>
                          <div className="text-yellow-400 font-medium">
                            x{item.quantity}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Relationship Bonus */}
                {result.rewards.relationshipBonus && result.rewards.relationshipBonus > 0 && (
                  <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">💝</div>
                      <div>
                        <div className="text-white font-medium">관계 향상</div>
                        <div className="text-sm text-gray-400">동반자와의 유대감</div>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-pink-400">
                      +{result.rewards.relationshipBonus}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: result.victory ? 3 : 1.5 }}
          onClick={onContinue}
          className={`px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 ${
            result.victory
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {result.victory ? '계속하기' : '다시 시도'}
        </motion.button>

        {/* Skip Animation Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => {
            setShowRewards(true)
            setShowStats(true)
          }}
          className="mt-4 text-sm text-gray-400 hover:text-white transition-colors"
        >
          애니메이션 건너뛰기
        </motion.button>
      </div>
    </div>
  )
}

export default BattleVictoryScreen