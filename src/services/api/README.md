# API Bridge Service Documentation

## Overview

The API Bridge Service provides a safe, validated interface between state adapters and external APIs. It replaces mock implementations in the store with real API communication while maintaining development flexibility.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ State Adapters  │ ─→ │   API Bridge    │ ─→ │  External APIs  │
│                 │    │                 │    │                 │
│ • Conversation  │    │ • Validation    │    │ • AI Service    │
│ • Game State    │    │ • Rate Limiting │    │ • Save System   │
│ • Character     │    │ • Retry Logic   │    │ • Analytics     │
│ • Settings      │    │ • Deduplication │    │ • Content API   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Key Features

### 🛡️ **Safety & Validation**
- Input sanitization with security layer
- Request/response schema validation using Zod
- Type-safe API contracts
- Error boundary protection

### ⚡ **Performance & Reliability**
- Request deduplication (prevents duplicate API calls)
- Rate limiting (configurable per operation)
- Exponential backoff retry logic
- Circuit breaker pattern for API failures
- Request timeout handling

### 🔧 **Developer Experience**
- Mock mode for development
- Comprehensive error messages
- Request/response logging
- TypeScript integration
- Easy testing with mocked responses

### 🌐 **Real-time Features**
- WebSocket manager for live updates
- Connection state monitoring
- Automatic reconnection with backoff
- Message queuing during disconnections

## Components

### APIBridge
Main service that handles all API communication.

```typescript
import { useAPIBridge } from '@services/api'

const apiBridge = useAPIBridge()

// Send a message
const response = await apiBridge.sendMessage('Hello!')

// Save game state
const saveResult = await apiBridge.saveGameState()

// Get content recommendations
const recommendations = await apiBridge.getContentRecommendations()
```

### APIClient
Low-level HTTP client with authentication and retry logic.

```typescript
import { getAPIClient } from '@services/api'

const client = getAPIClient({ timeout: 30000 })

// Health check
const isHealthy = await client.healthCheck()

// Custom request
const response = await client.post('/custom-endpoint', data)
```

### WebSocketManager
Manages real-time WebSocket connections.

```typescript
import { useWebSocket } from '@services/api'

const { send, onMessage, connectionState } = useWebSocket()

// Send message
send({ type: 'ping', timestamp: Date.now() })

// Listen for messages
const unsubscribe = onMessage((message) => {
  console.log('Received:', message)
})
```

## Configuration

### Environment Variables
```bash
# API endpoint
VITE_API_URL=http://localhost:3000/api

# WebSocket endpoint
VITE_WS_URL=ws://localhost:3000/ws

# Development mode (enables mocking)
NODE_ENV=development
```

### API Bridge Config
```typescript
const config = {
  mockMode: true,              // Use mock responses
  timeout: 30000,              // Request timeout (ms)
  maxRetries: 3,               // Max retry attempts
  rateLimitPerMinute: 60       // Rate limit per operation
}

const apiBridge = new APIBridge(config)
```

## Usage Examples

### 1. Conversation Integration

```typescript
// In ConversationStateAdapter
async sendMessage(content: string): Promise<void> {
  const { getAPIBridge } = await import('@services/api')
  const apiBridge = getAPIBridge()
  
  // Add user message
  this.addMessage({
    id: `msg_${Date.now()}_user`,
    sender: 'user',
    content,
    timestamp: Date.now()
  })
  
  try {
    // Get AI response through API Bridge
    const aiMessage = await apiBridge.sendMessage(content)
    this.addMessage(aiMessage)
  } catch (error) {
    // Handle error gracefully
    this.addMessage({
      id: `msg_${Date.now()}_error`,
      sender: 'ai',
      content: 'Sorry, I encountered an error. Please try again.',
      timestamp: Date.now(),
      emotion: 'confused'
    })
  }
}
```

### 2. Game State Persistence

```typescript
// In GameStateAdapter
async saveGame(): Promise<void> {
  const { getAPIBridge } = await import('@services/api')
  const apiBridge = getAPIBridge()
  
  const result = await apiBridge.saveGameState()
  if (result.success) {
    // Update local timestamp
    useStore.getState().updateGameState({
      lastSaved: Date.now()
    })
  }
}
```

### 3. Real-time Features

```typescript
function GameComponent() {
  const { send, onMessage, connectionState } = useWebSocket()
  
  useEffect(() => {
    const unsubscribe = onMessage((message) => {
      if (message.type === 'emotion') {
        // Update character emotion in real-time
        characterAdapter.updateEmotion(message.data.emotion, message.data.intensity)
      }
    })
    
    return unsubscribe
  }, [])
  
  const handleEmotionChange = (emotion, intensity) => {
    send({
      type: 'emotion',
      data: { emotion, intensity },
      timestamp: Date.now()
    })
  }
}
```

## API Contracts

### Conversation API

**Request:**
```typescript
interface ConversationRequest {
  message: string                    // 1-1000 characters
  context?: {
    characterId: string
    emotion: EmotionType
    intimacyLevel: number           // 0-1
    recentTopics: string[]
    conversationMode?: string       // casual|deep|playful|serious
  }
}
```

