/**
 * 🚫 Not Found Page - 404 Error Page
 */

import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()
  
  return (
    <div className="min-h-screen bg-dark-navy flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-dark-surface rounded-xl border border-ui-border-100 p-8 text-center max-w-md"
      >
        <div className="text-8xl mb-6">🎮</div>
        <h1 className="text-4xl font-bold text-ui-text-100 mb-4">
          404
        </h1>
        <h2 className="text-xl font-semibold text-ui-text-200 mb-4">
          페이지를 찾을 수 없습니다
        </h2>
        <p className="text-ui-text-300 mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => navigate('/game/conversation')}
            className="flex items-center justify-center space-x-2 w-full btn-neon"
          >
            <Home size={20} />
            <span>게임으로 돌아가기</span>
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center space-x-2 w-full btn-secondary"
          >
            <ArrowLeft size={20} />
            <span>이전 페이지로</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default NotFoundPage