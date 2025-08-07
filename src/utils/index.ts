import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind CSS 클래스 병합 유틸리티
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 로컬 스토리지 안전 래퍼
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  },

  remove: (key: string): void => {
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error)
    }
  },

  clear: (): void => {
    try {
      window.localStorage.clear()
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }
  },
}

// 날짜 포맷팅 유틸리티
export const formatDate = {
  relative: (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}일 전`
    if (hours > 0) return `${hours}시간 전`
    if (minutes > 0) return `${minutes}분 전`
    return '방금 전'
  },

  time: (date: Date): string => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  },

  date: (date: Date): string => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  },
}

// 디바운스 함수
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 스로틀 함수
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// 랜덤 유틸리티
export const random = {
  between: (min: number, max: number): number => {
    return Math.random() * (max - min) + min
  },

  int: (min: number, max: number): number => {
    return Math.floor(random.between(min, max + 1))
  },

  choice: <T>(array: T[]): T => {
    return array[random.int(0, array.length - 1)]
  },

  weighted: <T>(items: Array<{ item: T; weight: number }>): T => {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
    let randomWeight = random.between(0, totalWeight)

    for (const item of items) {
      randomWeight -= item.weight
      if (randomWeight <= 0) return item.item
    }

    return items[0].item
  },
}

// 감정 관련 유틸리티
export const emotion = {
  getColor: (emotionType: string): string => {
    const colors = {
      happy: '#F59E0B',
      excited: '#EF4444',
      calm: '#10B981',
      sad: '#6366F1',
      surprised: '#F59E0B',
      confused: '#6B7280',
      angry: '#EF4444',
      neutral: '#6B7280',
    }
    return colors[emotionType as keyof typeof colors] || colors.neutral
  },

  getIntensity: (value: number): 'low' | 'medium' | 'high' => {
    if (value < 0.3) return 'low'
    if (value < 0.7) return 'medium'
    return 'high'
  },
}

// 애니메이션 유틸리티
export const animation = {
  easeInOut: (t: number): number => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  },

  spring: (t: number): number => {
    return 1 - Math.cos(t * Math.PI * 0.5)
  },

  bounce: (t: number): number => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
    }
  },
}

// AI 응답 처리 유틸리티
export const ai = {
  // 토큰 수 추정 (간략한 계산)
  estimateTokens: (text: string): number => {
    return Math.ceil(text.length / 4)
  },

  // 응답 길이 제한
  truncateResponse: (text: string, maxLength: number = 500): string => {
    if (text.length <= maxLength) return text
    
    const truncated = text.slice(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')
    
    return lastSpace > 0 
      ? truncated.slice(0, lastSpace) + '...'
      : truncated + '...'
  },

  // 감정 분석 (간단한 키워드 기반)
  detectEmotion: (text: string): string => {
    const emotionKeywords = {
      happy: ['기쁘', '행복', '좋아', '웃', '즐거', '신나'],
      sad: ['슬프', '우울', '아픈', '힘들', '외로', '눈물'],
      excited: ['흥미', '놀라', '와우', '대박', '신기'],
      calm: ['평온', '차분', '조용', '편안', '안정'],
      angry: ['화나', '짜증', '분노', '화가', '빡쳐'],
    }

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return emotion
      }
    }

    return 'neutral'
  },
}

// 성능 측정 유틸리티
export const performanceUtils = {
  measure: <T>(name: string, fn: () => T): T => {
    const start = Date.now()
    const result = fn()
    const end = Date.now()
    console.log(`${name}: ${end - start}ms`)
    return result
  },

  measureAsync: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = Date.now()
    const result = await fn()
    const end = Date.now()
    console.log(`${name}: ${end - start}ms`)
    return result
  },
}

// 에러 처리 유틸리티
export const error = {
  format: (error: unknown): string => {
    if (error instanceof Error) {
      return error.message
    }
    if (typeof error === 'string') {
      return error
    }
    return 'Unknown error occurred'
  },

  isNetworkError: (error: unknown): boolean => {
    return error instanceof Error && 
           (error.message.includes('fetch') || 
            error.message.includes('network') ||
            error.message.includes('timeout'))
  },
}

// 게임 관련 유틸리티
export const game = {
  calculateRelationshipLevel: (points: number): number => {
    return Math.min(Math.floor(points / 100) + 1, 10)
  },

  calculateSyncRate: (interactions: number, positiveRatio: number): number => {
    const baseRate = Math.min(interactions * 2, 80)
    const bonusRate = positiveRatio * 20
    return Math.min(baseRate + bonusRate, 100)
  },

  generateMemoryImportance: (
    emotionIntensity: number,
    relationshipLevel: number,
    uniqueness: number
  ): number => {
    return Math.min((emotionIntensity + relationshipLevel/10 + uniqueness) / 3, 1)
  },
}