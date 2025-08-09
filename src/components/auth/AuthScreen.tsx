/**
 * 🔐 Auth Screen - Authentication Interface
 */

import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'

const AuthScreen: React.FC = () => {
  const navigate = useNavigate()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-navy to-blue-900/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-dark-surface/80 backdrop-blur-sm rounded-xl border border-ui-border-100 p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
            <Shield size={32} className="text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-ui-text-100 mb-2">
            인증
          </h1>
          <p className="text-ui-text-300">
            계정에 로그인하세요
          </p>
        </div>
        
        <div className="space-y-4 mb-8">
          <div className="text-center text-ui-text-300">
            <p>인증 시스템이 여기에 구현됩니다.</p>
            <p className="text-sm mt-2 text-ui-text-400">
              현재는 개발 모드입니다.
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => navigate('/game/conversation')}
            className="w-full btn-neon"
          >
            게스트로 계속하기
          </button>
          
          <button
            onClick={() => navigate('/landing')}
            className="flex items-center justify-center space-x-2 w-full btn-secondary"
          >
            <ArrowLeft size={20} />
            <span>돌아가기</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default AuthScreen