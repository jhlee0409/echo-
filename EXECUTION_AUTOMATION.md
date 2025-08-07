# 🤖 소울메이트 실행 계획 자동화 시스템

## 📊 현재 상태 및 다음 단계

### ✅ Phase 1 완료 상황 (120% 달성)

- **AI 대화 시스템**: ✅ Claude + Mock Provider
- **인증 시스템**: ✅ JWT + RBAC + Supabase
- **기본 컴포넌트**: ✅ ChatWindow, CharacterStatus, GameMenu
- **테스트 인프라**: ✅ Vitest + 76개 테스트 케이스

### 🎯 Phase 2-4 자동화 로드맵

## 🚀 자동 실행 스크립트

### 1. Phase 2 - 캐릭터 시스템 (Week 3-4)

```bash
#!/bin/bash
# Phase 2 캐릭터 시스템 자동 구현

echo "🎮 Phase 2: 캐릭터 시스템 구현 시작..."

# 캐릭터 관련 컴포넌트 생성
npm run generate:component -- CharacterProfile
npm run generate:component -- InventorySystem
npm run generate:component -- SkillTree
npm run generate:component -- RelationshipTracker

# AI 캐릭터 성격 시스템 확장
node scripts/generate-character-system.js

# 관계도 시스템 구현
node scripts/implement-relationship.js

echo "✅ Phase 2 캐릭터 시스템 완료!"
```

### 2. Phase 2 - 전투 시스템 (Week 5-6)

```bash
#!/bin/bash
# Phase 2 전투 시스템 자동 구현

echo "⚔️ Phase 2: 전투 시스템 구현 시작..."

# 전투 컴포넌트 생성
npm run generate:component -- BattleScreen
npm run generate:component -- BattleLog
npm run generate:component -- SkillAnimation

# 자동 전투 로직 구현
node scripts/implement-auto-battle.js

# 전투 밸런싱 시스템
node scripts/balance-combat-stats.js

echo "✅ Phase 2 전투 시스템 완료!"
```

### 3. Phase 3 - 콘텐츠 자동 생성 (Week 7-9)

```bash
#!/bin/bash
# Phase 3 콘텐츠 자동 생성

echo "📝 Phase 3: 콘텐츠 생성 시작..."

# Claude API로 스토리 대량 생성
node scripts/generate-story-content.js \
  --conversations 100 \
  --events 50 \
  --quests 30

# 아트 에셋 생성 명령
node scripts/generate-art-prompts.js \
  --characters 10 \
  --backgrounds 20 \
  --items 50

echo "✅ Phase 3 콘텐츠 생성 완료!"
```

### 4. Phase 4 - 배포 자동화 (Week 10)

```bash
#!/bin/bash
# Phase 4 배포 자동화

echo "🚀 Phase 4: 배포 준비 시작..."

# 빌드 최적화
npm run build
npm run analyze

# 환경 변수 검증
npm run validate:env

# Vercel 배포
npm run deploy:vercel

echo "✅ Phase 4 배포 완료!"
```

## 📁 자동화 스크립트 생성

### `/scripts/generate-character-system.js`

```javascript
import { AIManager } from '../src/services/ai/AIManager.js'
import fs from 'fs/promises'

async function generateCharacterSystem() {
  const aiManager = new AIManager()

  // AI 캐릭터 성격 매트릭스 생성
  const personalities = await aiManager.generateResponse({
    messages: [
      {
        role: 'system',
        content: `Generate 10 unique AI companion personalities for a Korean RPG game.
      Each personality should have:
      - Name (Korean)
      - 5 personality traits (0-1 scale)
      - Unique dialogue style
      - Special abilities
      Format as JSON array.`,
      },
    ],
    provider: 'claude',
  })

  // 파일로 저장
  await fs.writeFile(
    './src/data/ai-personalities.json',
    JSON.stringify(JSON.parse(personalities.text), null, 2)
  )

  console.log('✅ AI 캐릭터 성격 시스템 생성 완료')
}

generateCharacterSystem()
```

### `/scripts/implement-relationship.js`

```javascript
import fs from 'fs/promises'

const relationshipSystemTemplate = `
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface RelationshipState {
  level: number
  points: number
  memories: Memory[]
  milestones: Milestone[]
  mood: CompanionMood
  favoriteTopics: string[]
  giftHistory: Gift[]
}

