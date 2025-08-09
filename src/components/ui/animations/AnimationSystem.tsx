/**
 * ⚡ Animation System - 게임 UI 애니메이션 통합 관리
 * 
 * 타이핑 효과, 감정 모프, 파티클 시스템을 통합 관리
 * Tailwind CSS 기반 성능 최적화된 애니메이션 엔진
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { clsx } from 'clsx'
import type { EmotionType } from '@types'

// 애니메이션 타입 정의
export type AnimationType = 
  | 'typing'
  | 'emotion_morph' 
  | 'particle'
  | 'special_moment'
  | 'transition'

export type ParticleType = 'hearts' | 'stars' | 'sparkles' | 'bubbles' | 'magic'

export interface AnimationConfig {
  duration: number
  delay: number
  easing: string
  repeat: boolean
}

export interface ParticleConfig {
  count: number
  type: ParticleType
  color: string
  size: number
  speed: number
  life: number
}

export interface SpecialMoment {
  type: string
  title: string
  subtitle?: string
  emotion: EmotionType
  config: AnimationConfig & ParticleConfig
}

// Particle system with Tailwind CSS animations
export const ParticleSystem: React.FC<{ config: Partial<ParticleConfig> }> = ({ config }) => {
  const particleCount = config.count || 10
  const particleType = config.type || 'sparkles'
  const particleColor = config.color || '#00FFF0'
  
  const particles = Array.from({ length: particleCount }, (_, i) => i)
  
  const getParticleIcon = (type: ParticleType) => {
    switch (type) {
      case 'hearts': return '💖'
      case 'stars': return '⭐'
      case 'sparkles': return '✨'
      case 'bubbles': return '🫧'
      case 'magic': return '🌟'
      default: return '✨'
    }
  }
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((_, index) => (
        <div
          key={index}
          className={clsx(
            "absolute text-2xl animate-bounce",
            "animate-[particle-float_3s_ease-in-out_infinite]"
          )}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            color: particleColor,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        >
          {getParticleIcon(particleType)}
        </div>
      ))}
      <style jsx>{`
        @keyframes particle-float {
          0%, 100% { 
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 0;
          }
          50% { 
            transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * -100}px) scale(1.2) rotate(180deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export const TypingAnimation: React.FC<{ 
  text: string
  onComplete?: () => void
  config?: Partial<AnimationConfig>
}> = ({ text, onComplete, config }) => {
  const [displayText, setDisplayText] = useState('')
  
  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
        onComplete?.()
      }
    }, config?.duration || 50)
    
    return () => clearInterval(timer)
  }, [text, onComplete, config])
  
  return (
    <span className="inline-block">
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

export const EmotionMorph: React.FC<{
  fromEmotion: EmotionType
  toEmotion: EmotionType
  onComplete?: () => void
}> = ({ fromEmotion, toEmotion, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.()
    }, 1000)
    return () => clearTimeout(timer)
  }, [onComplete])
  
  return (
    <div className={clsx(
      "transition-all duration-1000 ease-in-out",
      "transform scale-105"
    )}>
      {/* Emotion morph animation placeholder */}
      <span className="text-2xl">
        {toEmotion === 'happy' ? '😊' : 
         toEmotion === 'sad' ? '😢' :
         toEmotion === 'excited' ? '🤩' :
         toEmotion === 'calm' ? '😌' : '😐'}
      </span>
    </div>
  )
}

export const TransitionWrapper: React.FC<{
  children: React.ReactNode
  type?: 'fade' | 'slide' | 'scale'
  duration?: number
}> = ({ children, type = 'fade', duration = 300 }) => {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const transitionClasses = {
    fade: 'transition-opacity duration-300',
    slide: 'transition-transform duration-300',
    scale: 'transition-transform duration-300'
  }
  
  return (
    <div 
      className={clsx(
        transitionClasses[type],
        mounted ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-4 scale-95'
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

// Animation system manager with Tailwind CSS integration
export class AnimationSystem {
  private activeAnimations: Map<string, { element: HTMLElement; cleanup: () => void }> = new Map()
  
  public play(id: string, config: AnimationConfig): void {
    this.stop(id) // Clean up existing animation
    
    const element = document.getElementById(id)
    if (!element) return
    
    // Apply animation classes based on config
    const animationClasses = this.getAnimationClasses(config)
    element.classList.add(...animationClasses)
    
    // Set up cleanup
    const cleanup = () => {
      element.classList.remove(...animationClasses)
    }
    
    this.activeAnimations.set(id, { element, cleanup })
    
    // Auto-cleanup after duration if not repeating
    if (!config.repeat) {
      setTimeout(() => {
        this.stop(id)
      }, config.duration)
    }
  }
  
  private getAnimationClasses(config: AnimationConfig): string[] {
    const classes = ['transition-all']
    
    // Duration class
    if (config.duration <= 150) classes.push('duration-150')
    else if (config.duration <= 300) classes.push('duration-300')
    else if (config.duration <= 700) classes.push('duration-700')
    else classes.push('duration-1000')
    
    // Easing class
    if (config.easing.includes('ease-in-out')) classes.push('ease-in-out')
    else if (config.easing.includes('ease-in')) classes.push('ease-in')
    else if (config.easing.includes('ease-out')) classes.push('ease-out')
    else classes.push('ease-linear')
    
    return classes
  }
  
  public stop(id: string): void {
    const animation = this.activeAnimations.get(id)
    if (animation) {
      animation.cleanup()
      this.activeAnimations.delete(id)
    }
  }
  
  public stopAll(): void {
    this.activeAnimations.forEach(({ cleanup }) => cleanup())
    this.activeAnimations.clear()
  }
}

export const useAnimationSystem = () => {
  const systemRef = useRef(new AnimationSystem())
  return systemRef.current
}

export default AnimationSystem