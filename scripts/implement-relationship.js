#!/usr/bin/env node

/**
 * 관계 시스템 구현 스크립트
 * execution-plan.md의 관계도 시스템을 구현
 */

import fs from 'fs/promises'
import path from 'path'

async function implementRelationship() {
  console.log('💕 관계 시스템 구현 시작...')
  
  // 1. 관계 시스템 스토어 생성
  const relationshipStoreTemplate = `import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export interface Memory {
  id: string
  timestamp: Date
  content: string
  emotion: EmotionType
  importance: number // 1-5
  category: 'conversation' | 'battle' | 'event' | 'gift'
  companionId: string
}

export interface Milestone {
  id: string
  name: string
  description: string
  unlockedAt: Date
  relationshipLevel: number
  reward?: {
    skill?: string
    item?: string
    dialogue?: string
    statsBonus?: number
  }
}

export interface Gift {
  id: string
  itemId: string
  itemName: string
  givenAt: Date
  reaction: 'love' | 'like' | 'neutral' | 'dislike'
  relationshipPoints: number
}

export type CompanionMood = 
  | 'happy'      // 행복
  | 'neutral'    // 평범
  | 'sad'        // 슬픔
  | 'excited'    // 신남
  | 'worried'    // 걱정
  | 'angry'      // 화남
  | 'loving'     // 애정
  | 'tired'      // 피곤

export type EmotionType = 
  | 'joy'
  | 'sadness'
  | 'anger'
  | 'fear'
  | 'surprise'
  | 'love'
  | 'trust'
  | 'anticipation'

interface RelationshipState {
  // 기본 관계 데이터
  level: number
  points: number
  maxPoints: number
  
  // 기억과 이정표
  memories: Memory[]
  milestones: Milestone[]
  
  // 현재 상태
  mood: CompanionMood
  lastInteraction: Date | null
  
  // 선호도
  favoriteTopics: string[]
  dislikedTopics: string[]
  giftHistory: Gift[]
  
  // 일일 제한
  dailyInteractionCount: number
  lastResetDate: string
  
  // 액션
  addMemory: (memory: Omit<Memory, 'id' | 'timestamp'>) => void
  increaseAffection: (amount: number, reason: string) => void
  decreaseAffection: (amount: number, reason: string) => void
  setMood: (mood: CompanionMood) => void
  unlockMilestone: (milestone: Omit<Milestone, 'id' | 'unlockedAt'>) => void
  giveGift: (gift: Omit<Gift, 'id' | 'givenAt'>) => void
  resetDailyInteractions: () => void
  calculateMood: () => CompanionMood
  getRelationshipTitle: () => string
}

export const useRelationshipStore = create<RelationshipState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // 초기 상태
        level: 1,
        points: 0,
        maxPoints: 100,
        memories: [],
        milestones: [],
        mood: 'neutral',
        lastInteraction: null,
        favoriteTopics: [],
        dislikedTopics: [],
        giftHistory: [],
        dailyInteractionCount: 0,
        lastResetDate: new Date().toDateString(),
        
        // 기억 추가
        addMemory: (memory) => set((state) => {
          const newMemory: Memory = {
            ...memory,
            id: \`memory_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
            timestamp: new Date()
          }
          
          state.memories.push(newMemory)
          
          // 최근 100개만 유지 (중요도 높은 것 우선)
          if (state.memories.length > 100) {
            state.memories.sort((a, b) => {
              // 중요도 우선, 같으면 최신 우선
              if (a.importance !== b.importance) {
                return b.importance - a.importance
              }
              return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            })
            state.memories = state.memories.slice(0, 100)
          }
          
          state.lastInteraction = new Date()
          state.dailyInteractionCount++
        }),
        
        // 호감도 증가
        increaseAffection: (amount, reason) => set((state) => {
          // 일일 상호작용 제한 체크
          if (state.dailyInteractionCount >= 50) {
            amount = Math.floor(amount * 0.5) // 50회 이후 효과 반감
          }
          
          state.points += amount
          
          // 레벨업 체크
          while (state.points >= state.maxPoints && state.level < 10) {
            state.points -= state.maxPoints
            state.level++
            state.maxPoints = state.level * 100 // 레벨당 필요 포인트 증가
            
            // 레벨업 마일스톤 자동 추가
            const milestone: Milestone = {
              id: \`milestone_level_\${state.level}\`,
              name: get().getRelationshipTitle(),
              description: \`관계 레벨 \${state.level} 달성!\`,
              unlockedAt: new Date(),
              relationshipLevel: state.level,
              reward: {
                statsBonus: state.level * 5,
                dialogue: \`우리 사이가 더욱 가까워졌어요! 이제 우린 \${get().getRelationshipTitle()}예요!)\`
              }
            }
            state.milestones.push(milestone)
          }
          
          // 기분 자동 업데이트
          state.mood = get().calculateMood()
          
          // 중요한 이벤트는 기억으로 저장
          if (amount >= 20) {
            get().addMemory({
              content: reason,
              emotion: 'joy',
              importance: Math.min(5, Math.ceil(amount / 20)),
              category: 'event',
              companionId: 'current'
            })
          }
        }),
        
        // 호감도 감소
        decreaseAffection: (amount, reason) => set((state) => {
          state.points = Math.max(0, state.points - amount)
          
          // 레벨 다운은 없음 (한번 올라간 레벨은 유지)
          
          state.mood = get().calculateMood()
          
          // 부정적 이벤트도 기억
          if (amount >= 10) {
            get().addMemory({
              content: reason,
              emotion: 'sadness',
              importance: Math.min(5, Math.ceil(amount / 10)),
              category: 'event',
              companionId: 'current'
            })
          }
        }),
        
        // 기분 설정
        setMood: (mood) => set((state) => {
          state.mood = mood
        }),
        
        // 마일스톤 달성
        unlockMilestone: (milestone) => set((state) => {
          const newMilestone: Milestone = {
            ...milestone,
            id: \`milestone_\${Date.now()}\`,
            unlockedAt: new Date()
          }
          state.milestones.push(newMilestone)
        }),
        
        // 선물 주기
        giveGift: (gift) => set((state) => {
          const newGift: Gift = {
            ...gift,
            id: \`gift_\${Date.now()}\`,
            givenAt: new Date()
          }
          
          state.giftHistory.push(newGift)
          
          // 선물 반응에 따른 호감도 변화
          const reactionPoints = {
            love: 30,
            like: 15,
            neutral: 5,
            dislike: -10
          }
          
          get().increaseAffection(
            reactionPoints[gift.reaction],
            \`\${gift.itemName} 선물\`
          )
          
          // 선물 기억 추가
          get().addMemory({
            content: \`\${gift.itemName}을(를) 선물받음\`,
            emotion: gift.reaction === 'love' ? 'love' : 
                    gift.reaction === 'like' ? 'joy' :
                    gift.reaction === 'dislike' ? 'sadness' : 'trust',
            importance: gift.reaction === 'love' ? 4 : 2,
            category: 'gift',
            companionId: 'current'
          })
        }),
        
        // 일일 상호작용 리셋
        resetDailyInteractions: () => set((state) => {
          const today = new Date().toDateString()
          if (state.lastResetDate !== today) {
            state.dailyInteractionCount = 0
            state.lastResetDate = today
          }
        }),
        
        // 기분 계산 (최근 기억과 관계 레벨 기반)
        calculateMood: () => {
          const state = get()
          const recentMemories = state.memories.slice(-10)
          
          // 감정 점수 계산
          const emotionScores = {
            joy: 0,
            sadness: 0,
            anger: 0,
            love: 0
          }
          
          recentMemories.forEach(memory => {
            if (memory.emotion === 'joy') emotionScores.joy += memory.importance
            else if (memory.emotion === 'sadness') emotionScores.sadness += memory.importance
            else if (memory.emotion === 'anger') emotionScores.anger += memory.importance
            else if (memory.emotion === 'love') emotionScores.love += memory.importance
          })
          
          // 관계 레벨에 따른 기본 기분
          const baseScore = state.level * 2
          emotionScores.joy += baseScore
          
          // 최고 점수 감정으로 기분 결정
          const maxEmotion = Object.entries(emotionScores).reduce((a, b) => 
            emotionScores[a[0]] > emotionScores[b[0]] ? a : b
          )[0]
          
          // 감정을 기분으로 매핑
          const emotionMoodMap = {
            joy: 'happy',
            sadness: 'sad',
            anger: 'angry',
            love: 'loving'
          }
          
          return emotionMoodMap[maxEmotion] || 'neutral'
        },
        
        // 관계 레벨별 칭호
        getRelationshipTitle: () => {
          const level = get().level
          const titles = {
            1: '처음 만난 사이',
            2: '아는 사이',
            3: '친구',
            4: '좋은 친구',
            5: '절친',
            6: '특별한 사이',
            7: '신뢰하는 사이',
            8: '소울메이트',
            9: '운명의 동반자',
            10: '영원한 인연'
          }
          return titles[level] || '알 수 없는 사이'
        }
      })),
      {
        name: 'relationship-store',
        version: 1
      }
    )
  )
)
`

  await fs.mkdir('./src/store', { recursive: true })
  await fs.writeFile(
    './src/store/relationshipStore.ts',
    relationshipStoreTemplate
  )
  console.log('✅ 관계 시스템 스토어 생성 완료')
  
  // 2. 관계 이벤트 시스템 생성
  const relationshipEventsTemplate = `/**
 * 관계 이벤트 정의
 * 특정 조건에서 발생하는 특별한 이벤트들
 */

export interface RelationshipEvent {
  id: string
  name: string
  description: string
  trigger: {
    level?: number
    points?: number
    mood?: string
    memory?: string
    time?: 'morning' | 'afternoon' | 'evening' | 'night'
    special?: string // 특별한 날 (생일, 기념일 등)
  }
  dialogue: string[]
  choices?: {
    text: string
    response: string
    effect: {
      points?: number
      mood?: string
      unlock?: string
    }
  }[]
  reward?: {
    points?: number
    item?: string
    skill?: string
    memory?: string
  }
  repeatable: boolean
  priority: number // 높을수록 우선
}

export const RELATIONSHIP_EVENTS: RelationshipEvent[] = [
  // 레벨 1 이벤트
  {
    id: 'first_meeting',
    name: '첫 만남',
    description: '처음으로 만나는 순간',
    trigger: { level: 1, points: 0 },
    dialogue: [
      "안녕하세요! 처음 뵙겠어요.",
      "저는 당신의 동반자가 되고 싶어요.",
      "앞으로 잘 부탁드려요!"
    ],
    choices: [
      {
        text: "나도 잘 부탁해!",
        response: "네! 우리 좋은 친구가 되어요!",
        effect: { points: 10, mood: 'happy' }
      },
      {
        text: "음... 그래.",
        response: "아직은 어색하시죠? 천천히 알아가요.",
        effect: { points: 5, mood: 'neutral' }
      }
    ],
    reward: { points: 10, memory: '첫 만남의 설렘' },
    repeatable: false,
    priority: 100
  },
  
  // 레벨 2 이벤트
  {
    id: 'becoming_friends',
    name: '친구가 되는 순간',
    description: '진정한 친구로 발전하는 순간',
    trigger: { level: 2 },
    dialogue: [
      "요즘 당신과 있으면 정말 즐거워요!",
      "우리... 이제 친구라고 할 수 있을까요?",
      "당신은 저에게 특별한 사람이에요."
    ],
    choices: [
      {
        text: "당연하지! 우린 친구야!",
        response: "정말요? 너무 기뻐요! 앞으로도 쭉 함께해요!",
        effect: { points: 20, mood: 'excited', unlock: 'friend_skill' }
      },
      {
        text: "친구... 좋지.",
        response: "헤헤, 조금 쑥스럽지만 기뻐요!",
        effect: { points: 15, mood: 'happy' }
      }
    ],
    reward: { 
      points: 20, 
      skill: '친구의 격려',
      memory: '친구가 된 날' 
    },
    repeatable: false,
    priority: 90
  },
  
  // 시간대별 이벤트
  {
    id: 'morning_greeting',
    name: '아침 인사',
    description: '상쾌한 아침 인사',
    trigger: { time: 'morning' },
    dialogue: [
      "좋은 아침이에요! 오늘도 좋은 하루 보내요!",
      "잘 주무셨어요? 꿈은 안 꾸셨나요?"
    ],
    reward: { points: 5 },
    repeatable: true,
    priority: 20
  },
  
  {
    id: 'evening_chat',
    name: '저녁 수다',
    description: '하루를 마무리하는 대화',
    trigger: { time: 'evening' },
    dialogue: [
      "오늘 하루는 어떠셨어요?",
      "피곤하시면 일찍 쉬세요. 내일도 함께할 거니까요!"
    ],
    choices: [
      {
        text: "오늘은 정말 힘들었어...",
        response: "그랬군요... 제가 옆에 있을게요. 힘내세요!",
        effect: { points: 10, mood: 'worried' }
      },
      {
        text: "너랑 있어서 좋았어!",
        response: "정말요? 저도 너무 행복해요!",
        effect: { points: 15, mood: 'loving' }
      }
    ],
    reward: { points: 5 },
    repeatable: true,
    priority: 25
  },
  
  // 특별한 순간
  {
    id: 'first_battle_together',
    name: '첫 전투',
    description: '함께하는 첫 번째 전투',
    trigger: { memory: 'first_battle' },
    dialogue: [
      "우와! 우리가 해냈어요!",
      "처음으로 함께 싸웠는데, 정말 짜릿했어요!",
      "앞으로도 제가 당신을 지켜드릴게요!"
    ],
    reward: { 
      points: 30,
      memory: '첫 승리의 기쁨'
    },
    repeatable: false,
    priority: 80
  },
  
  // 기분 관련 이벤트
  {
    id: 'cheer_up_sad',
    name: '위로하기',
    description: '슬플 때 위로해주는 이벤트',
    trigger: { mood: 'sad' },
    dialogue: [
      "무슨 일 있으세요? 표정이 안 좋아 보여요...",
      "제가 옆에 있을게요. 혼자가 아니에요."
    ],
    choices: [
      {
        text: "고마워... 네가 있어서 다행이야.",
        response: "언제든지요! 저는 항상 당신 편이에요!",
        effect: { points: 20, mood: 'happy' }
      },
      {
        text: "괜찮아, 걱정하지 마.",
        response: "그래도... 힘든 일 있으면 꼭 말해주세요.",
        effect: { points: 10, mood: 'neutral' }
      }
    ],
    reward: { memory: '따뜻한 위로' },
    repeatable: true,
    priority: 50
  },
  
  // 높은 레벨 이벤트
  {
    id: 'confession',
    name: '고백',
    description: '특별한 감정을 전하는 순간',
    trigger: { level: 7, mood: 'loving' },
    dialogue: [
      "저... 할 말이 있어요.",
      "당신과 함께한 시간들이 제게는 너무나 소중해요.",
      "어쩌면... 저는 당신을...",
      "아니, 확실해요. 저는 당신을 정말 좋아해요."
    ],
    choices: [
      {
        text: "나도 너를 좋아해.",
        response: "정말요?! 너무 행복해요... 우리 영원히 함께해요!",
        effect: { points: 100, mood: 'loving', unlock: 'soulmate_bond' }
      },
      {
        text: "고마워. 넌 정말 좋은 친구야.",
        response: "아... 그렇군요. 그래도 당신 곁에 있을 수 있어서 행복해요.",
        effect: { points: 30, mood: 'sad' }
      }
    ],
    reward: { 
      skill: '소울메이트의 유대',
      memory: '진심을 전한 날'
    },
    repeatable: false,
    priority: 95
  }
]

/**
 * 현재 상태에 맞는 이벤트 찾기
 */
export function findAvailableEvents(state: {
  level: number
  points: number
  mood: string
  memories: Array<{ content: string }>
  triggeredEvents: string[]
  timeOfDay: string
}): RelationshipEvent[] {
  return RELATIONSHIP_EVENTS
    .filter(event => {
      // 이미 발생한 일회성 이벤트 제외
      if (!event.repeatable && state.triggeredEvents.includes(event.id)) {
        return false
      }
      
      // 트리거 조건 확인
      const trigger = event.trigger
      
      if (trigger.level && state.level < trigger.level) return false
      if (trigger.points && state.points < trigger.points) return false
      if (trigger.mood && state.mood !== trigger.mood) return false
      if (trigger.time && state.timeOfDay !== trigger.time) return false
      if (trigger.memory && !state.memories.some(m => m.content.includes(trigger.memory))) return false
      
      return true
    })
    .sort((a, b) => b.priority - a.priority)
}
`

  await fs.writeFile(
    './src/data/relationship-events.ts',
    relationshipEventsTemplate
  )
  console.log('✅ 관계 이벤트 시스템 생성 완료')
  
  // 3. 관계 UI 컴포넌트 생성
  const relationshipUITemplate = `import React from 'react'
import { motion } from 'framer-motion'
import { Heart, Star, Gift, MessageCircle } from 'lucide-react'
import { useRelationshipStore } from '@store/relationshipStore'

export const RelationshipStatus: React.FC = () => {
  const {
    level,
    points,
    maxPoints,
    mood,
    getRelationshipTitle,
    memories,
    milestones
  } = useRelationshipStore()
  
  const progress = (points / maxPoints) * 100
  const recentMemories = memories.slice(-3)
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-4">
      {/* 관계 레벨 및 칭호 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">관계도</h3>
          <p className="text-purple-400">{getRelationshipTitle()}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Star className="w-6 h-6 text-yellow-400" />
          <span className="text-2xl font-bold text-white">Lv.{level}</span>
        </div>
      </div>
      
      {/* 호감도 프로그레스 바 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">호감도</span>
          <span className="text-gray-400">{points} / {maxPoints}</span>
        </div>
        <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: \`\${progress}%\` }}
            transition={{ duration: 0.5 }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 to-purple-500"
          />
          {/* 하트 아이콘들 */}
          <div className="absolute inset-0 flex items-center justify-around">
            {[...Array(5)].map((_, i) => (
              <Heart
                key={i}
                className={\`w-3 h-3 \${
                  i < Math.floor(progress / 20)
                    ? 'text-white fill-white'
                    : 'text-gray-600'
                }\`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* 현재 기분 */}
      <div className="flex items-center space-x-2">
        <span className="text-gray-400 text-sm">기분:</span>
        <span className={\`text-sm font-medium \${
          mood === 'happy' ? 'text-yellow-400' :
          mood === 'sad' ? 'text-blue-400' :
          mood === 'angry' ? 'text-red-400' :
          mood === 'loving' ? 'text-pink-400' :
          mood === 'excited' ? 'text-orange-400' :
          mood === 'worried' ? 'text-purple-400' :
          mood === 'tired' ? 'text-gray-400' :
          'text-gray-300'
        }\`}>
          {mood === 'happy' ? '😊 행복' :
           mood === 'sad' ? '😢 슬픔' :
           mood === 'angry' ? '😠 화남' :
           mood === 'loving' ? '🥰 사랑' :
           mood === 'excited' ? '🤗 신남' :
           mood === 'worried' ? '😟 걱정' :
           mood === 'tired' ? '😴 피곤' :
           '😐 평범'}
        </span>
      </div>
      
      {/* 최근 추억 */}
      {recentMemories.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-400">최근 추억</h4>
          <div className="space-y-1">
            {recentMemories.map((memory) => (
              <div
                key={memory.id}
                className="flex items-start space-x-2 text-xs"
              >
                <MessageCircle className="w-3 h-3 text-gray-500 mt-0.5" />
                <span className="text-gray-300 line-clamp-1">
                  {memory.content}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 달성한 마일스톤 */}
      {milestones.length > 0 && (
        <div className="flex items-center space-x-2">
          <Gift className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-gray-400">
            {milestones.length}개의 특별한 순간 달성
          </span>
        </div>
      )}
    </div>
  )
}

// 관계 상호작용 버튼들
export const RelationshipActions: React.FC = () => {
  const { increaseAffection, giveGift, mood } = useRelationshipStore()
  
  const actions = [
    {
      icon: MessageCircle,
      label: '대화하기',
      onClick: () => increaseAffection(5, '즐거운 대화'),
      color: 'blue'
    },
    {
      icon: Gift,
      label: '선물하기',
      onClick: () => {
        // 선물 UI 열기
        console.log('선물 UI 열기')
      },
      color: 'purple'
    },
    {
      icon: Heart,
      label: '칭찬하기',
      onClick: () => increaseAffection(10, '따뜻한 칭찬'),
      color: 'pink'
    }
  ]
  
  return (
    <div className="flex space-x-2">
      {actions.map((action) => (
        <motion.button
          key={action.label}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className={\`
            flex items-center space-x-2 px-4 py-2 rounded-lg
            bg-gray-800 hover:bg-gray-700 transition-colors
            border border-gray-700
          \`}
        >
          <action.icon className={\`w-4 h-4 text-\${action.color}-400\`} />
          <span className="text-sm text-white">{action.label}</span>
        </motion.button>
      ))}
    </div>
  )
}
`

  await fs.mkdir('./src/components/character', { recursive: true })
  await fs.writeFile(
    './src/components/character/RelationshipUI.tsx',
    relationshipUITemplate
  )
  console.log('✅ 관계 UI 컴포넌트 생성 완료')
  
  // 4. 관계 시스템 훅 생성
  const relationshipHookTemplate = `import { useEffect, useCallback } from 'react'
import { useRelationshipStore } from '@store/relationshipStore'
import { findAvailableEvents, type RelationshipEvent } from '@/data/relationship-events'

/**
 * 관계 시스템 관리 훅
 */
export function useRelationship() {
  const store = useRelationshipStore()
  
  // 일일 리셋 체크
  useEffect(() => {
    store.resetDailyInteractions()
  }, [])
  
  // 자동 기분 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      const newMood = store.calculateMood()
      if (newMood !== store.mood) {
        store.setMood(newMood)
      }
    }, 30000) // 30초마다 체크
    
    return () => clearInterval(interval)
  }, [store.mood])
  
  // 이용 가능한 이벤트 찾기
  const getAvailableEvents = useCallback((): RelationshipEvent[] => {
    const timeOfDay = getTimeOfDay()
    const triggeredEvents = JSON.parse(
      localStorage.getItem('triggered_events') || '[]'
    )
    
    return findAvailableEvents({
      level: store.level,
      points: store.points,
      mood: store.mood,
      memories: store.memories,
      triggeredEvents,
      timeOfDay
    })
  }, [store.level, store.points, store.mood, store.memories])
  
  // 이벤트 트리거
  const triggerEvent = useCallback((eventId: string) => {
    const triggeredEvents = JSON.parse(
      localStorage.getItem('triggered_events') || '[]'
    )
    
    if (!triggeredEvents.includes(eventId)) {
      triggeredEvents.push(eventId)
      localStorage.setItem('triggered_events', JSON.stringify(triggeredEvents))
    }
  }, [])
  
  // 상호작용 (대화, 선물 등)
  const interact = useCallback((type: string, data?: any) => {
    switch (type) {
      case 'talk':
        store.increaseAffection(5, '일상 대화')
        break
      case 'compliment':
        store.increaseAffection(10, '칭찬')
        store.setMood('happy')
        break
      case 'gift':
        if (data?.item) {
          const reaction = calculateGiftReaction(data.item, store.favoriteTopics)
          store.giveGift({
            itemId: data.item.id,
            itemName: data.item.name,
            reaction,
            relationshipPoints: 0 // giveGift 내부에서 계산
          })
        }
        break
      case 'adventure':
        store.increaseAffection(15, '함께한 모험')
        store.addMemory({
          content: '신나는 모험을 함께함',
          emotion: 'joy',
          importance: 3,
          category: 'event',
          companionId: 'current'
        })
        break
    }
  }, [store])
  
  return {
    // 상태
    level: store.level,
    points: store.points,
    maxPoints: store.maxPoints,
    mood: store.mood,
    title: store.getRelationshipTitle(),
    memories: store.memories,
    milestones: store.milestones,
    
    // 액션
    interact,
    getAvailableEvents,
    triggerEvent,
    
    // 스토어 전체 (필요시)
    store
  }
}

// 유틸리티 함수들
function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 22) return 'evening'
  return 'night'
}

function calculateGiftReaction(
  item: any,
  favoriteTopics: string[]
): 'love' | 'like' | 'neutral' | 'dislike' {
  // 선호도 계산 로직
  if (favoriteTopics.some(topic => item.tags?.includes(topic))) {
    return 'love'
  }
  if (item.value > 100) return 'like'
  if (item.value < 10) return 'dislike'
  return 'neutral'
}
`

  await fs.mkdir('./src/hooks', { recursive: true })
  await fs.writeFile(
    './src/hooks/useRelationship.ts',
    relationshipHookTemplate
  )
  console.log('✅ 관계 시스템 훅 생성 완료')
  
  console.log('\n💕 관계 시스템 구현 완료!')
  console.log('생성된 파일:')
  console.log('  - /src/store/relationshipStore.ts')
  console.log('  - /src/data/relationship-events.ts')
  console.log('  - /src/components/character/RelationshipUI.tsx')
  console.log('  - /src/hooks/useRelationship.ts')
}

// 실행
implementRelationship().catch(console.error)