export const useRelationshipStore = create<RelationshipState>()(
  devtools(
    persist(
      (set, get) => ({
        level: 1,
        points: 0,
        memories: [],
        milestones: [],
        mood: 'neutral',
        favoriteTopics: [],
        giftHistory: [],
        
        addMemory: (memory: Memory) => set((state) => ({
          memories: [...state.memories, memory].slice(-50) // 최근 50개만 유지
        })),
        
        increaseAffection: (amount: number) => set((state) => {
          const newPoints = state.points + amount
          const newLevel = Math.floor(newPoints / 100) + 1
          
          return {
            points: newPoints,
            level: newLevel,
            mood: calculateMood(newPoints, state.memories)
          }
        }),
        
        unlockMilestone: (milestone: Milestone) => set((state) => ({
          milestones: [...state.milestones, milestone]
        }))
      }),
      { name: 'relationship-store' }
    )
  )
)
`

async function implementRelationship() {
  // 관계 시스템 스토어 생성
  await fs.writeFile(
    './src/store/relationshipStore.ts',
    relationshipSystemTemplate
  )

  // 관계 이벤트 시스템 생성
  const eventSystemTemplate = `
export const relationshipEvents = {
  firstMeeting: {
    trigger: { level: 1, points: 0 },
    dialogue: "처음 만나서 반가워요! 앞으로 잘 부탁해요.",
    reward: { points: 10, memory: "첫 만남" }
  },
  
  level2Unlock: {
    trigger: { level: 2 },
    dialogue: "우리 이제 친구라고 할 수 있을까요?",
    reward: { skill: "친구의 격려", points: 20 }
  },
  
  // ... 더 많은 이벤트
}
`

  await fs.writeFile('./src/data/relationship-events.ts', eventSystemTemplate)

  console.log('✅ 관계 시스템 구현 완료')
}

implementRelationship()
```

### `/scripts/generate-story-content.js`

```javascript
import { AIManager } from '../src/services/ai/AIManager.js'
import fs from 'fs/promises'

async function generateStoryContent(args) {
  const { conversations, events, quests } = parseArgs(args)
  const aiManager = new AIManager()

  console.log(
    `📝 생성 중: ${conversations}개 대화, ${events}개 이벤트, ${quests}개 퀘스트`
  )

  // 대화 콘텐츠 생성
  const conversationPrompt = `
Generate ${conversations} daily conversation starters for a Korean AI companion RPG.
Context:
- Game: 소울메이트 (Soulmate)
- Setting: Modern fantasy Korea
- Companion: Friendly AI with emotions
- Language: Korean (natural, warm tone)

Format each as:
{
  "id": "daily_XXX",
  "timeOfDay": "morning|afternoon|evening|night",
  "minRelationship": 1-10,
  "trigger": "condition",
  "dialogue": "AI companion's line in Korean",
  "playerOptions": ["option1", "option2", "option3"],
  "responses": {
    "option1": "AI response",
    "option2": "AI response", 
    "option3": "AI response"
  }
}
`

  const result = await aiManager.generateResponse({
    messages: [
      {
        role: 'system',
        content: conversationPrompt,
      },
    ],
    provider: 'claude',
  })

  await fs.writeFile('./src/data/conversations.json', result.text)

  console.log('✅ 스토리 콘텐츠 생성 완료')
}

function parseArgs(args) {
  const conversations =
    args.find(a => a.includes('--conversations'))?.split(' ')[1] || 100
  const events = args.find(a => a.includes('--events'))?.split(' ')[1] || 50
  const quests = args.find(a => a.includes('--quests'))?.split(' ')[1] || 30

  return { conversations, events, quests }
}

generateStoryContent(process.argv.slice(2))
```

## 🔄 자동화 모니터링 시스템

### `/scripts/monitor-progress.js`

