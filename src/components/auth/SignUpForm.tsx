/**
 * Sign Up Form Component
 * Handles user registration with validation and error handling
 */

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { authService } from '@/services/auth/AuthService'
import type { SignUpData } from '@/services/auth/AuthService'

interface SignUpFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

interface FormData {
  email: string
  password: string
  confirmPassword: string
  displayName: string
  username: string
  acceptTerms: boolean
}

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  displayName?: string
  username?: string
  acceptTerms?: string
  general?: string
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToLogin
}) => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    username: '',
    acceptTerms: false
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요'
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = '비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다'
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다'
    }

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

    // Terms acceptance validation
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = '이용약관에 동의해주세요'
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
      const signUpData: SignUpData = {
        email: formData.email.trim(),
        password: formData.password,
        displayName: formData.displayName.trim(),
        username: formData.username.trim() || undefined,
        language: 'ko',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }

      const result = await authService.signUp(signUpData)

      if (result.success && result.user) {
        onSuccess?.()
        onClose()
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          displayName: '',
          username: '',
          acceptTerms: false
        })
      } else {
        setErrors({ 
          general: result.error?.message || '회원가입에 실패했습니다. 다시 시도해주세요.'
        })
      }
    } catch (error) {
      console.error('Sign up error:', error)
      setErrors({ 
        general: '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.'
      })
    } finally {
      setIsLoading(false)
    }
  }, [formData, validateForm, onSuccess, onClose])

  const handleChange = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field-specific error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  const handleClose = useCallback(() => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      username: '',
      acceptTerms: false
    })
    setErrors({})
    setIsLoading(false)
    onClose()
  }, [onClose])

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="회원가입">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* General Error Message */}
        {errors.general && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {errors.general}
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-1">
          <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">
            이메일 *
          </label>
          <input
            id="signup-email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="your@email.com"
            disabled={isLoading}
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Display Name Field */}
        <div className="space-y-1">
          <label htmlFor="display-name" className="block text-sm font-medium text-gray-700">
            표시 이름 *
          </label>
          <input
            id="display-name"
            type="text"
            value={formData.displayName}
            onChange={(e) => handleChange('displayName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.displayName ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="다른 사용자에게 보여질 이름"
            disabled={isLoading}
            autoComplete="name"
          />
          {errors.displayName && (
            <p className="text-sm text-red-600">{errors.displayName}</p>
          )}
        </div>

        {/* Username Field */}
        <div className="space-y-1">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            사용자명 (선택)
          </label>
          <input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="unique_username"
            disabled={isLoading}
            autoComplete="username"
          />
          {errors.username && (
            <p className="text-sm text-red-600">{errors.username}</p>
          )}
          <p className="text-xs text-gray-500">3-20자, 영문, 숫자, _ 사용 가능</p>
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">
            비밀번호 *
          </label>
          <input
            id="signup-password"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="비밀번호를 입력하세요"
            disabled={isLoading}
            autoComplete="new-password"
          />
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password}</p>
          )}
          <p className="text-xs text-gray-500">8자 이상, 대소문자와 숫자 포함</p>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-1">
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
            비밀번호 확인 *
          </label>
          <input
            id="confirm-password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="비밀번호를 다시 입력하세요"
            disabled={isLoading}
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Terms Acceptance */}
        <div className="space-y-2">
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={(e) => handleChange('acceptTerms', e.target.checked)}
              className={`mt-1 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${
                errors.acceptTerms ? 'border-red-300' : ''
              }`}
              disabled={isLoading}
            />
            <span className="ml-2 text-sm text-gray-600">
              <span className="text-red-500">*</span> 이용약관 및 개인정보처리방침에 동의합니다
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="text-sm text-red-600">{errors.acceptTerms}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          loading={isLoading}
        >
          {isLoading ? '계정 생성 중...' : '계정 만들기'}
        </Button>

        {/* Login Link */}
        {onSwitchToLogin && (
          <div className="text-center">
            <span className="text-sm text-gray-600">이미 계정이 있으신가요? </span>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              disabled={isLoading}
            >
              로그인
            </button>
          </div>
        )}
      </form>
    </Modal>
  )
}

export default SignUpForm