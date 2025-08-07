import { FC, useState } from 'react'
import { useGameStore } from '@hooks'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

const GameMenu: FC = () => {
  const { gameState, saveGame, loadGame, resetGame, settings, updateSettings } = useGameStore()
  const [showSettings, setShowSettings] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handleSave = async () => {
    try {
      await saveGame()
      // Show success toast (could implement toast system later)
      console.log('게임이 저장되었습니다.')
    } catch (error) {
      console.error('저장 실패:', error)
    }
  }

  const handleLoad = async () => {
    try {
      await loadGame()
      console.log('게임을 불러왔습니다.')
    } catch (error) {
      console.error('불러오기 실패:', error)
    }
  }

  const handleReset = () => {
    setShowResetConfirm(true)
  }

  const confirmReset = () => {
    resetGame()
    setShowResetConfirm(false)
  }

  return (
    <>
      <div className="bg-dark-surface rounded-lg border border-ui-border-100 p-4 space-y-4">
        {/* Header */}
        <div>
          <h3 className="font-bold text-ui-text-100 mb-2">게임 메뉴</h3>
          <p className="text-sm text-ui-text-300">게임 설정 및 저장/불러오기</p>
        </div>

        {/* Save/Load Actions */}
        <div className="space-y-2">
          <h4 className="font-medium text-ui-text-200 text-sm">저장 관리</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleSave}
              className="text-xs"
            >
              💾 저장하기
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleLoad}
              disabled={!gameState?.lastSaved}
              className="text-xs"
            >
              📂 불러오기
            </Button>
          </div>
          {gameState?.lastSaved && (
            <p className="text-xs text-ui-text-400">
              마지막 저장: {new Date(gameState.lastSaved).toLocaleString('ko-KR')}
            </p>
          )}
        </div>

        {/* Settings */}
        <div className="space-y-2">
          <h4 className="font-medium text-ui-text-200 text-sm">설정</h4>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowSettings(true)}
            className="w-full justify-start text-xs"
          >
            ⚙️ 게임 설정
          </Button>
        </div>

        {/* Game Info */}
        <div className="border-t border-ui-border-200 pt-3 space-y-2">
          <h4 className="font-medium text-ui-text-200 text-sm">게임 정보</h4>
          <div className="text-xs text-ui-text-400 space-y-1">
            <p>버전: Phase 1 Prototype</p>
            <p>플레이 시간: {Math.floor((gameState?.playTime || 0) / 60)}분</p>
            <p>레벨: {gameState?.level || 1}</p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border-t border-red-500/20 pt-3">
          <Button 
            variant="danger" 
            size="sm" 
            onClick={handleReset}
            className="w-full text-xs"
          >
            🔄 게임 초기화
          </Button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <Modal
          title="게임 설정"
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        >
          <div className="space-y-4">
            {/* Audio Settings */}
            <div>
              <label className="block text-sm font-medium text-ui-text-200 mb-2">
                사운드
              </label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ui-text-300">효과음</span>
                  <input
                    type="checkbox"
                    checked={settings?.soundEnabled || false}
                    onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ui-text-300">배경음악</span>
                  <input
                    type="checkbox"
                    checked={settings?.musicEnabled || false}
                    onChange={(e) => updateSettings({ musicEnabled: e.target.checked })}
                    className="rounded"
                  />
                </div>
              </div>
            </div>

            {/* Display Settings */}
            <div>
              <label className="block text-sm font-medium text-ui-text-200 mb-2">
                디스플레이
              </label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ui-text-300">애니메이션</span>
                  <input
                    type="checkbox"
                    checked={settings?.animationsEnabled !== false}
                    onChange={(e) => updateSettings({ animationsEnabled: e.target.checked })}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ui-text-300">다크모드</span>
                  <input
                    type="checkbox"
                    checked={settings?.darkMode !== false}
                    onChange={(e) => updateSettings({ darkMode: e.target.checked })}
                    className="rounded"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSettings(false)}
              >
                닫기
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <Modal
          title="게임 초기화 확인"
          isOpen={showResetConfirm}
          onClose={() => setShowResetConfirm(false)}
        >
          <div className="space-y-4">
            <p className="text-ui-text-200">
              정말로 게임을 초기화하시겠습니까?
            </p>
            <p className="text-sm text-ui-text-400">
              모든 진행상황과 대화 기록이 삭제되며, 이 작업은 되돌릴 수 없습니다.
            </p>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowResetConfirm(false)}
              >
                취소
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmReset}
              >
                초기화
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

export default GameMenu