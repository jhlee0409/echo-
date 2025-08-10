/**
 * 🎮 Battle HUD (Heads-Up Display) Component
 * 
 * Shows unit status bars, turn counter, and battle controls
 */

// React import removed - not needed with new JSX transform
import { motion } from 'framer-motion'
import type { BattleUnit } from '@/systems/battle/types'

interface BattleHUDProps {
  playerTeam: BattleUnit[]
  enemyTeam: BattleUnit[]
  currentTurn: number
  onEscape?: () => void
  className?: string
}

export function BattleHUD({
  playerTeam,
  enemyTeam,
  currentTurn,
  onEscape,
  className = ''
}: BattleHUDProps) {
  const renderUnitStatusBar = (unit: BattleUnit, index: number, isEnemy: boolean = false) => {
    const hpPercent = (unit.hp / unit.maxHp) * 100
    const mpPercent = (unit.mp / unit.maxMp) * 100
    
    const statusEffectsCount = (unit.buffs?.length || 0) + (unit.debuffs?.length || 0)

    return (
      <motion.div
        key={unit.id}
        initial={{ opacity: 0, x: isEnemy ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`unit-status-bar bg-black/60 backdrop-blur-sm rounded-lg p-3 min-w-[200px] ${
          !unit.isAlive ? 'opacity-50 grayscale' : ''
        }`}
      >
        {/* Unit Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="text-lg font-semibold text-white">
              {unit.name}
            </div>
            {unit.type === 'boss' && (
              <div className="px-2 py-1 bg-red-600 text-white text-xs rounded font-bold">
                BOSS
              </div>
            )}
          </div>
          
          {/* Status Effects Indicator */}
          {statusEffectsCount > 0 && (
            <div className="flex items-center space-x-1">
              {unit.buffs?.map((buff, i) => (
                <div
                  key={`buff-${i}`}
                  className="w-4 h-4 bg-green-500 rounded text-xs text-white flex items-center justify-center"
                  title={buff.description}
                >
                  {buff.icon || '+'}
                </div>
              ))}
              {unit.debuffs?.map((debuff, i) => (
                <div
                  key={`debuff-${i}`}
                  className="w-4 h-4 bg-red-500 rounded text-xs text-white flex items-center justify-center"
                  title={debuff.description}
                >
                  {debuff.icon || '-'}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HP Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-300 mb-1">
            <span>HP</span>
            <span>{unit.hp}/{unit.maxHp}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className={`h-2 rounded-full transition-all duration-300 ${
                hpPercent > 50 ? 'bg-green-500' :
                hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.max(0, hpPercent)}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, hpPercent)}%` }}
            />
          </div>
        </div>

        {/* MP Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-300 mb-1">
            <span>MP</span>
            <span>{unit.mp}/{unit.maxMp}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <motion.div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, mpPercent)}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, mpPercent)}%` }}
            />
          </div>
        </div>

        {/* Combat Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
          <div className="text-center">
            <div className="text-red-400 font-semibold">{unit.attack}</div>
            <div>ATK</div>
          </div>
          <div className="text-center">
            <div className="text-blue-400 font-semibold">{unit.defense}</div>
            <div>DEF</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 font-semibold">{unit.speed}</div>
            <div>SPD</div>
          </div>
        </div>

        {/* Death Indicator */}
        {!unit.isAlive && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <div className="text-red-400 font-bold text-lg">💀 KO</div>
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <div className={`battle-hud w-full bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-sm border-b border-slate-700 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Player Team Status */}
        <div className="flex space-x-3">
          <div className="text-sm text-green-400 font-semibold mb-2">아군</div>
          <div className="flex space-x-3">
            {playerTeam.map((unit, index) => renderUnitStatusBar(unit, index, false))}
          </div>
        </div>

        {/* Center Info */}
        <div className="flex flex-col items-center">
          {/* Turn Counter */}
          <motion.div
            className="bg-slate-800/80 rounded-lg px-4 py-2 mb-2"
            key={currentTurn}
            initial={{ scale: 1.1, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center">
              <div className="text-lg font-bold text-white">턴 {currentTurn}</div>
              <div className="text-xs text-gray-400">Turn</div>
            </div>
          </motion.div>

          {/* Battle Controls */}
          <div className="flex space-x-2">
            {onEscape && (
              <button
                onClick={onEscape}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
              >
                도망치기
              </button>
            )}
            
            <button
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-medium transition-colors"
              onClick={() => {
                // TODO: Implement auto-battle toggle
                console.log('Auto-battle toggle not implemented')
              }}
            >
              자동 전투
            </button>
          </div>
        </div>

        {/* Enemy Team Status */}
        <div className="flex space-x-3">
          <div className="text-sm text-red-400 font-semibold mb-2">적군</div>
          <div className="flex space-x-3">
            {enemyTeam.map((unit, index) => renderUnitStatusBar(unit, index, true))}
          </div>
        </div>
      </div>

      {/* Battle Speed Control */}
      <div className="absolute bottom-2 right-4">
        <div className="flex items-center space-x-2 bg-black/40 rounded-lg px-3 py-2">
          <span className="text-xs text-gray-400">속도:</span>
          <button className="text-xs text-white hover:text-blue-400 transition-colors">1x</button>
          <button className="text-xs text-white hover:text-blue-400 transition-colors">2x</button>
          <button className="text-xs text-white hover:text-blue-400 transition-colors">4x</button>
        </div>
      </div>

      {/* Connection Status Indicator */}
      <div className="absolute top-2 right-4">
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>연결됨</span>
        </div>
      </div>
    </div>
  )
}

export default BattleHUD