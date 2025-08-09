/**
 * 🗺️ Exploration Screen - World Exploration Interface
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Map } from 'lucide-react'
import { useGameMode } from '@components/ui/GameUI/GameModeRouter'

interface ExplorationScreenProps {
  enhanced?: boolean
}

const ExplorationScreen: React.FC<ExplorationScreenProps> = ({ enhanced = false }) => {
  const { currentMode } = useGameMode()
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-gradient-to-br from-dark-navy to-green-900/20 p-4"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
            <Map size={32} className="text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-ui-text-100 mb-2">
            탐험 모드 {enhanced && '(Enhanced)'}
          </h1>
          <p className="text-ui-text-300">
            새로운 장소를 탐험해보세요
          </p>
        </div>
        
        <div className="bg-dark-surface/50 backdrop-blur-sm rounded-xl border border-ui-border-100 p-8">
          <div className="text-center text-ui-text-300">
            <p className="mb-4">현재 모드: {currentMode}</p>
            <p>탐험 인터페이스가 여기에 구현됩니다.</p>
            {enhanced && (
              <p className="mt-2 text-green-400">고급 탐험 기능이 활성화되었습니다.</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ExplorationScreen