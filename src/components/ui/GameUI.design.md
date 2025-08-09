# 🎮 "echo/" 게임 UI 시스템 설계 문서

## 개요

ui_guide.md 기반으로 한 게임 UI 시스템의 종합 설계 문서입니다. 5가지 주요 게임 모드와 반응형 디자인을 지원하는 현대적인 UI 시스템을 구현합니다.

## 🏗️ 시스템 아키텍처

### 핵심 컴포넌트 구조

```typescript
src/components/ui/
├── GameUI/                     # 메인 게임 UI 시스템
│   ├── GameUI.tsx             # 루트 게임 UI 컨테이너
│   ├── StatusBar.tsx          # 상단 상태바 (Day, Hearts, Energy)
│   ├── AICharacterAvatar.tsx  # AI 캐릭터 아바타 및 상태
│   └── InteractionPanel.tsx   # 하단 인터랙션 패널
├── modes/                     # 게임 모드별 컴포넌트
│   ├── ConversationMode.tsx   # 메인 대화 모드
│   ├── ExplorationMode.tsx    # 탐험 모드
│   ├── BattleMode.tsx         # 전투 화면
│   ├── DailyActivityMode.tsx  # 일상 활동 모드
│   └── EmotionSyncMode.tsx    # 감정 교감 인터페이스
├── animations/                # 애니메이션 시스템
│   ├── TypingEffect.tsx       # 타이핑 이펙트
│   ├── EmotionMorphing.tsx    # 감정 변화 애니메이션
│   ├── ParticleSystem.tsx     # 파티클 효과
│   └── SpecialMoments.tsx     # 특별한 순간 연출
├── responsive/               # 반응형 시스템
│   ├── BreakpointProvider.tsx # 브레이크포인트 관리
│   ├── ResponsiveLayout.tsx   # 반응형 레이아웃
│   └── MobileOptimized.tsx    # 모바일 최적화
└── theme/                    # 테마 시스템
    ├── DarkTheme.tsx         # 다크 테마 구현
    ├── GlassmorphismStyle.tsx # 글래스모피즘 스타일
    └── NeonAccents.tsx       # 네온 액센트 시스템
```

### 상태 관리 시스템

```typescript
// GameUI State Management
interface GameUIState {
  currentMode: GameMode
  characterState: AICharacterState
  userInteraction: UserInteractionState
  animations: AnimationState
  layout: ResponsiveLayoutState
}

type GameMode = 
  | 'conversation'    // 메인 대화 모드
  | 'exploration'     // 탐험 모드
  | 'battle'          // 전투 화면
  | 'daily_activity'  // 일상 활동
  | 'emotion_sync'    // 감정 교감

interface AICharacterState {
  emotion: EmotionType
  emotionIntensity: number
  intimacyLevel: number
  currentMood: string
  eyeBlinking: boolean
  lipSync: boolean
  expressionLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7
}
```

## 🎨 시각적 디자인 시스템

### 색상 팔레트

```css
:root {
  /* 배경 색상 */
  --bg-primary: #0A0F1B;           /* 다크 네이비 */
  --bg-secondary: rgba(10, 15, 27, 0.8);
  --bg-glass: rgba(255, 255, 255, 0.1);
  
  /* 네온 액센트 */
  --neon-mint: #00FFF0;            /* 민트 네온 */
  --neon-purple: #B347FF;          /* 보라 네온 */
  --neon-pink: #FF47B3;            /* 핑크 네온 */
  --neon-blue: #4799FF;            /* 블루 네온 */
  
  /* 텍스트 */
  --text-primary: #FFFFFF;
  --text-secondary: #B0C4DE;
  --text-accent: var(--neon-mint);
  
  /* UI 요소 */
  --panel-bg: rgba(255, 255, 255, 0.05);
  --panel-border: rgba(0, 255, 240, 0.3);
  --button-hover: rgba(0, 255, 240, 0.2);
}
```

### 글래스모피즘 스타일

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 255, 240, 0.3);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.neon-glow {
  box-shadow: 
    0 0 10px currentColor,
    0 0 20px currentColor,
    0 0 30px currentColor;
  animation: neon-pulse 2s ease-in-out infinite alternate;
}

