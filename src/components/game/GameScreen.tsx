import { FC, useState } from 'react'
import { useGameStore } from '@hooks'
import ChatWindow from '../chat/ChatWindow'
import CharacterStatus from './CharacterStatus'
import GameMenu from './GameMenu'
import Button from '../ui/Button'

const GameScreen: FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'status' | 'menu'>('chat')
  const { companion, gameState } = useGameStore()

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-dark-navy via-dark-surface to-dark-navy">
      {/* Header */}
      <header className="bg-dark-surface/80 backdrop-blur-sm border-b border-ui-border-100 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
              소울메이트 / Soulmate
            </h1>
            {companion && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-neon-blue to-neon-purple rounded-full animate-glow"></div>
                <span className="text-ui-text-100 font-medium">{companion.name}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-sm text-ui-text-300">
              Level {gameState?.level || 1}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('menu')}
            >
              ⚙️
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full p-4 gap-4">
        {/* Navigation Tabs (Mobile) */}
        <div className="lg:hidden">
          <div className="flex bg-dark-surface rounded-lg p-1">
            {[
              { key: 'chat', label: '대화', icon: '💬' },
              { key: 'status', label: '상태', icon: '📊' },
              { key: 'menu', label: '메뉴', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  'flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'bg-neon-blue text-dark-navy'
                    : 'text-ui-text-200 hover:text-ui-text-100 hover:bg-ui-surface-100'
                )}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Panels */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4">
          {/* Chat Window */}
          <div className={cn(
            'flex-1 min-h-[400px] lg:min-h-0',
            activeTab !== 'chat' && 'hidden lg:block'
          )}>
            <ChatWindow />
          </div>

          {/* Sidebar */}
          <div className={cn(
            'lg:w-80 space-y-4',
            activeTab === 'chat' && 'hidden lg:block'
          )}>
            {/* Character Status */}
            <div className={cn(
              activeTab !== 'status' && activeTab !== 'chat' && 'hidden lg:block'
            )}>
              <CharacterStatus />
            </div>

            {/* Game Menu */}
            <div className={cn(
              activeTab !== 'menu' && activeTab !== 'chat' && 'hidden lg:block'
            )}>
              <GameMenu />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-dark-surface/50 border-t border-ui-border-100 p-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs text-ui-text-400">
            AI Companion RPG · Phase 1 Prototype
          </p>
        </div>
      </footer>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export default GameScreen