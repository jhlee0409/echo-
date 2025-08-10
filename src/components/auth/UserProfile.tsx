/**
 * User Profile Component
 * Displays and allows editing of user profile information
 */

import React, { useState, useCallback, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { authService } from '@/services/auth/AuthService'
import { userProfileService } from '@/services/database/SupabaseService'
import type { AuthState } from '@/services/auth/AuthService'

interface UserProfileProps {
  isOpen: boolean
  onClose: () => void
}

interface ProfileFormData {
  displayName: string
  username: string
  language: string
  timezone: string
  isPublic: boolean
  allowAnalytics: boolean
}

interface FormErrors {
  displayName?: string
  username?: string
  general?: string
}

export const UserProfileComponent: React.FC<UserProfileProps> = ({
  isOpen,
  onClose
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  })

  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
    username: '',
    language: 'ko',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isPublic: false,
    allowAnalytics: true
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Initialize auth state and profile data
  useEffect(() => {
    const unsubscribe = authService.addAuthListener((state) => {
      setAuthState(state)
      
      if (state.profile) {
        setFormData({
          displayName: state.profile.displayName || '',
          username: state.profile.username || '',
          language: state.profile.language,
          timezone: state.profile.timezone,
          isPublic: state.profile.isPublic,
          allowAnalytics: state.profile.allowAnalytics
        })
      }
    })

    // Set initial state
    const initialState = authService.getAuthState()
    setAuthState(initialState)
    
    if (initialState.profile) {
      setFormData({
        displayName: initialState.profile.displayName || '',
        username: initialState.profile.username || '',
        language: initialState.profile.language,
        timezone: initialState.profile.timezone,
        isPublic: initialState.profile.isPublic,
        allowAnalytics: initialState.profile.allowAnalytics
      })
    }

    return unsubscribe
  }, [])

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    // Display name validation
    if (!formData.displayName.trim()) {
      newErrors.displayName = '표시 이름을 입력해주세요'
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = '표시 이름은 최소 2자 이상이어야 합니다'
    } else if (formData.displayName.trim().length > 50) {
      newErrors.displayName = '표시 이름은 50자를 초과할 수 없습니다'
    }

    // Username validation (optional but if provided, must be valid)
    if (formData.username.trim()) {
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username.trim())) {
        newErrors.username = '사용자명은 3-20자의 영문, 숫자, 언더스코어만 사용 가능합니다'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !authState.user) return

    setIsSaving(true)
    setErrors({})

    try {
      const updateData = {
        display_name: formData.displayName.trim(),
        username: formData.username.trim() || null,
        language: formData.language,
        timezone: formData.timezone,
        is_public: formData.isPublic,
        allow_analytics: formData.allowAnalytics
      }

      const result = await userProfileService.updateProfile(authState.user.id, updateData)

      if (result.success) {
        // Profile will be updated automatically through auth listener
        onClose()
      } else {
        setErrors({ 
          general: result.error?.message || '프로필 업데이트에 실패했습니다.'
        })
      }
    } catch (error) {
      console.error('Profile update error:', error)
      setErrors({ 
        general: '프로필 업데이트 중 오류가 발생했습니다.'
      })
    } finally {
      setIsSaving(false)
    }
  }, [authState.user, formData, validateForm, onClose])

  const handleChange = useCallback((field: keyof ProfileFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field-specific error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  const handleSignOut = useCallback(async () => {
    setIsLoading(true)
    try {
      await authService.signOut()
      onClose()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [onClose])

  if (!authState.isAuthenticated || !authState.profile) {
    return null
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="프로필 설정">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* General Error Message */}
        {errors.general && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {errors.general}
          </div>
        )}

        {/* Account Info */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">계정 정보</h3>
          <div className="text-sm text-gray-600">
            <p><strong>이메일:</strong> {authState.user?.email}</p>
            <p><strong>가입일:</strong> {new Date(authState.profile.createdAt).toLocaleDateString('ko-KR')}</p>
            <p><strong>마지막 접속:</strong> {new Date(authState.profile.lastActive).toLocaleDateString('ko-KR')}</p>
          </div>
        </div>

        {/* Display Name Field */}
        <div className="space-y-1">
          <label htmlFor="profile-display-name" className="block text-sm font-medium text-gray-700">
            표시 이름 *
          </label>
          <input
            id="profile-display-name"
            type="text"
            value={formData.displayName}
            onChange={(e) => handleChange('displayName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.displayName ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="다른 사용자에게 보여질 이름"
            disabled={isSaving}
          />
          {errors.displayName && (
            <p className="text-sm text-red-600">{errors.displayName}</p>
          )}
        </div>

        {/* Username Field */}
        <div className="space-y-1">
          <label htmlFor="profile-username" className="block text-sm font-medium text-gray-700">
            사용자명 (선택)
          </label>
          <input
            id="profile-username"
            type="text"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="unique_username"
            disabled={isSaving}
          />
          {errors.username && (
            <p className="text-sm text-red-600">{errors.username}</p>
          )}
          <p className="text-xs text-gray-500">3-20자, 영문, 숫자, _ 사용 가능</p>
        </div>

        {/* Language Selection */}
        <div className="space-y-1">
          <label htmlFor="profile-language" className="block text-sm font-medium text-gray-700">
            언어
          </label>
          <select
            id="profile-language"
            value={formData.language}
            onChange={(e) => handleChange('language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSaving}
          >
            <option value="ko">한국어</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </div>

        {/* Timezone Selection */}
        <div className="space-y-1">
          <label htmlFor="profile-timezone" className="block text-sm font-medium text-gray-700">
            시간대
          </label>
          <select
            id="profile-timezone"
            value={formData.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSaving}
          >
            <option value="Asia/Seoul">서울 (GMT+9)</option>
            <option value="Asia/Tokyo">도쿄 (GMT+9)</option>
            <option value="America/New_York">뉴욕 (GMT-5/-4)</option>
            <option value="America/Los_Angeles">로스앤젤레스 (GMT-8/-7)</option>
            <option value="Europe/London">런던 (GMT+0/+1)</option>
          </select>
        </div>

        {/* Privacy Settings */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700">개인정보 설정</h3>
          
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => handleChange('isPublic', e.target.checked)}
              className="mt-1 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              disabled={isSaving}
            />
            <div className="ml-2">
              <span className="text-sm text-gray-700">공개 프로필</span>
              <p className="text-xs text-gray-500">다른 사용자가 내 프로필을 볼 수 있습니다</p>
            </div>
          </label>

          <label className="flex items-start">
            <input
              type="checkbox"
              checked={formData.allowAnalytics}
              onChange={(e) => handleChange('allowAnalytics', e.target.checked)}
              className="mt-1 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              disabled={isSaving}
            />
            <div className="ml-2">
              <span className="text-sm text-gray-700">사용 분석 허용</span>
              <p className="text-xs text-gray-500">서비스 개선을 위한 익명화된 사용 데이터 수집에 동의합니다</p>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            onClick={handleSignOut}
            variant="secondary"
            disabled={isLoading || isSaving}
            loading={isLoading}
          >
            로그아웃
          </Button>

          <div className="flex space-x-3">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              disabled={isSaving}
            >
              취소
            </Button>
            
            <Button
              type="submit"
              disabled={isSaving}
              loading={isSaving}
            >
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default UserProfileComponent