@keyframes neon-pulse {
  from { filter: brightness(1); }
  to { filter: brightness(1.3); }
}
```

## 📱 반응형 레이아웃 시스템

### 브레이크포인트 정의

```typescript
const breakpoints = {
  mobile: '320px',
  tablet: '768px',  
  desktop: '1024px',
  wide: '1920px'
}

interface ResponsiveConfig {
  mobile: {
    layout: 'vertical'
    characterSize: 'small'
    panelCollapsed: true
    touchOptimized: true
  }
  desktop: {
    layout: 'horizontal'
    characterSize: 'large'
    panelExpanded: true
    keyboardSupport: true
  }
}
```

### 레이아웃 변환

**PC (1920x1080)**
```
┌─────────────────────────────────────────┐
│  [StatusBar] Day 12 ♥234 ⚡45/100      │
├─────────────┬───────────────────────────┤
│             │                           │
│  AI Character│    Conversation Area     │
│   (1/3)     │        (2/3)             │
│             │                           │
├─────────────┴───────────────────────────┤
│        Interaction Panel                │
└─────────────────────────────────────────┘
```

**Mobile (세로)**
```
┌─────────────────────────┐
│ [StatusBar] Day 12 ♥234 │
├─────────────────────────┤
│     AI Character        │
│      (상단 1/3)          │
├─────────────────────────┤
│   Conversation Area     │
│      (중간 1/2)          │
├─────────────────────────┤
│   Interaction Panel     │
│      (하단 1/6)          │
└─────────────────────────┘
```

## 🎮 게임 모드별 UI 설계

### 1. 메인 대화 모드 (Conversation Mode)

**컴포넌트 구조:**
```typescript
interface ConversationModeProps {
  character: AICompanion
  conversation: ConversationState
  onUserInput: (input: string) => void
}

<ConversationMode>
  <AICharacterAvatar 
    character={character}
    emotion={character.currentEmotion}
    animation="talking"
  />
  <DialogueArea>
    <MessageHistory messages={conversation.history} />
    <TypingIndicator visible={character.isTyping} />
    <UserInputOptions>
      <QuickResponses options={suggestedResponses} />
      <FreeTextInput placeholder="자유 입력..." />
    </UserInputOptions>
  </DialogueArea>
</ConversationMode>
```

**특징:**
- 실시간 감정 변화 표시
- 7단계 표정 시스템
- 타이핑 효과로 자연스러운 대화감
- 제안 응답 + 자유 입력 지원

### 2. 탐험 모드 (Exploration Mode)

**컴포넌트 구조:**
```typescript
<ExplorationMode>
  <MiniMap>
    <GridCell type="wall" symbol="♦" />
    <GridCell type="player" symbol="You→" />
    <GridCell type="enemy" symbol="⚔" />
    <GridCell type="treasure" symbol="✨" />
    <GridCell type="unknown" symbol="?" />
  </MiniMap>
  <CompanionCommentary>
    <AIComment text="저 앞에 뭔가 있는 것 같아... 조심해서 가자!" />
  </CompanionCommentary>
  <MovementControls>
    <DirectionalPad />
    <ActionButton text="조사하기" />
  </MovementControls>
</ExplorationMode>
```

**특징:**
- 8x8 그리드 미니맵 시스템
- AI 동반자 실시간 코멘트
- 터치/키보드 양방향 조작 지원
- 상황별 동적 액션 버튼

### 3. 전투 화면 (Battle Mode)

**컴포넌트 구조:**
```typescript
<BattleMode>
  <EnemyDisplay>
    <EnemySprite enemy={currentEnemy} />
    <HealthBar current={enemy.hp} max={enemy.maxHp} />
  </EnemyDisplay>
  <PlayerStatus>
    <CharacterHP character="player" />
    <CharacterHP character="companion" />
  </PlayerStatus>
  <BattleDialogue>
    <CompanionComment text="내가 먼저 마법으로 약화시킬게! 준비됐어?" />
    <ChoiceButtons>
      <Choice text="응, 너를 믿어!" />
      <Choice text="조심해, 위험해 보여" />
    </ChoiceButtons>
  </BattleDialogue>
