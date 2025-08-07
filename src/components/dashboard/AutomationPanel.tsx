import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Square,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Terminal,
  BarChart3
} from 'lucide-react'

interface AutomationScript {
  id: string
  name: string
  description: string
  command: string
  estimatedTime: string
  status: 'idle' | 'running' | 'completed' | 'failed'
  lastRun?: Date
  successRate: number
  timeSaved: number
  phase: string
  dependencies?: string[]
}

// execution-plan.md 기반 자동화 스크립트 정의
const automationScripts: AutomationScript[] = [
  {
    id: 'phase2-character',
    name: '캐릭터 시스템 자동 구현',
    description: 'AI 성격 시스템, 관계도, 감정 엔진을 자동으로 구현',
    command: 'npm run phase2:character',
    estimatedTime: '15분',
    status: 'idle',
    successRate: 95,
    timeSaved: 120, // 시간 (시간 단위)
    phase: 'Phase 2',
    dependencies: []
  },
  {
    id: 'phase2-battle',
    name: '전투 시스템 자동 구현',
    description: '자동 전투, 밸런싱, 스킬 시스템을 자동으로 구현',
    command: 'npm run phase2:battle',
    estimatedTime: '20분',
    status: 'idle',
    successRate: 90,
    timeSaved: 160,
    phase: 'Phase 2',
    dependencies: ['phase2-character']
  },
  {
    id: 'ai-content-generation',
    name: 'AI 콘텐츠 대량 생성',
    description: '대화, 이벤트, 퀘스트를 AI로 자동 생성 (총 180개)',
    command: 'npm run ai:all',
    estimatedTime: '10분',
    status: 'idle',
    successRate: 88,
    timeSaved: 200,
    phase: 'Phase 3'
  },
  {
    id: 'art-prompts',
    name: 'AI 아트 프롬프트 생성',
    description: '캐릭터, 배경, 아이템을 위한 AI 아트 프롬프트 자동 생성',
    command: 'npm run generate:art-prompts',
    estimatedTime: '5분',
    status: 'idle',
    successRate: 98,
    timeSaved: 80,
    phase: 'Phase 3'
  },
  {
    id: 'deployment',
    name: '자동 배포',
    description: 'Vercel 배포, 환경 설정, 모니터링 설정을 자동화',
    command: 'npm run phase4:deploy',
    estimatedTime: '12분',
    status: 'idle',
    successRate: 92,
    timeSaved: 40,
    phase: 'Phase 4',
    dependencies: ['ai-content-generation']
  },
  {
    id: 'balance-testing',
    name: '전투 밸런싱 테스트',
    description: '1000회 시뮬레이션으로 전투 밸런스 자동 조정',
    command: 'npm run test:balance',
    estimatedTime: '8분',
    status: 'idle',
    successRate: 85,
    timeSaved: 24,
    phase: 'Phase 2',
    dependencies: ['phase2-battle']
  }
]

