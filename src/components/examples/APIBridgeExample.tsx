/**
 * API Bridge Integration Example
 * 
 * Demonstrates how to use the API Bridge with state adapters
 * Shows real API communication vs mock mode
 */

import React, { useState, useEffect } from 'react'
import { 
  useAPIBridge,
  useConversationStateAdapter,
  useGameStateAdapter,
  useCharacterStateAdapter 
} from '@hooks'
import type { WSMessage } from '@services/api/types'
import { useWebSocket } from '@services/api'

export const APIBridgeExample: React.FC = () => {
  const apiBridge = useAPIBridge()
  const conversation = useConversationStateAdapter()
  const game = useGameStateAdapter()
  const character = useCharacterStateAdapter()
  
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [recommendations, setRecommendations] = useState<any>(null)
  const [wsMessages, setWsMessages] = useState<WSMessage[]>([])

  // WebSocket integration
  const { send: sendWS, onMessage, connectionState } = useWebSocket()

  useEffect(() => {
    // Listen for WebSocket messages
    const unsubscribe = onMessage((message) => {
      setWsMessages(prev => [...prev.slice(-9), message])
      
      if (message.type === 'message' && message.data) {
        // Handle real-time messages
        console.log('Real-time message:', message.data)
      }
    })
    
    return unsubscribe
  }, [onMessage])

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return

    setIsLoading(true)
    try {
      // Send message through conversation adapter (which uses API Bridge)
      await conversation.sendMessage(message.trim())
      setMessage('')

      // Send WebSocket notification
      sendWS({
        type: 'message',
        data: { content: message.trim() },
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveGame = async () => {
    setSaveStatus('saving')
    try {
      await game.saveGame()
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Save failed:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleGetRecommendations = async () => {
    try {
      const recs = await apiBridge.getContentRecommendations()
      setRecommendations(recs)
    } catch (error) {
      console.error('Failed to get recommendations:', error)
    }
  }

  const recentMessages = conversation.getMessages(0, 5)
  const characterName = character.getCharacterName()
  const currentEmotion = character.getCurrentEmotion()

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold">API Bridge Integration</h2>

      {/* Connection Status */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Connection Status</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionState.connected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span>WebSocket: {connectionState.connected ? 'Connected' : 'Disconnected'}</span>
            {connectionState.latency > 0 && (
              <span className="text-gray-500">({connectionState.latency}ms)</span>
            )}
          </div>
          {connectionState.lastError && (
            <p className="text-red-600">Error: {connectionState.lastError}</p>
          )}
        </div>
      </div>

      {/* Conversation Interface */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">
          Conversation with {characterName} ({currentEmotion})
        </h3>
        
        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
          {recentMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  msg.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                {msg.emotion && (
                  <span className="text-xs opacity-70">({msg.emotion})</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded-lg"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      {/* Game Management */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Game Management</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSaveGame}
            disabled={saveStatus === 'saving'}
            className={`px-4 py-2 rounded-lg ${
              saveStatus === 'saved' ? 'bg-green-500' :
              saveStatus === 'error' ? 'bg-red-500' :
              'bg-purple-500 hover:bg-purple-600'
            } text-white disabled:opacity-50`}
          >
            {saveStatus === 'saving' ? 'Saving...' :
             saveStatus === 'saved' ? 'Saved!' :
             saveStatus === 'error' ? 'Error!' :
             'Save Game'}
          </button>
          
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Level {game.getLevel()} | {game.getExperience()} XP
          </span>
        </div>
      </div>

      {/* Content Recommendations */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Content Recommendations</h3>
          <button
            onClick={handleGetRecommendations}
            className="px-3 py-1 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600"
          >
            Get Recommendations
          </button>
        </div>
        
        {recommendations && (
          <div className="space-y-3 text-sm">
            <div>
              <strong>Suggested Topics:</strong>
              <ul className="list-disc list-inside ml-2 text-gray-600 dark:text-gray-400">
                {recommendations.topics.map((topic: string, i: number) => (
                  <li key={i}>{topic}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <strong>Recommended Activities:</strong>
              <ul className="list-disc list-inside ml-2 text-gray-600 dark:text-gray-400">
                {recommendations.activities.map((activity: string, i: number) => (
                  <li key={i}>{activity}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <strong>Emotional Tone:</strong>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {recommendations.emotionalTone}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* WebSocket Messages */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">WebSocket Messages</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {wsMessages.length === 0 ? (
            <p className="text-gray-500 text-sm">No messages yet</p>
          ) : (
            wsMessages.map((msg, i) => (
              <div key={i} className="text-xs font-mono bg-white dark:bg-gray-700 p-2 rounded">
                <span className="text-blue-600 dark:text-blue-400">{msg.type}</span>
                {msg.data && <span className="ml-2">: {JSON.stringify(msg.data)}</span>}
                <span className="float-right text-gray-500">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* API Health Check */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">API Health</h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>API Bridge initialized with mock mode for development</p>
          <p>Real-time features connected via WebSocket</p>
          <p>State adapters integrated with API layer</p>
        </div>
      </div>
    </div>
  )
}

export default APIBridgeExample