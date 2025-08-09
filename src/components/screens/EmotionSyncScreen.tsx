/**
 * 💗 Emotion Sync Screen - Emotional Connection Interface
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useGameMode } from '@components/ui/GameUI/GameModeRouter'

const EmotionSyncScreen: React.FC = () => {
  const { currentMode } = useGameMode()
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-gradient-to-br from-dark-navy to-pink-900/20 p-4"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-500/20 rounded-full mb-4">
            <Heart size={32} className="text-pink-400" />
          </div>
          <h1 className="text-3xl font-bold text-ui-text-100 mb-2">
            감정 교감 모드
          </h1>
          <p className="text-ui-text-300">
            깊은 감정적 유대를 쌓아보세요
          </p>
        </div>
        
        <div className="bg-dark-surface/50 backdrop-blur-sm rounded-xl border border-ui-border-100 p-8">
          <div className="text-center text-ui-text-300">
            <p className="mb-4">현재 모드: {currentMode}</p>
            <p>감정 교감 인터페이스가 여기에 구현됩니다.</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default EmotionSyncScreen