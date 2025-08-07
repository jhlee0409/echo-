import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  Clock, 
  Play, 
  AlertCircle,
  TrendingUp,
  Zap,
  Target
} from 'lucide-react'

interface PhaseProgress {
  id: string
  name: string
  description: string
  weeks: string
  status: 'completed' | 'in-progress' | 'pending' | 'blocked'
  progress: number
  tasks: TaskItem[]
  automation: {
    enabled: boolean
    script?: string
    estimatedTime: string
  }
}

interface TaskItem {
  id: string
  name: string
  status: 'completed' | 'in-progress' | 'pending'
  importance: 'high' | 'medium' | 'low'
  estimatedHours: number
  actualHours?: number
  automation?: boolean
}

// execution-plan.md 기반 진행 상황 데이터
const projectPhases: PhaseProgress[] = [
  {
    id: 'phase1',
    name: 'Phase 1: 프로토타입',
    description: 'AI 대화 시스템, 인증, 기본 구조',
    weeks: '2주 (Week 1-2)',
    status: 'completed',
    progress: 100,
    automation: {
      enabled: true,
      estimatedTime: '자동화로 1주 단축'
    },
    tasks: [
      {
        id: 'p1-setup',
        name: '프로젝트 셋업 (React + Vite + TypeScript)',
        status: 'completed',
        importance: 'high',
        estimatedHours: 8,
        actualHours: 6,
        automation: true
      },
      {
        id: 'p1-auth',
        name: 'AI 대화 시스템 (Claude API)',
        status: 'completed',
        importance: 'high',
        estimatedHours: 16,
        actualHours: 12,
        automation: true
      },
      {
        id: 'p1-components',
        name: '기본 컴포넌트 (Chat, Character, Menu)',
        status: 'completed',
        importance: 'high',
        estimatedHours: 12,
        actualHours: 10
      },
      {
        id: 'p1-auth-system',
        name: '인증 시스템 (Supabase + JWT)',
        status: 'completed',
        importance: 'high',
        estimatedHours: 20,
        actualHours: 16,
        automation: true
      },
      {
        id: 'p1-testing',
        name: '테스트 인프라 구축',
        status: 'completed',
        importance: 'medium',
        estimatedHours: 8,
        actualHours: 6
      }
    ]
  },
  {
    id: 'phase2',
    name: 'Phase 2: 핵심 게임플레이',
    description: '캐릭터 시스템, 자동 전투, 관계도',
    weeks: '4주 (Week 3-6)',
    status: 'pending',
    progress: 0,
    automation: {
      enabled: true,
      script: 'npm run phase2:character && npm run phase2:battle',
      estimatedTime: '4주 → 1주 (75% 단축)'
    },
    tasks: [
      {
        id: 'p2-character',
        name: 'AI 캐릭터 시스템 (성격, 감정)',
        status: 'pending',
        importance: 'high',
        estimatedHours: 24,
        automation: true
      },
      {
        id: 'p2-relationship',
        name: '관계도 시스템 (친밀도, 기억)',
        status: 'pending',
        importance: 'high',
        estimatedHours: 20,
        automation: true
      },
      {
        id: 'p2-inventory',
        name: '인벤토리 시스템',
        status: 'pending',
        importance: 'medium',
        estimatedHours: 16
      },
      {
        id: 'p2-battle',
        name: '자동 전투 시스템',
        status: 'pending',
        importance: 'high',
        estimatedHours: 32,
        automation: true
      },
      {
        id: 'p2-balance',
        name: '전투 밸런싱',
        status: 'pending',
        importance: 'medium',
        estimatedHours: 12,
        automation: true
      }
    ]
  },
  {
    id: 'phase3',
    name: 'Phase 3: 콘텐츠 제작',
    description: '스토리, 대화, 아트 에셋 생성',
    weeks: '3주 (Week 7-9)',
    status: 'pending',
    progress: 0,
    automation: {
      enabled: true,
      script: 'npm run phase3:content',
      estimatedTime: '3주 → 3일 (85% 단축)'
    },
    tasks: [
      {
        id: 'p3-conversations',
        name: 'AI 대화 콘텐츠 생성 (100개)',
        status: 'pending',
        importance: 'high',
        estimatedHours: 40,
        automation: true
      },
      {
        id: 'p3-events',
        name: '이벤트 스토리 (50개)',
        status: 'pending',
        importance: 'high',
        estimatedHours: 32,
        automation: true
      },
      {
        id: 'p3-quests',
        name: '퀘스트 시스템 (30개)',
        status: 'pending',
        importance: 'medium',
        estimatedHours: 24,
        automation: true
      },
      {
        id: 'p3-art',
        name: 'AI 아트 생성 (캐릭터, 배경)',
        status: 'pending',
        importance: 'medium',
        estimatedHours: 60,
        automation: true
      }
    ]
  },
  {
    id: 'phase4',
    name: 'Phase 4: 배포 & 최적화',
    description: 'Vercel 배포, 성능 최적화',
    weeks: '1주 (Week 10)',
    status: 'pending',
    progress: 25, // 일부 빌드 설정 완료
    automation: {
      enabled: true,
      script: 'npm run phase4:deploy',
      estimatedTime: '1주 → 1일 (85% 단축)'
    },
    tasks: [
      {
        id: 'p4-build',
        name: '프로덕션 빌드 최적화',
        status: 'completed',
        importance: 'high',
        estimatedHours: 8,
        actualHours: 6
      },
      {
        id: 'p4-env',
        name: '환경 변수 설정',
        status: 'pending',
        importance: 'high',
        estimatedHours: 4
      },
      {
        id: 'p4-vercel',
        name: 'Vercel 배포 설정',
        status: 'pending',
        importance: 'high',
        estimatedHours: 6,
        automation: true
      },
      {
        id: 'p4-monitoring',
        name: '모니터링 & 분석 설정',
        status: 'pending',
        importance: 'medium',
        estimatedHours: 4
      }
    ]
  }
]

