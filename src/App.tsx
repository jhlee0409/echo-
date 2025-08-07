import { useEffect } from 'react'
import { useGameStore } from '@hooks'
import { GameScreen, LoadingScreen, ErrorBoundary } from '@components'

function App() {
  const { isInitialized, error, initialize } = useGameStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (error) {
    return (
      <div className="min-h-screen bg-dark-navy flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">
            초기화 오류 / Initialization Error
          </h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={initialize}
            className="btn-neon"
          >
            다시 시도 / Retry
          </button>
        </div>
      </div>
    )
  }

  if (!isInitialized) {
    return <LoadingScreen />
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-dark-navy text-ui-text-50">
        <GameScreen />
      </div>
    </ErrorBoundary>
  )
}

export default App