**Response:**
```typescript
interface ConversationResponse {
  content: string
  emotion: EmotionType              // happy|sad|excited|etc
  metadata?: {
    confidence: number              // 0-1
    processingTime: number          // milliseconds
    tokensUsed?: number
  }
}
```

### Save Game API

**Request:**
```typescript
interface SaveGameRequest {
  gameState: {
    level: number                   // >= 1
    experience: number              // >= 0
    playTime: number                // >= 0
    unlockedFeatures: string[]
  }
  companion: {
    name: string
    personalityTraits: Record<string, number>  // 0-1
    relationshipStatus: {
      intimacyLevel: number         // 0-1
      trustLevel: number            // 0-1
    }
  }
  timestamp: number
}
```

**Response:**
```typescript
interface SaveGameResponse {
  success: boolean
  saveId?: string
}
```

## Error Handling

### Error Types
```typescript
type APIErrorCode = 
  | 'NETWORK_ERROR'      // Connection failed
  | 'VALIDATION_ERROR'   // Invalid request data  
  | 'RATE_LIMIT'        // Too many requests
  | 'AUTHENTICATION'    // Auth failed
  | 'SERVER_ERROR'      // 5xx response
  | 'TIMEOUT'           // Request timeout
  | 'UNKNOWN'           // Unexpected error
```

### Error Response
```typescript
interface APIError {
  code: APIErrorCode
  message: string
  details?: unknown
  retryable: boolean    // Can this error be retried?
  timestamp: number
}
```

### Retry Strategy
- **Network/Server Errors**: Retry with exponential backoff (1s, 2s, 4s)
- **Rate Limits**: Respect retry-after header
- **Timeout**: Retry with same timeout
- **Auth Errors**: No retry (redirect to login)
- **Validation**: No retry (fix request first)

## Testing

### Mock Mode
Enable mock responses for development and testing:

```typescript
const apiBridge = new APIBridge({ mockMode: true })

// Returns realistic mock responses
const response = await apiBridge.sendMessage('Hello!')
```

### Unit Tests
```typescript
import { APIBridge } from '@services/api'

describe('APIBridge', () => {
  it('should handle message sending', async () => {
    const bridge = new APIBridge({ mockMode: true })
    const response = await bridge.sendMessage('test message')
    
    expect(response.sender).toBe('ai')
    expect(response.content).toBeDefined()
    expect(response.emotion).toBeDefined()
  })
})
```

## Rate Limiting

### Default Limits
- **Conversation**: 60 requests/minute
- **Save Game**: 10 requests/minute  
- **Load Game**: 30 requests/minute
- **Content Recommendations**: 20 requests/minute

### Custom Limits
```typescript
const apiBridge = new APIBridge({
  rateLimitPerMinute: 120  // Higher limit
})
```

### Rate Limit Headers
The API client automatically handles rate limit responses:
- Respects `Retry-After` header
- Implements client-side rate limiting
- Provides clear error messages

## WebSocket Integration

### Connection Management
```typescript
const wsManager = getWebSocketManager({
  url: 'ws://localhost:3000/ws',
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000
})

// Auto-connect with reconnection
wsManager.connect()
```

### Message Types
```typescript
interface WSMessage {
  type: 'ping' | 'pong' | 'message' | 'emotion' | 'sync' | 'error'
  data?: unknown
  timestamp: number
}
```

### Real-time Sync
- Character emotion changes
- Game state updates
- New message notifications
- System announcements

## Security Considerations

### Input Validation
- All inputs validated with Zod schemas
- SQL injection prevention
- XSS protection via sanitization
- Request size limits

### Authentication
- Bearer token authentication
- Token refresh handling
- Secure token storage
- Session management

### Rate Limiting
- Per-IP rate limiting
- Per-user rate limiting
- Adaptive rate limiting
- DDoS protection

## Production Deployment

### Configuration
```typescript
const productionConfig = {
  mockMode: false,
  timeout: 15000,
  maxRetries: 5,
  rateLimitPerMinute: 100,
  baseURL: 'https://api.yourgame.com'
}
```

### Monitoring
- Request/response metrics
- Error rate monitoring
- Latency tracking
- Rate limit hit rates

### Scaling
- Connection pooling
- Load balancing
- Circuit breaker patterns
- Graceful degradation

## Migration Guide

### From Store Mock Implementation

**Before:**
```typescript
// Direct store usage with mock
const response = await useStore.getState().sendMessage(message)
```

**After:**
```typescript
// Through API Bridge with real API
const apiBridge = useAPIBridge()
const response = await apiBridge.sendMessage(message)
```

### Benefits of Migration
1. **Real API Integration**: Connect to actual AI services
2. **Better Error Handling**: Graceful degradation and recovery
3. **Performance**: Request deduplication and caching
4. **Scalability**: Rate limiting and circuit breakers
5. **Monitoring**: Request tracking and analytics