/**
 * ⚙️ Admin Panel - Administrative Interface
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Flag, Users, BarChart3 } from 'lucide-react'

const AdminPanel: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-navy p-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-ui-text-100 mb-2">
            관리자 패널
          </h1>
          <p className="text-ui-text-300">
            시스템 관리 및 모니터링
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-dark-surface rounded-xl border border-ui-border-100 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Flag size={24} className="text-blue-400" />
              <h3 className="text-xl font-semibold text-ui-text-100">
                Feature Flags
              </h3>
            </div>
            <p className="text-ui-text-300 mb-4">
              기능 플래그 관리 및 A/B 테스트
            </p>
            <button className="btn-neon w-full">
              관리하기
            </button>
          </div>
          
          <div className="bg-dark-surface rounded-xl border border-ui-border-100 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users size={24} className="text-green-400" />
              <h3 className="text-xl font-semibold text-ui-text-100">
                사용자 관리
              </h3>
            </div>
            <p className="text-ui-text-300 mb-4">
              사용자 계정 및 권한 관리
            </p>
            <button className="btn-secondary w-full">
              관리하기
            </button>
          </div>
          
          <div className="bg-dark-surface rounded-xl border border-ui-border-100 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <BarChart3 size={24} className="text-purple-400" />
              <h3 className="text-xl font-semibold text-ui-text-100">
                Analytics
              </h3>
            </div>
            <p className="text-ui-text-300 mb-4">
              사용자 분석 및 통계
            </p>
            <button className="btn-secondary w-full">
              보기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel