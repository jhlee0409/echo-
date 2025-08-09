/**
 * 👤 Profile Page - User Profile Interface
 */

import React from 'react'
import { motion } from 'framer-motion'
import { User, Settings, Award, Heart } from 'lucide-react'

const ProfilePage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-gradient-to-br from-dark-navy to-purple-900/20 p-4"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
            <User size={32} className="text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-ui-text-100 mb-2">
            프로필
          </h1>
          <p className="text-ui-text-300">
            당신의 게임 진행 상황과 설정을 확인하세요
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-dark-surface/50 backdrop-blur-sm rounded-xl border border-ui-border-100 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <User size={24} className="text-blue-400" />
              <h3 className="text-xl font-semibold text-ui-text-100">
                기본 정보
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-ui-text-400">닉네임</label>
                <p className="text-ui-text-200">사용자</p>
              </div>
              <div>
                <label className="text-sm text-ui-text-400">가입일</label>
                <p className="text-ui-text-200">2024년 1월</p>
              </div>
            </div>
          </div>
          
          <div className="bg-dark-surface/50 backdrop-blur-sm rounded-xl border border-ui-border-100 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Award size={24} className="text-yellow-400" />
              <h3 className="text-xl font-semibold text-ui-text-100">
                성취
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-ui-text-300">첫 대화</span>
                <span className="text-green-400">완료</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ui-text-300">친밀도 레벨 2</span>
                <span className="text-yellow-400">진행중</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ProfilePage