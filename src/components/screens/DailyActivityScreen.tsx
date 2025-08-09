/**
 * 📅 Daily Activity Screen - Life Simulation Interface
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { useGameMode } from '@components/ui/GameUI/GameModeRouter'

const DailyActivityScreen: React.FC = () => {
  const { currentMode } = useGameMode()
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-gradient-to-br from-dark-navy to-yellow-900/20 p-4"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-full mb-4">
            <Calendar size={32} className="text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold text-ui-text-100 mb-2">
            일상 활동 모드
          </h1>
          <p className="text-ui-text-300">
            일상 활동을 함께해보세요
          </p>
        </div>
        
        <div className="bg-dark-surface/50 backdrop-blur-sm rounded-xl border border-ui-border-100 p-8">
          <div className="text-center text-ui-text-300">
            <p className="mb-4">현재 모드: {currentMode}</p>
            <p>일상 활동 인터페이스가 여기에 구현됩니다.</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default DailyActivityScreen