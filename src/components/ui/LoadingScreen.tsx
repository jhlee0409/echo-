import { FC } from 'react'

interface LoadingScreenProps {
  message?: string
}

const LoadingScreen: FC<LoadingScreenProps> = ({ 
  message = '소울메이트를 불러오고 있습니다... / Loading Soulmate...' 
}) => {
  return (
    <div className="min-h-screen bg-dark-navy flex items-center justify-center">
      <div className="text-center">
        {/* Animated loading spinner */}
        <div className="relative mb-8">
          <div className="w-16 h-16 border-4 border-neon-blue/30 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-neon-blue rounded-full animate-spin"></div>
        </div>
        
        {/* Loading message */}
        <h2 className="text-xl font-medium text-ui-text-100 mb-4 animate-pulse">
          {message}
        </h2>
        
        {/* Progress dots */}
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen