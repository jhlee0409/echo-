/**
 * 📱 Responsive Layout System - 반응형 레이아웃 관리
 * 
 * PC/모바일 대응 글래스모피즘 스타일 구현
 * Tailwind CSS로 구현된 반응형 레이아웃
 */

import React, { useMemo } from 'react'
import { clsx } from 'clsx'
import { useLayoutState } from '../GameUI/GameModeRouter'

// 브레이크포인트 정의 (Tailwind 기본 브레이크포인트와 일치)
export const breakpoints = {
  mobile: '640px',   // sm
  tablet: '768px',   // md  
  desktop: '1024px', // lg
  wide: '1920px'     // xl
} as const

// 글래스모피즘 기본 클래스
const glassClass = 'bg-white/10 backdrop-blur-md border border-cyan-400/30 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'

// 네온 글로우 효과 클래스
const neonGlowClass = 'shadow-[0_0_10px_currentColor,0_0_20px_currentColor,0_0_30px_currentColor] animate-pulse'

// 인터페이스 정의
interface ResponsiveLayoutProps {
  children: React.ReactNode
  className?: string
}

interface AreaWrapperProps {
  children: React.ReactNode
  className?: string
}

interface InteractionPanelProps extends AreaWrapperProps {
  height?: number
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'glass'
}

// 메인 반응형 레이아웃 컴포넌트
export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ 
  children, 
  className 
}) => {
  const { layout, isMobile, isPortrait } = useLayoutState()
  
  const containerClasses = useMemo(() => {
    return clsx(
      // 기본 스타일
      'relative w-screen h-screen bg-slate-900 text-white font-sans overflow-hidden',
      // 그리드 레이아웃
      'grid gap-4 p-4',
      
      // 데스크톱 기본 레이아웃
      'lg:grid-cols-[1fr_2fr] lg:grid-rows-[auto_1fr_auto]',
      'lg:grid-areas-[status_status,character_dialogue,character_interaction]',
      
      // 모바일 세로 레이아웃  
      isMobile && isPortrait && [
        'grid-cols-1 grid-rows-[auto_1fr_2fr_auto] gap-2 p-2',
        'grid-areas-[status,character,dialogue,interaction]'
      ],
      
      // 모바일 가로 레이아웃
      isMobile && !isPortrait && [
        'grid-cols-[1fr_2fr] grid-rows-[auto_1fr_auto]',
        'grid-areas-[status_status,character_dialogue,interaction_interaction]'
      ],
      
      // 태블릿 레이아웃
      'md:grid-cols-[1fr_2fr] md:grid-rows-[auto_1fr_auto] md:gap-3 md:p-3',
      
      // 와이드 스크린
      'xl:max-w-screen-2xl xl:mx-auto xl:gap-5 xl:p-6',
      
      className
    )
  }, [isMobile, isPortrait, layout.sidebarCollapsed, className])
  
  return (
    <div className={containerClasses}>
      {children}
    </div>
  )
}

// 상태바 영역
export const StatusBar: React.FC<AreaWrapperProps> = ({ children, className }) => (
  <div className={clsx(
    'grid-area-status',
    glassClass,
    'px-6 py-4 flex justify-between items-center min-h-[60px]',
    'border-gradient-to-r border-gradient-from-transparent border-gradient-via-cyan-400 border-gradient-to-transparent',
    'sm:px-4 sm:py-3 sm:min-h-[50px] sm:flex-wrap sm:gap-2',
    className
  )}>
    {children}
  </div>
)

