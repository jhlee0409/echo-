/**
 * ⚙️ Settings Page - Application Settings
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Settings, Volume2, Monitor, Shield } from 'lucide-react'

const SettingsPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-gradient-to-br from-dark-navy to-gray-900/20 p-4"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-500/20 rounded-full mb-4">
            <Settings size={32} className="text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-ui-text-100 mb-2">
            설정
          </h1>
          <p className="text-ui-text-300">
            앱 설정을 조정하세요
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="bg-dark-surface/50 backdrop-blur-sm rounded-xl border border-ui-border-100 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Volume2 size={24} className="text-blue-400" />
              <h3 className="text-xl font-semibold text-ui-text-100">
                오디오
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-ui-text-300">음성 효과</span>
                <button className="w-12 h-6 bg-blue-500 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ui-text-300">배경 음악</span>
                <button className="w-12 h-6 bg-gray-600 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-dark-surface/50 backdrop-blur-sm rounded-xl border border-ui-border-100 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Monitor size={24} className="text-green-400" />
              <h3 className="text-xl font-semibold text-ui-text-100">
                디스플레이
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-ui-text-300">다크 모드</span>
                <button className="w-12 h-6 bg-blue-500 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ui-text-300">애니메이션 효과</span>
                <button className="w-12 h-6 bg-blue-500 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-dark-surface/50 backdrop-blur-sm rounded-xl border border-ui-border-100 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield size={24} className="text-red-400" />
              <h3 className="text-xl font-semibold text-ui-text-100">
                개인정보
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-ui-text-300">데이터 수집</span>
                <button className="w-12 h-6 bg-gray-600 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ui-text-300">개인화</span>
                <button className="w-12 h-6 bg-blue-500 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default SettingsPage