export const ProgressDashboard: React.FC = () => {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    automatedTasks: 0,
    totalHours: 0,
    savedHours: 0
  })

  useEffect(() => {
    // 통계 계산
    const totalTasks = projectPhases.reduce((sum, phase) => sum + phase.tasks.length, 0)
    const completedTasks = projectPhases.reduce(
      (sum, phase) => sum + phase.tasks.filter(t => t.status === 'completed').length,
      0
    )
    const inProgressTasks = projectPhases.reduce(
      (sum, phase) => sum + phase.tasks.filter(t => t.status === 'in-progress').length,
      0
    )
    const automatedTasks = projectPhases.reduce(
      (sum, phase) => sum + phase.tasks.filter(t => t.automation).length,
      0
    )
    const totalHours = projectPhases.reduce(
      (sum, phase) => sum + phase.tasks.reduce((taskSum, task) => taskSum + task.estimatedHours, 0),
      0
    )
    const savedHours = Math.floor(totalHours * 0.7) // 70% 시간 절약 추정

    setStats({
      totalTasks,
      completedTasks,
      inProgressTasks,
      automatedTasks,
      totalHours,
      savedHours
    })
  }, [])

  const overallProgress = Math.round(
    projectPhases.reduce((sum, phase) => sum + phase.progress, 0) / projectPhases.length
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'in-progress':
        return <Play className="w-5 h-5 text-blue-400" />
      case 'blocked':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-500/10'
      case 'in-progress':
        return 'border-blue-500 bg-blue-500/10'
      case 'blocked':
        return 'border-red-500 bg-red-500/10'
      default:
        return 'border-gray-600 bg-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            🎮 소울메이트 개발 진행률 대시보드
          </h1>
          <p className="text-gray-400">
            execution-plan.md 기반 실시간 프로젝트 진행 상황
          </p>
        </motion.div>

        {/* 전체 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">전체 진행률</p>
                <p className="text-3xl font-bold text-white">{overallProgress}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
            <div className="mt-4 bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 1 }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">완료된 작업</p>
                <p className="text-3xl font-bold text-white">
                  {stats.completedTasks}/{stats.totalTasks}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-sm text-gray-400 mt-2">
              성공률 {Math.round((stats.completedTasks / stats.totalTasks) * 100)}%
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">자동화된 작업</p>
                <p className="text-3xl font-bold text-white">
                  {stats.automatedTasks}
                </p>
              </div>
              <Zap className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-sm text-gray-400 mt-2">
              자동화율 {Math.round((stats.automatedTasks / stats.totalTasks) * 100)}%
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">시간 절약</p>
                <p className="text-3xl font-bold text-white">
                  {stats.savedHours}h
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-sm text-gray-400 mt-2">
              원래 {stats.totalHours}시간 → {stats.totalHours - stats.savedHours}시간
            </p>
          </motion.div>
        </div>

        {/* Phase별 진행 상황 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projectPhases.map((phase, index) => (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-lg p-6 border-2 cursor-pointer transition-all ${getStatusColor(
                phase.status
              )} hover:scale-[1.02]`}
              onClick={() => setSelectedPhase(selectedPhase === phase.id ? null : phase.id)}
            >
              {/* Phase 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(phase.status)}
                  <div>
                    <h3 className="text-xl font-bold text-white">{phase.name}</h3>
                    <p className="text-gray-400 text-sm">{phase.weeks}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{phase.progress}%</div>
                  {phase.automation.enabled && (
                    <div className="text-xs text-yellow-400 flex items-center">
                      <Zap className="w-3 h-3 mr-1" />
                      자동화
                    </div>
                  )}
                </div>
              </div>

              {/* 진행률 바 */}
              <div className="mb-4">
                <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${phase.progress}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className={`h-full ${
                      phase.status === 'completed'
                        ? 'bg-gradient-to-r from-green-500 to-green-400'
                        : phase.status === 'in-progress'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-400'
                        : 'bg-gradient-to-r from-gray-500 to-gray-400'
                    }`}
                  />
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-3">{phase.description}</p>

              {/* 자동화 정보 */}
              {phase.automation.enabled && (
                <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-md p-3 mb-3">
                  <div className="flex items-center text-yellow-400 text-sm">
                    <Zap className="w-4 h-4 mr-2" />
                    <span className="font-medium">자동화 활성화</span>
                  </div>
                  <p className="text-yellow-300 text-xs mt-1">
                    {phase.automation.estimatedTime}
                  </p>
                  {phase.automation.script && (
                    <code className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded mt-1 block">
                      {phase.automation.script}
                    </code>
                  )}
                </div>
              )}

              {/* Task 요약 */}
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-400">
                  {phase.tasks.filter((t) => t.status === 'completed').length}/
                  {phase.tasks.length} 작업 완료
                </div>
                <div className="text-gray-400">
                  {phase.tasks.reduce((sum, task) => sum + task.estimatedHours, 0)}시간 예상
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 선택된 Phase의 세부 내용 */}
        <AnimatePresence>
          {selectedPhase && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 bg-gray-800 rounded-lg p-6 border border-gray-700"
            >
              {(() => {
                const phase = projectPhases.find((p) => p.id === selectedPhase)
                if (!phase) return null

                return (
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-6">
                      {phase.name} - 세부 작업
                    </h3>
                    
                    <div className="grid gap-4">
                      {phase.tasks.map((task, index) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            {getStatusIcon(task.status)}
                            <div>
                              <h4 className="text-white font-medium">{task.name}</h4>
                              <div className="flex items-center space-x-4 mt-1">
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    task.importance === 'high'
                                      ? 'bg-red-500/20 text-red-400'
                                      : task.importance === 'medium'
                                      ? 'bg-yellow-500/20 text-yellow-400'
                                      : 'bg-gray-500/20 text-gray-400'
                                  }`}
                                >
                                  {task.importance === 'high'
                                    ? '높음'
                                    : task.importance === 'medium'
                                    ? '보통'
                                    : '낮음'}
                                </span>
                                {task.automation && (
                                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded flex items-center">
                                    <Zap className="w-3 h-3 mr-1" />
                                    자동화
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-medium">
                              {task.actualHours || task.estimatedHours}시간
                            </div>
                            {task.actualHours && (
                              <div className="text-xs text-green-400">
                                {task.estimatedHours - task.actualHours > 0
                                  ? `${task.estimatedHours - task.actualHours}시간 절약`
                                  : '예상 시간 내 완료'}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 다음 액션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Target className="w-6 h-6 mr-2 text-blue-400" />
            다음 단계 추천
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-400 mb-2">즉시 실행 가능</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <div>• npm run phase2:character - 캐릭터 시스템 자동 구현</div>
                <div>• npm run monitor:watch - 실시간 진행 모니터링</div>
                <div>• npm run ai:all - AI 콘텐츠 대량 생성</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-purple-400 mb-2">예상 효과</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <div>• Phase 2 완료: 4주 → 1주 (75% 단축)</div>
                <div>• 전체 개발: 10주 → 3주 (70% 단축)</div>
                <div>• 품질 향상: 자동화된 테스트 & 밸런싱</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ProgressDashboard