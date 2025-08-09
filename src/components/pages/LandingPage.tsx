/**
 * 🏠 Landing Page - Public Landing Page
 */

import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Play, Users, Heart, Sparkles } from 'lucide-react'

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-navy via-dark-surface to-purple-900/20">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-8">
            <Heart size={48} className="text-white" />
          </div>
          
          <h1 className="text-6xl font-bold text-ui-text-100 mb-6">
            Echo
          </h1>
          
          <p className="text-xl text-ui-text-300 mb-8 max-w-2xl mx-auto">
            AI와 함께하는 감정적 여행. 당신만의 디지털 동반자와 특별한 유대를 쌓아보세요.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/game/conversation')}
              className="flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
            >
              <Play size={20} />
              <span>지금 시작하기</span>
            </button>
            
            <button
              onClick={() => navigate('/auth')}
              className="flex items-center justify-center space-x-2 px-8 py-4 border border-ui-border-200 text-ui-text-100 rounded-lg font-semibold hover:bg-ui-surface-100 transition-all"
            >
              <Users size={20} />
              <span>로그인</span>
            </button>
          </div>
        </motion.div>
        
        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-3 gap-8 mb-16"
        >
          <div className="bg-dark-surface/50 backdrop-blur-sm rounded-xl border border-ui-border-100 p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-full mb-4">
              <Heart size={24} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-ui-text-100 mb-3">
              감정적 교감
            </h3>
            <p className="text-ui-text-300">
              AI와 진정한 감정적 유대를 형성하고 깊은 대화를 나누세요.
            </p>
          </div>
          
          <div className="bg-dark-surface/50 backdrop-blur-sm rounded-xl border border-ui-border-100 p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full mb-4">
              <Sparkles size={24} className="text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-ui-text-100 mb-3">
              개인화된 경험
            </h3>
            <p className="text-ui-text-300">
              당신의 취향과 성격에 맞춘 독특한 AI 동반자를 만나보세요.
            </p>
          </div>
          
          <div className="bg-dark-surface/50 backdrop-blur-sm rounded-xl border border-ui-border-100 p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-full mb-4">
              <Users size={24} className="text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-ui-text-100 mb-3">
              다양한 활동
            </h3>
            <p className="text-ui-text-300">
              대화, 탐험, 게임 등 다양한 활동을 통해 관계를 발전시켜보세요.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default LandingPage