// AI 캐릭터 영역
export const CharacterAreaWrapper: React.FC<AreaWrapperProps> = ({ children, className }) => {
  const { isMobile } = useLayoutState()
  
  return (
    <div className={clsx(
      'grid-area-character',
      glassClass,
      'flex flex-col items-center justify-center relative overflow-hidden',
      
      // 모바일에서 크기 조정
      isMobile && 'min-h-[200px] max-h-[300px]',
      
      // 데스크톱에서 고정 비율
      !isMobile && 'aspect-[4/5]',
      
      className
    )}>
      <div className="character-avatar w-full h-full flex items-center justify-center relative overflow-visible">
        {children}
      </div>
      
      {/* 감정 표시 오버레이 */}
      <div className={clsx(
        'emotion-overlay absolute bottom-4 left-1/2 transform -translate-x-1/2',
        glassClass,
        'px-4 py-2 rounded-full text-sm text-center',
        'sm:bottom-2 sm:px-3 sm:py-1.5 sm:text-xs'
      )}>
        {/* 감정 상태가 여기에 표시됩니다 */}
      </div>
    </div>
  )
}

// 대화 영역
export const DialogueAreaWrapper: React.FC<AreaWrapperProps> = ({ children, className }) => {
  return (
    <div className={clsx(
      'grid-area-dialogue',
      glassClass,
      'flex flex-col overflow-hidden',
      className
    )}>
      <div className="dialogue-content flex-1 p-4 overflow-y-auto overflow-x-hidden sm:p-3">
        <style jsx>{`
          .dialogue-content::-webkit-scrollbar {
            width: 8px;
          }
          .dialogue-content::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
          }
          .dialogue-content::-webkit-scrollbar-thumb {
            background: #00FFF0;
            border-radius: 4px;
          }
          .dialogue-content::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 255, 240, 0.8);
          }
          @media (max-width: 640px) {
            .dialogue-content::-webkit-scrollbar {
              width: 6px;
            }
          }
        `}</style>
        {children}
      </div>
      
      {/* 타이핑 인디케이터 */}
      <div className="typing-indicator px-4 py-4 border-t border-cyan-400/20 flex items-center gap-2 sm:px-3 sm:py-3">
        <div className="dots flex gap-1">
          <div className="dot w-1.5 h-1.5 rounded-full bg-cyan-400 animate-[typing-bounce_1.4s_ease-in-out_infinite_both] [animation-delay:-0.32s]"></div>
          <div className="dot w-1.5 h-1.5 rounded-full bg-cyan-400 animate-[typing-bounce_1.4s_ease-in-out_infinite_both] [animation-delay:-0.16s]"></div>
          <div className="dot w-1.5 h-1.5 rounded-full bg-cyan-400 animate-[typing-bounce_1.4s_ease-in-out_infinite_both] [animation-delay:0s]"></div>
        </div>
        
        <style jsx>{`
          @keyframes typing-bounce {
            0%, 80%, 100% {
              transform: scale(0);
              opacity: 0.5;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </div>
  )
}

// 인터랙션 패널
export const InteractionPanelWrapper: React.FC<InteractionPanelProps> = ({ 
  children, 
  height = 200,
  className 
}) => {
  const { isMobile } = useLayoutState()
  
  return (
    <div 
      className={clsx(
        'grid-area-interaction',
        glassClass,
        'flex flex-col overflow-hidden transition-all duration-300',
        // 모바일에서 최소/최대 높이 제한
        isMobile && 'min-h-[120px] max-h-[300px]',
        className
      )}
      style={{ height: `${height}px` }}
    >
      {/* 패널 헤더 */}
      <div className="panel-header px-4 py-3 border-b border-cyan-400/20 flex justify-between items-center sm:px-3 sm:py-2">
        <div className="panel-title text-sm font-semibold text-cyan-400 sm:text-xs">
          인터랙션 패널
        </div>
        <div className="panel-controls flex gap-2">
          {/* 컨트롤 버튼들이 여기에 들어갑니다 */}
        </div>
      </div>
      
      {/* 패널 내용 */}
      <div className="panel-content flex-1 p-4 overflow-y-auto sm:p-3">
        {children}
      </div>
    </div>
  )
}

// 글래스 버튼 컴포넌트
export const GlassButton: React.FC<ButtonProps> = ({ 
  variant = 'secondary',
  size = 'medium',
  loading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const buttonClasses = useMemo(() => {
    const baseClasses = [
      glassClass,
      'border-0 font-medium text-white cursor-pointer transition-all duration-300',
      'relative overflow-hidden active:translate-y-px',
      'sm:min-h-[44px] sm:-webkit-tap-highlight-transparent'
    ]
    
    // 크기별 패딩과 폰트 크기
    const sizeClasses = {
      small: 'px-4 py-2 text-sm sm:px-4 sm:py-2.5',
      medium: 'px-6 py-3 text-base sm:px-6 sm:py-3.5',
      large: 'px-8 py-4 text-lg sm:px-8 sm:py-4.5'
    }
    
    // 변형별 스타일
    const variantClasses = {
      primary: [
        'bg-gradient-to-r from-cyan-400/20 to-purple-500/20',
        'border-cyan-400',
        'hover:shadow-[0_0_10px_currentColor,0_0_20px_currentColor,0_0_30px_currentColor]',
        'hover:-translate-y-0.5'
      ],
      secondary: [
        'bg-white/5',
        'hover:bg-white/10 hover:border-blue-400'
      ],
      danger: [
        'bg-pink-500/20',
        'border-pink-400',
        'hover:shadow-[0_0_20px_rgba(255,71,179,0.5)]'
      ]
    }
    
    const disabledClasses = [
      'opacity-50 cursor-not-allowed',
      'hover:transform-none hover:shadow-none'
    ]
    
    const loadingClasses = [
      'after:content-[""] after:absolute after:top-1/2 after:left-1/2',
      'after:-translate-x-1/2 after:-translate-y-1/2 after:w-5 after:h-5',
      'after:border-2 after:border-transparent after:border-t-current',
      'after:rounded-full after:animate-spin'
    ]
    
    return clsx(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      disabled && disabledClasses,
      loading && loadingClasses,
      className
    )
  }, [variant, size, disabled, loading, className])
  
  return (
    <button 
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? '' : children}
    </button>
  )
}

// 글래스 입력 필드
export const GlassInput: React.FC<InputProps> = ({ 
  variant = 'glass',
  className,
  ...props
}) => {
  const inputClasses = useMemo(() => {
    return clsx(
      glassClass,
      'w-full px-4 py-3 border-0 bg-white/5 text-white text-base font-inherit',
      'placeholder:text-slate-300 placeholder:opacity-70',
      'focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,255,240,0.3)]',
      'sm:text-base', // iOS 줌 방지를 위한 최소 크기
      className
    )
  }, [className])
  
  return (
    <input 
      className={inputClasses}
      {...props}
    />
  )
}

// 파티클 컨테이너
export const ParticleContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible z-[1000]">
    {children}
  </div>
)

// CSS 변수 설정 (Tailwind config에서 처리하는 것이 더 좋지만, 호환성을 위해 유지)
export const setCSSVariables = () => {
  const root = document.documentElement
  
  // Tailwind에서 사용할 CSS 변수들
  root.style.setProperty('--color-primary', '#0A0F1B')
  root.style.setProperty('--color-glass', 'rgba(255, 255, 255, 0.1)')
  root.style.setProperty('--color-neon-cyan', '#00FFF0')
  root.style.setProperty('--color-neon-purple', '#B347FF')
  root.style.setProperty('--color-neon-pink', '#FF47B3')
  root.style.setProperty('--color-neon-blue', '#4799FF')
}

// 초기화 함수
export const initializeResponsiveLayout = () => {
  setCSSVariables()
  
  // 뷰포트 메타 태그 설정
  let viewport = document.querySelector('meta[name="viewport"]')
  if (!viewport) {
    viewport = document.createElement('meta')
    viewport.setAttribute('name', 'viewport')
    document.head.appendChild(viewport)
  }
  viewport.setAttribute(
    'content', 
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
  )
}

export default ResponsiveLayout