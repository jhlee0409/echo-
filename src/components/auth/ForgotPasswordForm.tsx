/**
 * Forgot Password Form Component
 * Handles password reset requests
 */

import React, { useState, useCallback } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { authService } from '@/services/auth/AuthService'

interface ForgotPasswordFormProps {
  isOpen: boolean
  onClose: () => void
  onBackToLogin?: () => void
}

interface FormData {
  email: string
}

interface FormErrors {
  email?: string
  general?: string
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  isOpen,
  onClose,
  onBackToLogin
}) => {
  const [formData, setFormData] = useState<FormData>({
    email: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const result = await authService.resetPassword(formData.email.trim())

      if (result.success) {
        setIsSuccess(true)
      } else {
        setErrors({ 
          general: result.error?.message || '비밀번호 재설정 요청에 실패했습니다. 다시 시도해주세요.'
        })
      }
    } catch (error) {
      console.error('Password reset error:', error)
      setErrors({ 
        general: '비밀번호 재설정 요청 중 오류가 발생했습니다. 다시 시도해주세요.'
      })
    } finally {
      setIsLoading(false)
    }
  }, [formData, validateForm])

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  const handleClose = useCallback(() => {
    setFormData({ email: '' })
    setErrors({})
    setIsLoading(false)
    setIsSuccess(false)
    onClose()
  }, [onClose])

  const handleBackToLogin = useCallback(() => {
    setFormData({ email: '' })
    setErrors({})
    setIsLoading(false)
    setIsSuccess(false)
    onBackToLogin?.()
  }, [onBackToLogin])

  // Success state
  if (isSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="이메일을 확인하세요">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900">
              비밀번호 재설정 이메일을 보냈습니다
            </h3>
            <p className="text-sm text-gray-600">
              <strong>{formData.email}</strong>로 비밀번호 재설정 링크를 보냈습니다.
              이메일을 확인하고 지시에 따라 비밀번호를 재설정하세요.
            </p>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p>💡 이메일이 보이지 않나요?</p>
            <ul className="mt-2 space-y-1 text-left">
              <li>• 스팸 폴더를 확인해보세요</li>
              <li>• 몇 분 기다린 후 다시 확인해보세요</li>
              <li>• 이메일 주소가 정확한지 확인해보세요</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleBackToLogin}
              variant="secondary"
              className="flex-1"
            >
              로그인으로 돌아가기
            </Button>
            <Button
              onClick={handleClose}
              className="flex-1"
            >
              확인
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  // Form state
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="비밀번호 재설정">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Error Message */}
          {errors.general && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {errors.general}
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1">
            <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
              이메일
            </label>
            <input
              id="reset-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="your@email.com"
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {onBackToLogin && (
              <Button
                type="button"
                onClick={handleBackToLogin}
                variant="secondary"
                className="flex-1"
                disabled={isLoading}
              >
                취소
              </Button>
            )}
            
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
              loading={isLoading}
            >
              {isLoading ? '전송 중...' : '재설정 이메일 보내기'}
            </Button>
          </div>
        </form>

        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
          <p className="flex items-start">
            <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            이메일을 받지 못하셨다면 스팸 폴더를 확인해보시거나, 
            몇 분 후에 다시 시도해보세요.
          </p>
        </div>
      </div>
    </Modal>
  )
}

export default ForgotPasswordForm