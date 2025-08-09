/**
 * 💬 Conversation State Adapter
 * 
 * Manages chat history with pagination and memory optimization
 * Provides clean API for message handling and conversation analysis
 */

import { useStore } from '@store/gameStore'
import type { Message, EmotionType } from '@types'
import type { 
  ConversationStateAPI, 
  ConversationContext,
  ConversationStats,
  SentimentData 
} from './types'

export class ConversationStateAdapter implements ConversationStateAPI {
  private unsubscribe: (() => void) | null = null
  private readonly PAGE_SIZE = 50
  private readonly MAX_MEMORY_MESSAGES = 200
  private archivedMessages: Message[] = []
  
  // Core state access
  getState(): Message[] {
    return useStore.getState().conversationHistory
  }

  subscribe(listener: (state: Message[]) => void): () => void {
    this.unsubscribe = useStore.subscribe(
      (state) => listener(state.conversationHistory)
    )
    return () => {
      if (this.unsubscribe) {
        this.unsubscribe()
        this.unsubscribe = null
      }
    }
  }

  // State validation
  isValid(): boolean {
    try {
      const messages = this.getState()
      return Array.isArray(messages) && 
        messages.every(msg => 
          msg.id && 
          msg.content && 
          msg.sender && 
          typeof msg.timestamp === 'number'
        )
    } catch {
      return false
    }
  }

  getErrors(): string[] {
    const errors: string[] = []
    try {
      const messages = this.getState()
      
      if (!Array.isArray(messages)) {
        errors.push('Conversation history must be an array')
        return errors
      }
      
      messages.forEach((msg, index) => {
        if (!msg.id) errors.push(`Message at index ${index} missing ID`)
        if (!msg.content) errors.push(`Message at index ${index} missing content`)
        if (!msg.sender) errors.push(`Message at index ${index} missing sender`)
        if (typeof msg.timestamp !== 'number') {
          errors.push(`Message at index ${index} has invalid timestamp`)
        }
      })
      
      if (messages.length > this.MAX_MEMORY_MESSAGES) {
        errors.push(`Too many messages in memory: ${messages.length}/${this.MAX_MEMORY_MESSAGES}`)
      }
    } catch (error) {
      errors.push(`State validation error: ${error}`)
    }
    
    return errors
  }

  // Persistence
  async persist(): Promise<void> {
    // Messages are persisted as part of game state
    await useStore.getState().saveGame()
  }