</BattleMode>
```

**특징:**
- 세미 자동 전투 시스템
- 전투 중 실시간 대화 지속
- 전략적 선택지 제공
- 시각적 전투 피드백

### 4. 일상 활동 모드 (Daily Activity Mode)

**컴포넌트 구조:**
```typescript
<DailyActivityMode activity="cooking">
  <ActivityTitle icon="🍳" text="함께 요리하기" />
  <MiniGame type="cooking">
    <DragDropIngredients />
    <TimingGame action="뒤집기" />
    <ProgressBar label="완성도" value="4/5" />
  </MiniGame>
  <CompanionReaction>
    <Dialogue text="와! 냄새 좋다~ 우리 정말 환상의 콤비인 것 같아!" />
    <SatisfactionGain amount={15} />
  </CompanionReaction>
</DailyActivityMode>
```

**특징:**
- 활동별 맞춤 미니게임
- 실시간 만족도 피드백
- 드래그 앤 드롭 인터랙션
- 성과 기반 보상 시스템

### 5. 감정 교감 인터페이스 (Emotion Sync Mode)

**컴포넌트 구조:**
```typescript
<EmotionSyncMode>
  <EmotionWaveBar>
    <UserEmotion emotion="😊" intensity={0.8} />
    <SyncRate percentage={78} />
    <CompanionEmotion emotion="😊" intensity={0.8} />
  </EmotionWaveBar>
  <EmotionVisualization>
    <WaveAnimation sync={syncRate} />
    <ParticleEffect type="heart" active={highSync} />
  </EmotionVisualization>
  <SyncFeedback>
    <Message text="감정이 잘 통하고 있어요! ❤️" />
    <SyncBonus points={5} />
  </SyncFeedback>
</EmotionSyncMode>
```

**특징:**
- 실시간 감정 동기화 시각화
- 파동 형태 감정 표시
- 동기화율 기반 보너스
- 시각적 피드백 시스템

## ⚡ 애니메이션 시스템

### 타이핑 효과 (Typing Effect)

```typescript
interface TypingEffectProps {
  text: string
  speed: number // characters per second
  onComplete?: () => void
}

const TypingEffect: React.FC<TypingEffectProps> = ({ text, speed, onComplete }) => {
  const [displayText, setDisplayText] = useState('')
  
  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1))
        index++
      } else {
        clearInterval(interval)
        onComplete?.()
      }
    }, 1000 / speed)
    
    return () => clearInterval(interval)
  }, [text, speed, onComplete])
  
  return <span>{displayText}<Cursor />}</span>
}
```

### 감정 모프 전환 (Emotion Morphing)

```typescript
const EmotionMorphing: React.FC<EmotionMorphProps> = ({ 
  fromEmotion, 
  toEmotion, 
  duration 
}) => {
  return (
    <div className="emotion-container">
      <div 
        className="emotion-morph"
        style={{
          '--from-emotion': getEmotionCSS(fromEmotion),
          '--to-emotion': getEmotionCSS(toEmotion),
          '--duration': `${duration}ms`
        }}
      >
        {getEmotionEmoji(toEmotion)}
      </div>
    </div>
  )
}

// CSS
.emotion-morph {
  animation: emotion-transition var(--duration) ease-in-out;
  transform-origin: center;
}