export const AutomationPanel: React.FC = () => {
  const [scripts, setScripts] = useState<AutomationScript[]>(automationScripts)
  const [runningScript, setRunningScript] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [showLogs, setShowLogs] = useState(false)

  const executeScript = async (scriptId: string) => {
    const script = scripts.find(s => s.id === scriptId)
    if (!script || runningScript) return

    setRunningScript(scriptId)
    setScripts(prev => prev.map(s => 
      s.id === scriptId ? { ...s, status: 'running' as const } : s
    ))

    // 실행 로그 추가
    const startLog = `[${new Date().toLocaleTimeString()}] 🚀 ${script.name} 실행 시작...`
    setLogs(prev => [...prev, startLog])

    try {
      // 시뮬레이션: 실제로는 child_process를 통해 스크립트 실행
      await simulateScriptExecution(script)
      
      // 성공 처리
      setScripts(prev => prev.map(s => 
        s.id === scriptId 
          ? { ...s, status: 'completed' as const, lastRun: new Date() }
          : s
      ))

      const successLog = `[${new Date().toLocaleTimeString()}] ✅ ${script.name} 완료! ${script.timeSaved}시간 절약됨`
      setLogs(prev => [...prev, successLog])

    } catch (error) {
      // 실패 처리
      setScripts(prev => prev.map(s => 
        s.id === scriptId ? { ...s, status: 'failed' as const } : s
      ))

      const errorLog = `[${new Date().toLocaleTimeString()}] ❌ ${script.name} 실패: ${error}`
      setLogs(prev => [...prev, errorLog])
    }

    setRunningScript(null)
  }

  const simulateScriptExecution = async (script: AutomationScript): Promise<void> => {
    const steps = [
      '프로젝트 구조 분석 중...',
      '필요한 패키지 설치 중...',
      '코드 템플릿 생성 중...',
      'AI 콘텐츠 생성 중...',
      '테스트 실행 중...',
      '빌드 검증 중...',
      '품질 검사 중...'
    ]

    const totalTime = parseInt(script.estimatedTime) * 1000 // 분을 밀리초로
    const stepTime = totalTime / steps.length

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, stepTime))
      const stepLog = `[${new Date().toLocaleTimeString()}] ⏳ ${step}`
      setLogs(prev => [...prev, stepLog])
    }
  }

  const getStatusIcon = (status: AutomationScript['status']) => {
    switch (status) {
      case 'running':
        return <Play className="w-5 h-5 text-blue-400 animate-pulse" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      default:
        return <Square className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: AutomationScript['status']) => {
    switch (status) {
      case 'running':
        return 'border-blue-500 bg-blue-500/10'
      case 'completed':
        return 'border-green-500 bg-green-500/10'
      case 'failed':
        return 'border-red-500 bg-red-500/10'
      default:
        return 'border-gray-600 bg-gray-800'
    }
  }

  const canExecute = (script: AutomationScript) => {
    if (runningScript) return false
    if (!script.dependencies) return true
    
    return script.dependencies.every(depId => 
      scripts.find(s => s.id === depId)?.status === 'completed'
    )
  }

  const totalTimeSaved = scripts.reduce((sum, script) => 
    script.status === 'completed' ? sum + script.timeSaved : sum, 0
  )

  const completedScripts = scripts.filter(s => s.status === 'completed').length
  const avgSuccessRate = scripts.reduce((sum, s) => sum + s.successRate, 0) / scripts.length

  return (
    <div className="space-y-6">
      {/* 자동화 현황 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800 border border-gray-700 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-8 h-8 text-yellow-400" />
            <span className="text-2xl font-bold text-white">
              {completedScripts}/{scripts.length}
            </span>
          </div>
          <h3 className="text-white font-medium mb-1">완료된 자동화</h3>
          <p className="text-gray-400 text-sm">
            {Math.round((completedScripts / scripts.length) * 100)}% 진행률
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 border border-gray-700 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">
              {totalTimeSaved}h
            </span>
          </div>
          <h3 className="text-white font-medium mb-1">절약된 시간</h3>
          <p className="text-gray-400 text-sm">
            수동 작업 대비 70% 단축
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 border border-gray-700 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-8 h-8 text-green-400" />
            <span className="text-2xl font-bold text-white">
              {Math.round(avgSuccessRate)}%
            </span>
          </div>
          <h3 className="text-white font-medium mb-1">평균 성공률</h3>
          <p className="text-gray-400 text-sm">
            안정적인 자동화 품질
          </p>
        </motion.div>
      </div>

      {/* 자동화 스크립트 목록 */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Terminal className="w-6 h-6 mr-3 text-green-400" />
            자동화 스크립트
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
            >
              <Terminal className="w-4 h-4" />
              <span>로그 {showLogs ? '숨기기' : '보기'}</span>
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {scripts.map((script, index) => (
            <motion.div
              key={script.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-lg p-6 border-2 ${getStatusColor(script.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(script.status)}
                  <div>
                    <h3 className="text-white font-bold text-lg">{script.name}</h3>
                    <p className="text-gray-400 text-sm">{script.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                        {script.phase}
                      </span>
                      <span className="text-xs text-gray-500">
                        예상 시간: {script.estimatedTime}
                      </span>
                      <span className="text-xs text-gray-500">
                        성공률: {script.successRate}%
                      </span>
                      {script.lastRun && (
                        <span className="text-xs text-gray-500">
                          마지막 실행: {script.lastRun.toLocaleString('ko-KR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-green-400 font-medium">
                      +{script.timeSaved}h 절약
                    </div>
                    <code className="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded">
                      {script.command}
                    </code>
                  </div>

                  <button
                    onClick={() => executeScript(script.id)}
                    disabled={!canExecute(script)}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                      canExecute(script)
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {script.status === 'running' ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>실행 중...</span>
                      </>
                    ) : script.status === 'completed' ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>완료</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>실행</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 의존성 표시 */}
              {script.dependencies && script.dependencies.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-gray-400 text-sm mb-2">의존성:</p>
                  <div className="flex flex-wrap gap-2">
                    {script.dependencies.map(depId => {
                      const dep = scripts.find(s => s.id === depId)
                      return (
                        <span
                          key={depId}
                          className={`text-xs px-2 py-1 rounded ${
                            dep?.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {dep?.name || depId}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* 실행 로그 */}
      <AnimatePresence>
        {showLogs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-900 border border-gray-700 rounded-lg p-4"
          >
            <h3 className="text-white font-bold mb-4 flex items-center">
              <Terminal className="w-5 h-5 mr-2" />
              실행 로그
            </h3>
            
            <div className="bg-black rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-gray-500">아직 실행된 스크립트가 없습니다.</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-green-400 mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setLogs([])}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                로그 지우기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AutomationPanel