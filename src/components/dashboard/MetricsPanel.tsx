import React from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Clock,
  Zap,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Calendar,
  Target
} from 'lucide-react'
import { useProjectProgress, useExecutionPlanAnalysis } from '@hooks/useProjectProgress'

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
  description?: string
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  description
}) => {
  const changeColor = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-gray-400'
  }[changeType]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gray-700 rounded-lg">
          {icon}
        </div>
        {change && (
          <span className={`text-sm font-medium ${changeColor}`}>
            {change}
          </span>
        )}
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
      <p className="text-gray-400 text-sm mb-2">{title}</p>
      
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </motion.div>
  )
}

export const MetricsPanel: React.FC = () => {
  const { metrics, getEstimatedCompletion, getNextRecommendations } = useProjectProgress()
  const analysis = useExecutionPlanAnalysis()

  const estimatedCompletion = getEstimatedCompletion()
  const nextRecommendations = getNextRecommendations()

  return (
    <div className="space-y-8">
      {/* 핵심 지표 */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <BarChart3 className="w-6 h-6 mr-3 text-blue-400" />
          핵심 성과 지표
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="전체 진행률"
            value={`${metrics.overallProgress}%`}
            change="+15%"
            changeType="positive"
            icon={<TrendingUp className="w-6 h-6 text-blue-400" />}
            description="지난주 대비 진행률"
          />
          
          <MetricCard
            title="작업 완료율"
            value={`${metrics.completedTasks}/${metrics.totalTasks}`}
            change={`${Math.round((metrics.completedTasks / metrics.totalTasks) * 100)}%`}
            changeType="positive"
            icon={<CheckCircle className="w-6 h-6 text-green-400" />}
            description="완료된 작업 비율"
          />
          
          <MetricCard
            title="자동화율"
            value={`${Math.round((metrics.automatedTasks / metrics.totalTasks) * 100)}%`}
            change="+8%"
            changeType="positive"
            icon={<Zap className="w-6 h-6 text-yellow-400" />}
            description="자동화된 작업 비율"
          />
          
          <MetricCard
            title="시간 효율성"
            value={`${metrics.efficiency}%`}
            change="+12%"
            changeType="positive"
            icon={<Clock className="w-6 h-6 text-purple-400" />}
            description="예상 시간 대비 절약"
          />
        </div>
      </div>

      {/* 시간 분석 */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Calendar className="w-6 h-6 mr-3 text-green-400" />
          시간 분석
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">시간 사용 현황</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">예상 총 시간</span>
                <span className="text-white font-medium">{metrics.estimatedHours}h</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">실제 소요 시간</span>
                <span className="text-white font-medium">{metrics.actualHours}h</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-green-400">절약된 시간</span>
                <span className="text-green-400 font-medium">+{metrics.timesSaved}h</span>
              </div>
              
              <div className="pt-4 border-t border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-purple-400 font-medium">효율성</span>
                  <span className="text-purple-400 font-bold">{metrics.efficiency}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">완료 예상</h3>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {estimatedCompletion.toLocaleDateString('ko-KR', {
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
              
              <p className="text-gray-400 text-sm mb-4">
                {estimatedCompletion.toLocaleDateString('ko-KR', {
                  weekday: 'long'
                })}
              </p>
              
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-md p-3">
                <p className="text-blue-400 text-sm">
                  원래 계획보다 <strong>4주 빠른</strong> 완료 예정
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Phase별 효율성</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Phase 1</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                    <div className="bg-green-500 h-full rounded-full w-full" />
                  </div>
                  <span className="text-green-400 text-sm">125%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Phase 2</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                    <div className="bg-yellow-500 h-full rounded-full w-3/4" />
                  </div>
                  <span className="text-yellow-400 text-sm">예상 400%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Phase 3</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                    <div className="bg-purple-500 h-full rounded-full w-4/5" />
                  </div>
                  <span className="text-purple-400 text-sm">예상 600%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Phase 4</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                    <div className="bg-blue-500 h-full rounded-full w-4/5" />
                  </div>
                  <span className="text-blue-400 text-sm">예상 500%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 위험 요소 & 기회 */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <AlertTriangle className="w-6 h-6 mr-3 text-orange-400" />
          위험 분석 & 기회
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 위험 요소 */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-400" />
              위험 요소
            </h3>
            
            <div className="space-y-3">
              {analysis.risks?.map((risk: string, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">{risk}</p>
                </div>
              )) || [
                <div key="1" className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">외부 API 의존성 (Claude, Supabase)</p>
                </div>,
                <div key="2" className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">자동화 스크립트 안정성</p>
                </div>
              ]}
            </div>
          </div>
          
          {/* 기회 요소 */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-green-400" />
              개선 기회
            </h3>
            
            <div className="space-y-3">
              {analysis.opportunities?.map((opportunity: string, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">{opportunity}</p>
                </div>
              )) || [
                <div key="1" className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">CI/CD 파이프라인 구축</p>
                </div>,
                <div key="2" className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">실시간 모니터링 대시보드</p>
                </div>
              ]}
            </div>
          </div>
        </div>
      </div>

      {/* 다음 액션 아이템 */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-blue-400" />
          추천 다음 액션
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-400 mb-3">즉시 실행 가능</h4>
            <div className="space-y-2">
              {nextRecommendations.map((rec, index) => (
                <div key={index} className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  <code className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">
                    {rec}
                  </code>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-purple-400 mb-3">예상 효과</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <div>• Phase 2 완료 시간: 4주 → 1주</div>
              <div>• 전체 개발 시간: 70% 단축</div>
              <div>• 품질: 자동화된 테스트로 향상</div>
              <div>• 비용: API 사용량 최적화</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MetricsPanel