@keyframes emotion-transition {
  0% { 
    transform: scale(1) rotate(0deg);
    filter: hue-rotate(0deg);
  }
  50% { 
    transform: scale(1.2) rotate(10deg);
    filter: hue-rotate(180deg);
  }
  100% { 
    transform: scale(1) rotate(0deg);
    filter: hue-rotate(0deg);
  }
}
```

### 파티클 시스템

```typescript
interface ParticleSystemProps {
  type: 'hearts' | 'stars' | 'sparkles' | 'bubbles'
  intensity: number
  color: string
  duration?: number
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ 
  type, intensity, color, duration = 3000 
}) => {
  const particles = useMemo(() => 
    generateParticles(type, intensity, color), 
    [type, intensity, color]
  )
  
  return (
    <div className="particle-container">
      {particles.map(particle => (
        <Particle 
          key={particle.id}
          {...particle}
          duration={duration}
        />
      ))}
    </div>
  )
}
```

## 💫 특별한 순간 연출 시스템

### 친밀도 레벨업 연출

```typescript
const IntimacyLevelUp: React.FC<IntimacyLevelUpProps> = ({ 
  fromLevel, 
  toLevel, 
  relationship 
}) => {
  return (
    <SpecialMomentOverlay>
      <ParticleSystem 
        type="sparkles" 
        intensity="high" 
        color="gold" 
        duration={5000}
      />
      <CenterMessage>
        <GlowText>✨ SOUL SYNCED ✨</GlowText>
        <LevelChange>관계 레벨 {fromLevel} → {toLevel}</LevelChange>
        <RelationshipMessage>
          "{getRelationshipMessage(relationship)}"
        </RelationshipMessage>
      </CenterMessage>
      <ScreenFlash color="rgba(255, 215, 0, 0.3)" />
    </SpecialMomentOverlay>
  )
}
```

### 중요 대화 선택 연출

```typescript
const CriticalChoice: React.FC<CriticalChoiceProps> = ({ 
  choices, 
  onChoice, 
  warning 
}) => {
  return (
    <SlowMotionOverlay>
      <BackgroundBlur intensity={0.8} />
      <WarningMessage>{warning}</WarningMessage>
      <ChoiceContainer>
        {choices.map(choice => (
          <NeonChoice 
            key={choice.id}
            text={choice.text}
            consequence={choice.consequence}
            onClick={() => onChoice(choice)}
          />
        ))}
      </ChoiceContainer>
      <TimeSlowEffect />
    </SlowMotionOverlay>
  )
}
```

## 🔧 기술적 구현 세부사항

### 성능 최적화

```typescript
// 컴포넌트 메모이제이션
const AICharacterAvatar = React.memo<AICharacterAvatarProps>(({ 
  character, 
  emotion, 
  animation 
}) => {
  // 감정 변화 시에만 리렌더링
  return useMemo(() => (
    <CharacterContainer>
      <EmotionLayer emotion={emotion} />
      <AnimationLayer animation={animation} />
      <BlinkingEffect active={character.isAlive} />
    </CharacterContainer>
  ), [emotion, animation, character.isAlive])
})

