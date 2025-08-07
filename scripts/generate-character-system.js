#!/usr/bin/env node

/**
 * AI 캐릭터 시스템 자동 생성 스크립트
 * execution-plan.md의 캐릭터 구조를 기반으로 구현
 */

import fs from 'fs/promises'
import path from 'path'
import { getAIManager } from '../src/services/ai/AIManager.js'

async function generateCharacterSystem() {
  console.log('🧠 AI 캐릭터 성격 시스템 생성 시작...')
  
  const aiManager = getAIManager()
  
  // 1. AI 캐릭터 성격 매트릭스 생성
  const personalitiesPrompt = `
Generate 10 unique AI companion personalities for a Korean fantasy RPG game "소울메이트".
Each personality should follow this exact structure from the game design:

{
  "id": "companion_XXX",
  "name": "Korean name",
  "personality": {
    "cheerful": 0.0-1.0,    // 밝음
    "careful": 0.0-1.0,      // 신중함
    "curious": 0.0-1.0,      // 호기심
    "emotional": 0.0-1.0,    // 감정적
    "independent": 0.0-1.0,  // 독립적
    "caring": 0.0-1.0,       // 배려심
    "playful": 0.0-1.0       // 장난기
  },
  "dialogueStyle": "description of speech pattern in Korean",
  "specialAbilities": ["ability1", "ability2"],
  "favoriteTopics": ["topic1", "topic2", "topic3"],
  "initialGreeting": "Korean greeting based on personality"
}

Important: 
- Names should be Korean (like 루나, 아리아, 유나, etc.)
- Personality values should create distinct character types
- Include variety (shy, bold, mysterious, cheerful types)
- Make them appealing as AI companions

Return as valid JSON array.`

  try {
    const response = await aiManager.generateResponse({
      messages: [{
        role: 'system',
        content: personalitiesPrompt
      }],
      provider: 'claude'
    })
    
    // 파싱 및 저장
    const personalities = JSON.parse(response.text)
    await fs.mkdir('./src/data', { recursive: true })
    await fs.writeFile(
      './src/data/ai-personalities.json',
      JSON.stringify(personalities, null, 2)
    )
    console.log('✅ AI 성격 데이터 생성 완료')
    
    // 2. 캐릭터 타입 정의 생성
    const characterTypesTemplate = `/**
 * AI 캐릭터 시스템 타입 정의
 * execution-plan.md 기반 구조
 */

export interface CompanionPersonality {
  cheerful: number      // 밝음 (0-1)
  careful: number       // 신중함 (0-1)
  curious: number       // 호기심 (0-1)
  emotional: number     // 감정적 (0-1)
  independent: number   // 독립적 (0-1)
  caring: number        // 배려심 (0-1)
  playful: number       // 장난기 (0-1)
}

export interface CompanionStats {
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  atk: number
  def: number
  speed: number
  critRate: number
  critDamage: number
}

export interface RelationshipData {
  level: number         // 1-10
  points: number        // 경험치
  memories: Memory[]    // 공유한 기억들
  mood: CompanionMood   // 현재 기분
  milestones: Milestone[] // 달성한 관계 이정표
}

export interface Memory {
  id: string
  timestamp: Date
  content: string
  emotion: EmotionType
  importance: number    // 1-5
  category: 'conversation' | 'battle' | 'event' | 'gift'
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
  }
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

export interface AICompanion {
  id: string
  name: string
  personality: CompanionPersonality
  relationship: RelationshipData
  stats: CompanionStats
  dialogueStyle: string
  specialAbilities: string[]
  favoriteTopics: string[]
  appearance: {
    avatar: string
    expressions: Record<CompanionMood, string>
  }
  voice?: {
    pitch: number
    speed: number
    tone: string
  }
}

// 관계 레벨별 특전
export const RELATIONSHIP_BENEFITS = {
  1: { title: '첫 만남', statsBonus: 0 },
  2: { title: '친구', statsBonus: 5 },
  3: { title: '좋은 친구', statsBonus: 10 },
  4: { title: '절친', statsBonus: 15 },
  5: { title: '신뢰하는 사이', statsBonus: 20 },
  6: { title: '특별한 사이', statsBonus: 25 },
  7: { title: '깊은 유대', statsBonus: 30 },
  8: { title: '소울메이트', statsBonus: 40 },
  9: { title: '운명의 동반자', statsBonus: 50 },
  10: { title: '영원한 인연', statsBonus: 60 }
}

// 기분에 따른 대화 톤 조정
export const MOOD_DIALOGUE_MODIFIERS = {
  happy: { 
    exclamation: 1.5,     // 느낌표 사용 증가
    emoji: 2.0,           // 이모티콘 사용 증가
    lengthModifier: 1.2   // 대화 길이 증가
  },
  sad: {
    exclamation: 0.5,
    emoji: 0.3,
    lengthModifier: 0.8
  },
  excited: {
    exclamation: 2.0,
    emoji: 1.5,
    lengthModifier: 1.3
  },
  worried: {
    exclamation: 0.7,
    emoji: 0.5,
    lengthModifier: 1.1
  },
  angry: {
    exclamation: 1.8,
    emoji: 0.2,
    lengthModifier: 0.9
  },
  loving: {
    exclamation: 1.2,
    emoji: 3.0,
    lengthModifier: 1.4
  },
  tired: {
    exclamation: 0.3,
    emoji: 0.4,
    lengthModifier: 0.7
  },
  neutral: {
    exclamation: 1.0,
    emoji: 1.0,
    lengthModifier: 1.0
  }
}
`

    await fs.writeFile(
      './src/services/character/types.ts',
      characterTypesTemplate
    )
    console.log('✅ 캐릭터 타입 정의 생성 완료')
    
    // 3. 캐릭터 매니저 클래스 생성
    const characterManagerTemplate = `import { EventEmitter } from 'events'
import type { 
  AICompanion, 
  CompanionMood, 
  Memory, 
  Milestone,
  RELATIONSHIP_BENEFITS,
  MOOD_DIALOGUE_MODIFIERS 
} from './types'
import { getAIManager } from '../ai/AIManager'
import personalitiesData from '../../data/ai-personalities.json'

/**
 * AI 캐릭터 관리 시스템
 * 성격, 관계, 기분 등을 종합적으로 관리
 */
export class CharacterManager extends EventEmitter {
  private companions: Map<string, AICompanion> = new Map()
  private activeCompanionId: string | null = null
  private aiManager = getAIManager()
  
  constructor() {
    super()
    this.loadCompanions()
  }
  
  /**
   * AI 캐릭터들 초기화
   */
  private async loadCompanions() {
    for (const data of personalitiesData) {
      const companion: AICompanion = {
        ...data,
        relationship: {
          level: 1,
          points: 0,
          memories: [],
          mood: 'neutral',
          milestones: []
        },
        stats: this.generateInitialStats(data.personality),
        appearance: {
          avatar: \`/assets/characters/\${data.id}.png\`,
          expressions: this.generateExpressions(data.id)
        }
      }
      
      this.companions.set(companion.id, companion)
    }
    
    console.log(\`✅ \${this.companions.size}명의 AI 캐릭터 로드 완료\`)
  }
  
  /**
   * 성격 기반 초기 스탯 생성
   */
  private generateInitialStats(personality: any) {
    return {
      hp: 100 + Math.floor(personality.careful * 20),
      maxHp: 100 + Math.floor(personality.careful * 20),
      mp: 50 + Math.floor(personality.emotional * 30),
      maxMp: 50 + Math.floor(personality.emotional * 30),
      atk: 10 + Math.floor(personality.independent * 5),
      def: 8 + Math.floor(personality.careful * 7),
      speed: 10 + Math.floor(personality.playful * 5),
      critRate: 5 + Math.floor(personality.curious * 10),
      critDamage: 150 + Math.floor(personality.independent * 20)
    }
  }
  
  /**
   * 표정 이미지 경로 생성
   */
  private generateExpressions(companionId: string) {
    const moods: CompanionMood[] = ['happy', 'neutral', 'sad', 'excited', 'worried', 'angry', 'loving', 'tired']
    const expressions: Record<string, string> = {}
    
    for (const mood of moods) {
      expressions[mood] = \`/assets/characters/\${companionId}_\${mood}.png\`
    }
    
    return expressions
  }
  
  /**
   * 현재 활성화된 캐릭터 가져오기
   */
  getActiveCompanion(): AICompanion | null {
    if (!this.activeCompanionId) return null
    return this.companions.get(this.activeCompanionId) || null
  }
  
  /**
   * 캐릭터 선택/변경
   */
  setActiveCompanion(companionId: string) {
    if (!this.companions.has(companionId)) {
      throw new Error(\`캐릭터를 찾을 수 없습니다: \${companionId}\`)
    }
    
    this.activeCompanionId = companionId
    this.emit('companion-changed', this.getActiveCompanion())
  }
  
  /**
   * 관계도 증가
   */
  increaseRelationship(points: number, reason: string) {
    const companion = this.getActiveCompanion()
    if (!companion) return
    
    companion.relationship.points += points
    
    // 레벨업 체크
    const newLevel = Math.floor(companion.relationship.points / 100) + 1
    if (newLevel > companion.relationship.level && newLevel <= 10) {
      companion.relationship.level = newLevel
      this.unlockMilestone(companion, newLevel)
      this.emit('level-up', { companion, newLevel })
    }
    
    // 기억 추가
    this.addMemory(companion, {
      content: reason,
      emotion: 'joy',
      importance: Math.min(5, Math.ceil(points / 20))
    })
  }
  
  /**
   * 기분 변경
   */
  setMood(mood: CompanionMood, reason?: string) {
    const companion = this.getActiveCompanion()
    if (!companion) return
    
    const oldMood = companion.relationship.mood
    companion.relationship.mood = mood
    
    this.emit('mood-changed', { companion, oldMood, newMood: mood, reason })
    
    if (reason) {
      this.addMemory(companion, {
        content: reason,
        emotion: this.moodToEmotion(mood),
        importance: 3
      })
    }
  }
  
  /**
   * 기억 추가
   */
  private addMemory(companion: AICompanion, memory: Partial<Memory>) {
    const newMemory: Memory = {
      id: \`memory_\${Date.now()}\`,
      timestamp: new Date(),
      category: 'conversation',
      ...memory
    } as Memory
    
    companion.relationship.memories.push(newMemory)
    
    // 최근 50개만 유지
    if (companion.relationship.memories.length > 50) {
      companion.relationship.memories = companion.relationship.memories.slice(-50)
    }
  }
  
  /**
   * 관계 마일스톤 달성
   */
  private unlockMilestone(companion: AICompanion, level: number) {
    const milestone: Milestone = {
      id: \`milestone_level_\${level}\`,
      name: RELATIONSHIP_BENEFITS[level].title,
      description: \`관계 레벨 \${level} 달성!\`,
      unlockedAt: new Date(),
      relationshipLevel: level,
      reward: {
        dialogue: \`우리 사이가 더 가까워진 것 같아요! (\${RELATIONSHIP_BENEFITS[level].title})\`
      }
    }
    
    companion.relationship.milestones.push(milestone)
  }
  
  /**
   * 기분을 감정으로 변환
   */
  private moodToEmotion(mood: CompanionMood): EmotionType {
    const moodEmotionMap = {
      happy: 'joy',
      sad: 'sadness',
      angry: 'anger',
      worried: 'fear',
      excited: 'anticipation',
      loving: 'love',
      tired: 'sadness',
      neutral: 'trust'
    }
    
    return moodEmotionMap[mood] as EmotionType
  }
  
  /**
   * 대화 생성 (성격과 기분 반영)
   */
  async generateDialogue(userInput: string, context?: any) {
    const companion = this.getActiveCompanion()
    if (!companion) throw new Error('활성화된 캐릭터가 없습니다')
    
    const moodModifier = MOOD_DIALOGUE_MODIFIERS[companion.relationship.mood]
    
    const enhancedContext = {
      ...context,
      companionName: companion.name,
      companionPersonality: companion.personality,
      relationshipLevel: companion.relationship.level,
      companionMood: companion.relationship.mood,
      recentMemories: companion.relationship.memories.slice(-5),
      dialogueStyle: companion.dialogueStyle,
      moodModifier
    }
    
    const response = await this.aiManager.generateResponse({
      messages: [{
        role: 'system',
        content: this.buildCharacterPrompt(enhancedContext)
      }, {
        role: 'user',
        content: userInput
      }],
      provider: 'claude'
    })
    
    return response.text
  }
  
  /**
   * 캐릭터별 프롬프트 생성
   */
  private buildCharacterPrompt(context: any): string {
    return \`You are an AI companion named "\${context.companionName}" in a Korean fantasy RPG.

Character Profile:
- Personality Traits: \${Object.entries(context.companionPersonality)
  .map(([trait, value]) => \`\${trait}: \${Math.round(value * 100)}%\`)
  .join(', ')}
- Dialogue Style: \${context.dialogueStyle}
- Relationship Level: \${context.relationshipLevel}/10 (\${RELATIONSHIP_BENEFITS[context.relationshipLevel].title})
- Current Mood: \${context.companionMood}

Mood Effects:
- Use exclamation marks: \${context.moodModifier.exclamation}x normal
- Use emoticons: \${context.moodModifier.emoji}x normal  
- Response length: \${context.moodModifier.lengthModifier}x normal

Recent Memories:
\${context.recentMemories.map(m => \`- \${m.content} (feeling: \${m.emotion})\`).join('\\n')}

Instructions:
1. Always respond in Korean (한국어)
2. Reflect your personality traits strongly
3. Show your current mood through tone and word choice
4. Reference recent memories when relevant
5. Use appropriate honorifics based on relationship level
6. Keep responses between 50-150 Korean characters (adjusted by mood)
7. Be consistent with your character's established personality

Respond naturally as \${context.companionName} would.\`
  }
  
  /**
   * 모든 캐릭터 목록 가져오기
   */
  getAllCompanions(): AICompanion[] {
    return Array.from(this.companions.values())
  }
  
  /**
   * 캐릭터 저장
   */
  async saveCompanion(companionId: string) {
    const companion = this.companions.get(companionId)
    if (!companion) return
    
    const saveData = {
      id: companion.id,
      relationship: companion.relationship,
      stats: companion.stats
    }
    
    localStorage.setItem(\`companion_\${companionId}\`, JSON.stringify(saveData))
  }
  
  /**
   * 캐릭터 불러오기
   */
  async loadCompanion(companionId: string) {
    const savedData = localStorage.getItem(\`companion_\${companionId}\`)
    if (!savedData) return
    
    const data = JSON.parse(savedData)
    const companion = this.companions.get(companionId)
    
    if (companion) {
      companion.relationship = data.relationship
      companion.stats = data.stats
    }
  }
}

// 싱글톤 인스턴스
let characterManager: CharacterManager | null = null

export function getCharacterManager(): CharacterManager {
  if (!characterManager) {
    characterManager = new CharacterManager()
  }
  return characterManager
}
`

    await fs.mkdir('./src/services/character', { recursive: true })
    await fs.writeFile(
      './src/services/character/CharacterManager.ts',
      characterManagerTemplate
    )
    console.log('✅ 캐릭터 매니저 생성 완료')
    
    // 4. 캐릭터 선택 컴포넌트 생성
    const characterSelectTemplate = `import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCharacterManager } from '@services/character/CharacterManager'
import type { AICompanion } from '@services/character/types'

interface CharacterSelectProps {
  onSelect: (companion: AICompanion) => void
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({ onSelect }) => {
  const [companions, setCompanions] = useState<AICompanion[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const characterManager = getCharacterManager()
  
  useEffect(() => {
    setCompanions(characterManager.getAllCompanions())
  }, [])
  
  const handleSelect = (companion: AICompanion) => {
    setSelectedId(companion.id)
    characterManager.setActiveCompanion(companion.id)
    onSelect(companion)
  }
  
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-white text-center mb-12">
          AI 동반자를 선택하세요
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {companions.map((companion, index) => (
              <motion.div
                key={companion.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className={\`
                  relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer
                  border-2 transition-colors
                  \${selectedId === companion.id 
                    ? 'border-purple-500' 
                    : 'border-gray-700 hover:border-gray-600'}
                \`}
                onClick={() => handleSelect(companion)}
              >
                {/* 캐릭터 이미지 */}
                <div className="h-48 bg-gradient-to-b from-purple-900/20 to-transparent">
                  <img 
                    src={companion.appearance.avatar} 
                    alt={companion.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/assets/placeholder-character.png'
                    }}
                  />
                </div>
                
                {/* 캐릭터 정보 */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {companion.name}
                  </h3>
                  
                  <p className="text-gray-400 text-sm mb-4">
                    {companion.dialogueStyle}
                  </p>
                  
                  {/* 성격 특성 */}
                  <div className="space-y-2">
                    {Object.entries(companion.personality).slice(0, 3).map(([trait, value]) => (
                      <div key={trait} className="flex items-center">
                        <span className="text-xs text-gray-500 w-16">
                          {trait === 'cheerful' ? '밝음' :
                           trait === 'careful' ? '신중함' :
                           trait === 'curious' ? '호기심' :
                           trait === 'emotional' ? '감정적' :
                           trait === 'independent' ? '독립적' :
                           trait === 'caring' ? '배려심' :
                           trait === 'playful' ? '장난기' : trait}
                        </span>
                        <div className="flex-1 bg-gray-700 rounded-full h-2 ml-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: \`\${value * 100}%\` }}
                            transition={{ delay: index * 0.1 + 0.3 }}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* 특수 능력 */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {companion.specialAbilities.slice(0, 2).map((ability) => (
                      <span 
                        key={ability}
                        className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded"
                      >
                        {ability}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* 선택 표시 */}
                {selectedId === companion.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-purple-500/20 flex items-center justify-center"
                  >
                    <div className="bg-purple-500 text-white px-4 py-2 rounded-full">
                      선택됨
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {/* 선택 완료 버튼 */}
        {selectedId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <button className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
              게임 시작하기
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default CharacterSelect
`

    await fs.writeFile(
      './src/components/character/CharacterSelect.tsx',
      characterSelectTemplate
    )
    console.log('✅ 캐릭터 선택 컴포넌트 생성 완료')
    
    console.log('\n🎉 AI 캐릭터 시스템 생성 완료!')
    console.log('생성된 파일:')
    console.log('  - /src/data/ai-personalities.json')
    console.log('  - /src/services/character/types.ts')
    console.log('  - /src/services/character/CharacterManager.ts')
    console.log('  - /src/components/character/CharacterSelect.tsx')
    
  } catch (error) {
    console.error('❌ AI 캐릭터 시스템 생성 중 오류:', error)
    process.exit(1)
  }
}

// 실행
generateCharacterSystem()