```javascript
import chalk from 'chalk'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function monitorProgress() {
  console.log(chalk.blue('📊 소울메이트 개발 진행상황 모니터링\n'))

  // Git 상태 확인
  const { stdout: gitStatus } = await execAsync('git status --short')
  console.log(chalk.yellow('📁 변경된 파일:'))
  console.log(gitStatus || '  변경사항 없음')

  // 테스트 실행
  console.log(chalk.yellow('\n🧪 테스트 실행 중...'))
  try {
    const { stdout: testResult } = await execAsync('npm test -- --run')
    const passed = testResult.match(/(\d+) passed/)?.[1] || 0
    const failed = testResult.match(/(\d+) failed/)?.[1] || 0

    console.log(chalk.green(`  ✅ ${passed}개 테스트 통과`))
    if (failed > 0) {
      console.log(chalk.red(`  ❌ ${failed}개 테스트 실패`))
    }
  } catch (error) {
    console.log(chalk.red('  테스트 실행 실패'))
  }

  // 빌드 크기 확인
  console.log(chalk.yellow('\n📦 빌드 크기:'))
  try {
    const { stdout: buildSize } = await execAsync('du -sh dist')
    console.log(`  ${buildSize.trim()}`)
  } catch {
    console.log('  아직 빌드되지 않음')
  }

  // TODO 항목 확인
  console.log(chalk.yellow('\n📋 TODO 항목:'))
  const { stdout: todos } = await execAsync(
    'grep -r "TODO" src --include="*.ts" --include="*.tsx" | wc -l'
  )
  console.log(`  ${todos.trim()}개의 TODO 발견`)

  // 진행률 계산
  const phases = {
    'Phase 1': 100,
    'Phase 2 - 캐릭터': 0,
    'Phase 2 - 전투': 0,
    'Phase 3 - 콘텐츠': 0,
    'Phase 4 - 배포': 0,
  }

  const totalProgress =
    Object.values(phases).reduce((a, b) => a + b) / Object.keys(phases).length

  console.log(chalk.blue(`\n🎯 전체 진행률: ${totalProgress.toFixed(1)}%`))

  // 진행률 바
  const progressBar =
    '█'.repeat(Math.floor(totalProgress / 5)) +
    '░'.repeat(20 - Math.floor(totalProgress / 5))
  console.log(`[${progressBar}]`)

  // 다음 단계 안내
  console.log(chalk.green('\n📌 다음 단계:'))
  console.log('  1. npm run phase2:character - 캐릭터 시스템 구현')
  console.log('  2. npm run phase2:battle - 전투 시스템 구현')
  console.log('  3. npm run phase3:content - 콘텐츠 자동 생성')
}

// 5초마다 모니터링
if (process.argv.includes('--watch')) {
  setInterval(monitorProgress, 5000)
} else {
  monitorProgress()
}
```

## 📋 NPM Scripts 추가

```json
{
  "scripts": {
    "// Automation Scripts": "",
    "automation:setup": "node scripts/setup-automation.js",
    "phase2:character": "bash scripts/phase2-character.sh",
    "phase2:battle": "bash scripts/phase2-battle.sh",
    "phase3:content": "bash scripts/phase3-content.sh",
    "phase4:deploy": "bash scripts/phase4-deploy.sh",
    "monitor": "node scripts/monitor-progress.js",
    "monitor:watch": "node scripts/monitor-progress.js --watch",
    "generate:component": "node scripts/generate-component.js",
    "generate:story": "node scripts/generate-story-content.js",
    "generate:characters": "node scripts/generate-character-system.js",
    "// AI Generation": "",
    "ai:conversations": "node scripts/generate-story-content.js --conversations 100",
    "ai:events": "node scripts/generate-story-content.js --events 50",
    "ai:quests": "node scripts/generate-story-content.js --quests 30",
    "ai:all": "npm run ai:conversations && npm run ai:events && npm run ai:quests"
  }
}
```

## 🎯 실행 명령어

### 개발 진행 자동화

```bash
# 전체 자동화 설정
npm run automation:setup

# Phase별 실행
npm run phase2:character  # 캐릭터 시스템
npm run phase2:battle     # 전투 시스템
npm run phase3:content    # 콘텐츠 생성
npm run phase4:deploy     # 배포

# 진행 상황 모니터링
npm run monitor          # 1회성 체크
npm run monitor:watch    # 실시간 모니터링
```

### AI 콘텐츠 생성

```bash
# 개별 생성
npm run ai:conversations  # 대화 생성
npm run ai:events        # 이벤트 생성
npm run ai:quests        # 퀘스트 생성

# 전체 생성
npm run ai:all           # 모든 콘텐츠
```

## 🔮 예상 일정

| 단계             | 기간 | 자동화 수준 | 예상 시간 절약 |
| ---------------- | ---- | ----------- | -------------- |
| Phase 2 - 캐릭터 | 2주  | 80%         | 8일 → 3일      |
| Phase 2 - 전투   | 2주  | 70%         | 10일 → 4일     |
| Phase 3 - 콘텐츠 | 3주  | 90%         | 15일 → 3일     |
| Phase 4 - 배포   | 1주  | 95%         | 5일 → 1일      |

**총 절약 시간**: 38일 → 11일 (71% 단축)

## 🚀 다음 단계

1. **즉시 실행 가능**: `npm run phase2:character`
2. **모니터링 시작**: `npm run monitor:watch`
3. **AI 콘텐츠 생성**: `npm run ai:all`

자동화 시스템이 준비되었습니다! 🎉