// 가상화된 메시지 리스트
const MessageHistory = React.memo<MessageHistoryProps>(({ messages }) => {
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 80,
    overscan: 5
  })
  
  return (
    <div ref={scrollElementRef} className="message-history">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <Message 
            key={virtualRow.key}
            message={messages[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`
            }}
          />
        ))}
      </div>
    </div>
  )
})
```

### 상태 관리 통합

```typescript
// GameUI Context
const GameUIContext = createContext<GameUIState | null>(null)

export const GameUIProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [gameState, setGameState] = useReducer(gameUIReducer, initialState)
  
  // AI 캐릭터 상태와 동기화
  useEffect(() => {
    const subscription = characterSystem.subscribe((characterState) => {
      setGameState({
        type: 'UPDATE_CHARACTER_STATE',
        payload: characterState
      })
    })
    
    return () => subscription.unsubscribe()
  }, [])
  
  // 게임 모드 전환 로직
  const switchGameMode = useCallback((mode: GameMode) => {
    setGameState({
      type: 'SWITCH_MODE',
      payload: { mode, transition: getTransitionForMode(mode) }
    })
  }, [])
  
  return (
    <GameUIContext.Provider value={{ gameState, switchGameMode }}>
      {children}
    </GameUIContext.Provider>
  )
}
```

### 애니메이션 최적화

```typescript
// RAF 기반 애니메이션 시스템
class AnimationManager {
  private animations = new Map<string, Animation>()
  private rafId: number | null = null
  
  addAnimation(id: string, animation: Animation) {
    this.animations.set(id, animation)
    if (!this.rafId) {
      this.startAnimationLoop()
    }
  }
  
  private startAnimationLoop() {
    const animate = (timestamp: number) => {
      for (const [id, animation] of this.animations) {
        if (animation.isComplete()) {
          this.animations.delete(id)
        } else {
          animation.update(timestamp)
        }
      }
      
      if (this.animations.size > 0) {
        this.rafId = requestAnimationFrame(animate)
      } else {
        this.rafId = null
      }
    }
    
    this.rafId = requestAnimationFrame(animate)
  }
}
```

## 🌐 접근성 및 사용성

### 키보드 지원

```typescript
const GameUI: React.FC = () => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'Tab':
        // 포커스 순환
        handleTabNavigation(event)
        break
      case 'Enter':
        // 현재 선택된 요소 활성화
        handleEnterPress()
        break
      case 'Escape':
        // 모달 닫기 또는 취소
        handleEscape()
        break
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        // 방향키 네비게이션
        handleArrowNavigation(event.key)
        break
    }
  }, [])
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
```

### ARIA 레이블 및 스크린 리더 지원

```typescript
const DialogueArea: React.FC = ({ messages, isTyping }) => {
  return (
    <div 
      role="log" 
      aria-live="polite" 
      aria-label="대화 영역"
      className="dialogue-area"
    >
      {messages.map(message => (
        <div 
          key={message.id}
          role="article"
          aria-label={`${message.speaker}의 메시지`}
          className="message"
        >
          <span className="speaker" aria-hidden="true">{message.speaker}:</span>
          <span className="content">{message.content}</span>
          <time 
            dateTime={message.timestamp.toISOString()}
            className="sr-only"
          >
            {formatTimeForScreenReader(message.timestamp)}
          </time>
        </div>
      ))}
      {isTyping && (
        <div 
          role="status" 
          aria-live="polite"
          aria-label="AI가 입력 중입니다"
        >
          <TypingIndicator />
        </div>
      )}
    </div>
  )
}
```

## 📊 성능 모니터링

### 렌더링 성능 추적

```typescript
const PerformanceMonitor: React.FC = () => {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        if (entry.entryType === 'measure') {
          console.log(`${entry.name}: ${entry.duration}ms`)
          
          // 성능 임계값 체크
          if (entry.duration > 16.67) { // 60fps 기준
            console.warn(`Performance warning: ${entry.name} took ${entry.duration}ms`)
          }
        }
      })
    })
    
    observer.observe({ entryTypes: ['measure'] })
    
    return () => observer.disconnect()
  }, [])
  
  return null
}
```

## 🚀 배포 및 빌드 최적화

### 코드 분할

```typescript
// 게임 모드별 코드 분할
const ConversationMode = lazy(() => import('./modes/ConversationMode'))
const ExplorationMode = lazy(() => import('./modes/ExplorationMode'))
const BattleMode = lazy(() => import('./modes/BattleMode'))
const DailyActivityMode = lazy(() => import('./modes/DailyActivityMode'))
const EmotionSyncMode = lazy(() => import('./modes/EmotionSyncMode'))

// 프리로딩 전략
export const preloadGameModes = () => {
  return Promise.all([
    import('./modes/ConversationMode'),
    import('./modes/ExplorationMode'),
    import('./modes/BattleMode')
  ])
}
```

## 📋 구현 체크리스트

### Phase 1: 기본 시스템 구축
- [ ] 기본 GameUI 컴포넌트 구조
- [ ] 상태 관리 시스템 구현  
- [ ] 반응형 레이아웃 기반
- [ ] 다크 테마 + 글래스모피즘 스타일

### Phase 2: 게임 모드 구현
- [ ] ConversationMode 구현
- [ ] ExplorationMode 구현
- [ ] BattleMode 전투 시스템 연동
- [ ] DailyActivityMode 구현
- [ ] EmotionSyncMode 구현

### Phase 3: 애니메이션 시스템
- [ ] 타이핑 효과 시스템
- [ ] 감정 모프 애니메이션
- [ ] 파티클 시스템 구현
- [ ] 특별한 순간 연출 시스템

### Phase 4: 최적화 및 접근성
- [ ] 성능 최적화 (가상화, 메모이제이션)
- [ ] 접근성 기능 (키보드, ARIA)
- [ ] 모바일 터치 최적화
- [ ] 성능 모니터링 시스템

### Phase 5: 통합 및 테스트
- [ ] 캐릭터 시스템 연동
- [ ] 전투 시스템 통합
- [ ] UI 테스트 스위트 작성
- [ ] 크로스 브라우저 테스트

이 설계 문서를 기반으로 현대적이고 몰입감 있는 게임 UI 시스템을 구축할 수 있습니다. 각 단계별로 체계적으로 구현하여 사용자 경험을 극대화하는 것이 목표입니다.