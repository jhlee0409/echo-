/**
 * Example component demonstrating State Adapter usage
 * Shows how to use the new adapter pattern instead of direct store access
 */

import React, { useEffect, useState } from 'react'
import { 
  useGameStateAdapter,
  useCharacterStateAdapter,
  useConversationStateAdapter,
  useSettingsStateAdapter 
} from '@store/adapters'

export const StateAdapterExample: React.FC = () => {
  const game = useGameStateAdapter()
  const character = useCharacterStateAdapter()
  const conversation = useConversationStateAdapter()
  const settings = useSettingsStateAdapter()
  
  const [message, setMessage] = useState('')
  const [stats, setStats] = useState(game.getStatistics())

  useEffect(() => {
    // Subscribe to game state changes
    const unsubscribe = game.subscribe((state) => {
      setStats(game.getStatistics())
    })
    
    return unsubscribe
  }, [game])

  const handleSendMessage = async () => {
    if (!message.trim()) return
    
    try {
      // Send message through conversation adapter
      await conversation.sendMessage(message)
      setMessage('')
      
      // Award experience for conversation
      game.addExperience(10)
      
      // Update character emotion based on message sentiment
      if (message.includes('happy') || message.includes('좋아')) {
        character.updateEmotion('happy', 0.8)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleLevelUp = () => {
    if (game.canLevelUp()) {
      game.levelUp()
      character.addRelationshipMilestone(`reached_level_${game.getLevel()}`)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">State Adapter Example</h2>
      
      {/* Game Stats */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Game Statistics</h3>
        <ul className="space-y-1 text-sm">
          <li>Level: {game.getLevel()}</li>
          <li>Experience: {game.getExperience()}</li>
          <li>Completion: {stats.completionPercentage}%</li>
          <li>Play Time: {Math.floor(stats.totalPlayTime / 60)} minutes</li>
          <li>Conversations: {stats.conversationCount}</li>
        </ul>
        
        {game.canLevelUp() && (
          <button
            onClick={handleLevelUp}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Level Up!
          </button>
        )}
      </div>

      {/* Character Info */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Character: {character.getCharacterName()}</h3>
        <ul className="space-y-1 text-sm">
          <li>Emotion: {character.getCurrentEmotion()} ({Math.round(character.getEmotionIntensity() * 100)}%)</li>
          <li>Intimacy: {Math.round(character.getIntimacyLevel() * 100)}%</li>
          <li>Trust: {Math.round(character.getTrustLevel() * 100)}%</li>
        </ul>
        
        <div className="mt-2 space-x-2">
          <button
            onClick={() => character.updateEmotion('happy', 0.9)}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm"
          >
            Make Happy
          </button>
          <button
            onClick={() => character.updateEmotion('curious', 0.7)}
            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm"
          >
            Make Curious
          </button>
        </div>
      </div>

      {/* Conversation */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Conversation</h3>
        <div className="mb-2 text-sm">
          <p>Total Messages: {conversation.getTotalMessageCount()}</p>
          <p>AI Responding: {conversation.isAIResponding() ? 'Yes' : 'No'}</p>
        </div>
        
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded"
            disabled={conversation.isAIResponding()}
          />
          <button
            onClick={handleSendMessage}
            disabled={conversation.isAIResponding() || !message.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Settings</h3>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.isDarkMode()}
              onChange={() => settings.toggleDarkMode()}
            />
            <span>Dark Mode</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.isSoundEnabled()}
              onChange={() => settings.toggleSound()}
            />
            <span>Sound Effects</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.areAnimationsEnabled()}
              onChange={() => settings.toggleAnimations()}
            />
            <span>Animations</span>
          </label>
          
          <div className="mt-2">
            <label className="block text-sm">Language:</label>
            <select
              value={settings.getLanguage()}
              onChange={(e) => settings.setLanguage(e.target.value)}
              className="mt-1 px-3 py-1 border rounded"
            >
              {settings.getSupportedLanguages().map(lang => (
                <option key={lang} value={lang}>
                  {lang === 'ko' ? '한국어' : 
                   lang === 'en' ? 'English' : 
                   lang === 'ja' ? '日本語' : 
                   lang === 'zh' ? '中文' : lang}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* State Validation */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">State Validation</h3>
        <ul className="space-y-1 text-sm">
          <li>Game State Valid: {game.isValid() ? '✅' : '❌'}</li>
          <li>Character State Valid: {character.isValid() ? '✅' : '❌'}</li>
          <li>Conversation State Valid: {conversation.isValid() ? '✅' : '❌'}</li>
          <li>Settings Valid: {settings.isValid() ? '✅' : '❌'}</li>
        </ul>
        
        {(!game.isValid() || !character.isValid()) && (
          <div className="mt-2 text-red-600 text-sm">
            <p>Errors:</p>
            <ul className="list-disc list-inside">
              {[...game.getErrors(), ...character.getErrors()].map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default StateAdapterExample