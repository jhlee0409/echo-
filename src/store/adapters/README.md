# State Adapters Documentation

## Overview

The State Adapter pattern provides a clean abstraction layer between UI components and the underlying state management implementation. This pattern enables:

- **Decoupling**: UI components don't need to know about Zustand or Context implementation
- **Type Safety**: Domain-specific APIs with strong typing
- **Testability**: Easy to mock adapters for testing
- **Migration**: Can change underlying store without affecting components
- **Performance**: Optimized selectors and memory management

## Architecture

```
┌─────────────────┐
│  UI Components  │
└────────┬────────┘
         │ Uses clean API
┌────────▼────────┐
│ State Adapters  │ ← You are here
└────────┬────────┘
         │ Abstracts implementation
┌────────▼────────┐
│ Zustand/Context │
└─────────────────┘
```

## Available Adapters

### 1. GameStateAdapter
Manages game progress, levels, saves, and features.

```typescript
import { useGameStateAdapter } from '@store/adapters'

const gameAdapter = useGameStateAdapter()

// Level management
gameAdapter.addExperience(100)
if (gameAdapter.canLevelUp()) {
  gameAdapter.levelUp()
}

// Feature unlocks
gameAdapter.unlockFeature('advanced_chat')
const isUnlocked = gameAdapter.isFeatureUnlocked('advanced_chat')

// Statistics
const stats = gameAdapter.getStatistics()
console.log(`Completion: ${stats.completionPercentage}%`)
```

### 2. CharacterStateAdapter
Handles AI companion personality, emotions, and relationships.

```typescript
import { useCharacterStateAdapter } from '@store/adapters'

const characterAdapter = useCharacterStateAdapter()

// Emotions
characterAdapter.updateEmotion('happy', 0.8)

// Relationships
characterAdapter.updateRelationship(0.7, 0.9) // intimacy, trust

// Memories
characterAdapter.addMemory({
  id: 'mem_123',
  content: 'Had a great conversation about music',
  timestamp: Date.now(),
  emotion: 'happy',
  importance: 0.8,
  tags: ['music', 'interests']
})
```

### 3. ConversationStateAdapter
Manages chat history with pagination and archiving.

```typescript
import { useConversationStateAdapter } from '@store/adapters'

const conversationAdapter = useConversationStateAdapter()

// Send message (handles AI response internally)
await conversationAdapter.sendMessage('Hello!')

// Get paginated messages
const messages = conversationAdapter.getMessages(0, 50) // page 0, 50 messages

// Archive old messages to prevent memory bloat
const weekAgo = new Date()
weekAgo.setDate(weekAgo.getDate() - 7)
await conversationAdapter.archiveOldMessages(weekAgo)

// Export conversation
const exportText = await conversationAdapter.exportConversation()
```

### 4. SettingsStateAdapter
User preferences and configuration management.

```typescript
import { useSettingsStateAdapter } from '@store/adapters'

const settingsAdapter = useSettingsStateAdapter()

// Theme
settingsAdapter.toggleDarkMode()

// Audio
settingsAdapter.setSoundVolume(80)
settingsAdapter.toggleMusic()

// Language
settingsAdapter.setLanguage('en')
const languages = settingsAdapter.getSupportedLanguages()

// Auto-save
settingsAdapter.toggleAutoSave()
settingsAdapter.setAutoSaveInterval(10) // minutes
```

### 5. UIStateAdapter
Bridges React Context for UI-specific state.

```typescript
import { useUIStateAdapter } from '@store/adapters'

// Note: Must be used inside GameUIProvider
const uiAdapter = useUIStateAdapter()

// Mode switching
uiAdapter.switchMode('battle', {
  transition: true,
  duration: 500,
  onComplete: () => console.log('Mode switched!')
})

// Character display
uiAdapter.updateCharacterDisplay({
  emotion: 'excited',
  emotionIntensity: 0.9,
  eyeBlinking: true
})

// Layout info
const layout = uiAdapter.getLayoutInfo()
if (uiAdapter.isBreakpoint('mobile')) {
  // Mobile-specific logic
}
```

## Usage Patterns

### In React Components

```typescript
function ChatScreen() {
  const conversation = useConversationStateAdapter()
  const character = useCharacterStateAdapter()
  
  const handleSend = async (message: string) => {
    await conversation.sendMessage(message)
    
    // Update character based on conversation
    character.updateEmotion('happy', 0.7)
  }
  
  const messages = conversation.getMessages()
  const isAITyping = conversation.isAIResponding()
  
  return <ChatUI messages={messages} onSend={handleSend} />
}
```

### Outside React (Services/Utils)

```typescript
import { getGameStateAdapter } from '@store/adapters'

// Singleton instance for non-React code
export function awardExperience(amount: number) {
  const gameAdapter = getGameStateAdapter()
  gameAdapter.addExperience(amount)
}
```

### Testing

```typescript
// Easy to mock adapters
const mockCharacterAdapter: CharacterStateAPI = {
  getCharacterName: () => 'Test Character',
  getCurrentEmotion: () => 'happy',
  updateEmotion: jest.fn(),
  // ... other methods
}

// Inject mock in tests
render(
  <CharacterContext.Provider value={mockCharacterAdapter}>
    <YourComponent />
  </CharacterContext.Provider>
)
```

## Best Practices

1. **Use Hooks in Components**: Always use the hook version (`useXAdapter`) in React components
2. **Singleton for Services**: Use `getXAdapter()` for non-React code
3. **Error Handling**: Adapters throw errors for invalid operations - handle appropriately
4. **Validation**: Use `isValid()` and `getErrors()` for state validation
5. **Memory Management**: Use pagination and archiving for large datasets
6. **Type Safety**: Leverage TypeScript interfaces for compile-time safety

## Migration Guide

### From Direct Store Usage

```typescript
// Before: Direct Zustand usage
const companion = useStore(state => state.companion)
const updateCompanion = useStore(state => state.updateCompanion)

updateCompanion({
  currentEmotion: {
    dominant: 'happy',
    intensity: 0.8
  }
})

// After: Adapter pattern
const character = useCharacterStateAdapter()
character.updateEmotion('happy', 0.8)
```

### Benefits
- Cleaner API
- Domain-specific methods
- Built-in validation
- Better testing