  async hydrate(): Promise<void> {
    // Messages are hydrated as part of game state
    await useStore.getState().loadGame()
    
    // Check if we need to archive old messages
    const messages = this.getState()
    if (messages.length > this.MAX_MEMORY_MESSAGES) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - 7) // Archive messages older than 7 days
      await this.archiveOldMessages(cutoffDate)
    }
  }

  reset(): void {
    this.clearConversation()
    this.archivedMessages = []
  }

  // Message management
  async sendMessage(content: string): Promise<void> {
    if (!content || content.trim().length === 0) {
      throw new Error('Message content cannot be empty')
    }
    
    // Add user message first
    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      sender: 'user',
      content: content.trim(),
      timestamp: Date.now()
    }
    
    this.addMessage(userMessage)
    
    try {
      // Use APIBridge for AI response instead of store's mock implementation
      const { getAPIBridge } = await import('@services/api')
      const apiBridge = getAPIBridge()
      
      const aiMessage = await apiBridge.sendMessage(content.trim(), {
        skipValidation: true // Already validated above
      })
      
      this.addMessage(aiMessage)
    } catch (error) {
      console.error('Failed to get AI response:', error)
      
      // Add error message
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        sender: 'ai',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: Date.now(),
        emotion: 'confused'
      }
      
      this.addMessage(errorMessage)
      throw error
    }
  }

  addMessage(message: Message): void {
    // Validate message
    if (!message.id || !message.content || !message.sender) {
      throw new Error('Invalid message format')
    }
    
    useStore.getState().addMessage(message)
    
    // Auto-archive if needed
    this.checkMemoryLimit()
  }

  getMessages(page: number = 0, pageSize: number = this.PAGE_SIZE): Message[] {
    const allMessages = [...this.archivedMessages, ...this.getState()]
    const start = page * pageSize
    const end = start + pageSize
    
    return allMessages
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(start, end)
  }

  getTotalMessageCount(): number {
    return this.archivedMessages.length + this.getState().length
  }

  // Conversation flow
  isAIResponding(): boolean {
    return useStore.getState().isLoading
  }

  getLastUserMessage(): Message | null {
    const messages = this.getState()
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === 'user') {
        return messages[i]
      }
    }
    return null
  }

  getLastAIMessage(): Message | null {
    const messages = this.getState()
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === 'ai') {
        return messages[i]
      }
    }
    return null
  }

  // Context
  getCurrentTopic(): string | null {
    const companion = useStore.getState().companion
    return companion?.conversationContext.currentTopic || null
  }

  setCurrentTopic(topic: string): void {
    const companion = useStore.getState().companion
    if (!companion) return
    
    const context = companion.conversationContext
    const recentTopics = [...context.recentTopics]
    
    // Add to recent topics
    if (!recentTopics.includes(topic)) {
      recentTopics.push(topic)
      // Keep last 5 topics
      if (recentTopics.length > 5) {
        recentTopics.shift()
      }
    }
    
    useStore.getState().updateCompanion({
      conversationContext: {
        ...context,
        currentTopic: topic,
        recentTopics
      }
    })
  }

  getConversationContext(): ConversationContext {
    const companion = useStore.getState().companion
    if (!companion) {
      return {
        currentTopic: null,
        recentTopics: [],
        moodHistory: [],
        responseStyle: 'friendly'
      }
    }
    
    return { ...companion.conversationContext }
  }

  // History management
  clearConversation(): void {
    useStore.getState().clearConversation()
  }

  async archiveOldMessages(beforeDate: Date): Promise<void> {
    const messages = this.getState()
    const cutoffTime = beforeDate.getTime()
    
    const toArchive: Message[] = []
    const toKeep: Message[] = []
    
    messages.forEach(msg => {
      if (msg.timestamp < cutoffTime) {
        toArchive.push(msg)
      } else {
        toKeep.push(msg)
      }
    })
    
    if (toArchive.length > 0) {
      // Add to archived messages
      this.archivedMessages = [...this.archivedMessages, ...toArchive]
      
      // Keep only recent archives (last 1000 messages)
      if (this.archivedMessages.length > 1000) {
        this.archivedMessages = this.archivedMessages.slice(-1000)
      }
      
      // Update store with remaining messages
      useStore.setState({ conversationHistory: toKeep })
      
      console.log(`Archived ${toArchive.length} messages`)
    }
  }

  async exportConversation(): Promise<string> {
    const allMessages = [...this.archivedMessages, ...this.getState()]
      .sort((a, b) => a.timestamp - b.timestamp)
    
    const companion = useStore.getState().companion
    const header = `# Conversation with ${companion?.name || 'AI Companion'}\n` +
      `Exported on: ${new Date().toLocaleString()}\n` +
      `Total messages: ${allMessages.length}\n\n---\n\n`
    
    const content = allMessages.map(msg => {
      const time = new Date(msg.timestamp).toLocaleTimeString()
      const sender = msg.sender === 'user' ? 'You' : companion?.name || 'AI'
      const emotion = msg.emotion ? ` (${msg.emotion})` : ''
      return `[${time}] ${sender}${emotion}: ${msg.content}`
    }).join('\n\n')
    
    return header + content
  }

  // Analysis
  getConversationStats(): ConversationStats {
    const messages = [...this.archivedMessages, ...this.getState()]
    const userMessages = messages.filter(m => m.sender === 'user')
    const aiMessages = messages.filter(m => m.sender === 'ai')
    
    // Calculate average response time
    let totalResponseTime = 0
    let responseCount = 0
    
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].sender === 'ai' && messages[i-1].sender === 'user') {
        totalResponseTime += messages[i].timestamp - messages[i-1].timestamp
        responseCount++
      }
    }
    
    const averageResponseTime = responseCount > 0 
      ? totalResponseTime / responseCount 
      : 0
    
    // Extract topics from conversation context
    const companion = useStore.getState().companion
    const topicsDiscussed = companion?.conversationContext.recentTopics || []
    
    return {
      totalMessages: messages.length,
      userMessages: userMessages.length,
      aiMessages: aiMessages.length,
      averageResponseTime: Math.round(averageResponseTime),
      topicsDiscussed: [...topicsDiscussed]
    }
  }

  getSentimentHistory(): SentimentData[] {
    const messages = this.getState().slice(-50) // Last 50 messages
    
    return messages
      .filter(msg => msg.emotion)
      .map(msg => ({
        timestamp: msg.timestamp,
        sentiment: this.emotionToSentiment(msg.emotion!),
        confidence: 0.8 // Mock confidence
      }))
  }

  private emotionToSentiment(emotion: EmotionType): 'positive' | 'neutral' | 'negative' {
    const positiveEmotions: EmotionType[] = ['happy', 'excited', 'content', 'calm']
    const negativeEmotions: EmotionType[] = ['sad', 'anxious', 'confused']
    
    if (positiveEmotions.includes(emotion)) return 'positive'
    if (negativeEmotions.includes(emotion)) return 'negative'
    return 'neutral'
  }

  private checkMemoryLimit(): void {
    const messages = this.getState()
    if (messages.length > this.MAX_MEMORY_MESSAGES) {
      // Archive messages older than 24 hours
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - 1)
      this.archiveOldMessages(cutoffDate)
    }
  }
}

// Singleton instance
let conversationStateAdapter: ConversationStateAdapter | null = null

export const getConversationStateAdapter = (): ConversationStateAdapter => {
  if (!conversationStateAdapter) {
    conversationStateAdapter = new ConversationStateAdapter()
  }
  return conversationStateAdapter
}

// React hook for component usage
export const useConversationStateAdapter = (): ConversationStateAdapter => {
  return getConversationStateAdapter()
}