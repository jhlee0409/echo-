/**
 * 💫 Special Moments System - 특별한 순간 연출 시스템
 * 
 * 친밀도 레벨업, 중요한 선택지, 마일스톤 달성 등
 * 게임의 특별한 순간들을 Tailwind CSS로 시각적으로 연출
 */

import React, { useState, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import { ParticleSystem, SpecialMoment } from './AnimationSystem'
import type { EmotionType } from '@types'

// 특별한 순간 타입 정의
export type SpecialMomentType = 
  | 'intimacy_levelup'     // 친밀도 레벨업
  | 'trust_milestone'      // 신뢰도 마일스톤
  | 'emotional_breakthrough' // 감정적 돌파
  | 'memory_milestone'     // 기억 마일스톤
  | 'relationship_evolution' // 관계 진화
  | 'critical_choice'      // 중요한 선택
  | 'special_achievement'  // 특별한 성취
  | 'anniversary'          // 기념일
  | 'confession'           // 고백/진심
  | 'farewell'            // 이별/작별

// 특별한 순간 데이터 인터페이스
export interface SpecialMomentData {
  type: SpecialMomentType
  title: string
  subtitle?: string
  emotion: EmotionType
  duration?: number
  particles?: {
    type: 'hearts' | 'stars' | 'sparkles'
    count: number
    color: string
  }
}

// 특별한 순간 컴포넌트 - Tailwind CSS 완전 구현
export const SpecialMomentsRenderer: React.FC<{
  moment: SpecialMomentData | null
  onComplete?: () => void
}> = ({ moment, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [showParticles, setShowParticles] = useState(false)

  useEffect(() => {
    if (moment) {
      setTimeout(() => setIsVisible(true), 100)
      setTimeout(() => setShowParticles(true), 500)
    } else {
      setIsVisible(false)
      setShowParticles(false)
    }
  }, [moment])

  if (!moment) return null

  const handleComplete = () => {
    setIsVisible(false)
    setShowParticles(false)
    setTimeout(() => onComplete?.(), 300)
  }

  const getMomentColors = (type: SpecialMomentType) => {
    const colorMap = {
      intimacy_levelup: 'from-pink-500/90 to-rose-600/90 border-pink-400/50',
      trust_milestone: 'from-blue-500/90 to-indigo-600/90 border-blue-400/50',
      emotional_breakthrough: 'from-purple-500/90 to-violet-600/90 border-purple-400/50',
      memory_milestone: 'from-amber-500/90 to-orange-600/90 border-amber-400/50',
      relationship_evolution: 'from-emerald-500/90 to-teal-600/90 border-emerald-400/50',
      critical_choice: 'from-red-500/90 to-pink-600/90 border-red-400/50',
      special_achievement: 'from-yellow-500/90 to-amber-600/90 border-yellow-400/50',
      anniversary: 'from-cyan-500/90 to-blue-600/90 border-cyan-400/50',
      confession: 'from-rose-500/90 to-pink-600/90 border-rose-400/50',
      farewell: 'from-slate-500/90 to-gray-600/90 border-slate-400/50'
    }
    return colorMap[type] || 'from-purple-900/90 to-blue-900/90 border-cyan-400/50'
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className={clsx(
          "fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]",
          "transition-all duration-500 ease-out",
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleComplete}
      >
        {/* Main Modal */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div 
            className={clsx(
              "bg-gradient-to-br",
              getMomentColors(moment.type),
              "backdrop-blur-md rounded-3xl shadow-2xl",
              "p-8 max-w-md mx-4 text-center pointer-events-auto",
              "transform transition-all duration-700 ease-out",
              isVisible 
                ? "scale-100 translate-y-0 opacity-100" 
                : "scale-75 translate-y-8 opacity-0"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glowing Ring Animation */}
            <div className={clsx(
              "absolute -inset-1 rounded-3xl opacity-75",
              "bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400",
              "animate-[glow-ring_3s_ease-in-out_infinite_alternate]",
              "blur-sm"
            )} />
            
            {/* Content Container */}
            <div className="relative z-10">
              {/* Title */}
              <h2 className={clsx(
                "text-3xl font-bold text-white mb-3",
                "animate-[text-shimmer_2s_ease-in-out_infinite_alternate]",
                "bg-gradient-to-r from-white via-cyan-100 to-white",
                "bg-clip-text text-transparent bg-[length:200%_100%]"
              )}>
                {moment.title}
              </h2>
              
              {/* Subtitle */}
              {moment.subtitle && (
                <p className="text-cyan-100/90 mb-6 text-lg leading-relaxed">
                  {moment.subtitle}
                </p>
              )}
              
              {/* Particle Icon Display */}
              <div className={clsx(
                "text-6xl mb-6 transition-all duration-1000",
                showParticles && "animate-[celebration-bounce_1.5s_ease-out_infinite]"
              )}>
                {moment.particles?.type === 'hearts' ? '💖' :
                 moment.particles?.type === 'stars' ? '⭐' :
                 moment.particles?.type === 'sparkles' ? '✨' : '🌟'}
              </div>
              
              {/* Action Button */}
              <button
                onClick={handleComplete}
                className={clsx(
                  "bg-gradient-to-r from-cyan-500 to-purple-500",
                  "hover:from-cyan-400 hover:to-purple-400",
                  "text-white font-semibold px-8 py-3 rounded-full",
                  "transform transition-all duration-300",
                  "hover:scale-105 hover:shadow-[0_0_20px_rgba(147,51,234,0.5)]",
                  "active:scale-95",
                  "focus:outline-none focus:ring-4 focus:ring-purple-400/50"
                )}
              >
                계속
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Particle System */}
      {showParticles && moment.particles && (
        <ParticleSystem config={moment.particles} />
      )}

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes glow-ring {
          0%, 100% { 
            transform: scale(1) rotate(0deg);
            opacity: 0.5;
          }
          50% { 
            transform: scale(1.05) rotate(180deg);
            opacity: 0.8;
          }
        }
        
        @keyframes text-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes celebration-bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0) scale(1) rotate(0deg);
          }
          40% {
            transform: translateY(-20px) scale(1.1) rotate(10deg);
          }
          60% {
            transform: translateY(-10px) scale(1.05) rotate(-5deg);
          }
        }
      `}</style>
    </>
  )
}

// 특별한 순간 훅
export const useSpecialMoments = () => {
  const [currentMoment, setCurrentMoment] = useState<SpecialMomentData | null>(null)
  const [queue, setQueue] = useState<SpecialMomentData[]>([])

  const showMoment = useCallback((moment: SpecialMomentData) => {
    if (currentMoment) {
      setQueue(prev => [...prev, moment])
    } else {
      setCurrentMoment(moment)
    }
  }, [currentMoment])

  const completeMoment = useCallback(() => {
    setCurrentMoment(null)
    setQueue(prev => {
      if (prev.length > 0) {
        setCurrentMoment(prev[0])
        return prev.slice(1)
      }
      return []
    })
  }, [])

  return {
    currentMoment,
    showMoment,
    completeMoment,
    queueLength: queue.length
  }
}

export default SpecialMomentsRenderer