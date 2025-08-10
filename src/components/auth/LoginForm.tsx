/**
 * Login Form Component
 * Handles user authentication with validation and error handling
 */

import React, { useState, useCallback } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { authService } from '@/services/auth/AuthService'
import type { SignInData } from '@/services/auth/AuthService'

interface LoginFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  onSwitchToSignUp?: () => void
  onForgotPassword?: () => void
}

interface FormData {
  email: string
  password: string
  rememberMe: boolean
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

export const LoginForm: React.FC<LoginFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToSignUp,
  onForgotPassword
}) => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false
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
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다'
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
      const signInData: SignInData = {
        email: formData.email.trim(),
        password: formData.password,
        rememberMe: formData.rememberMe
      }

      const result = await authService.signIn(signInData)

      if (result.success && result.user) {
        onSuccess?.()
        onClose()
        setFormData({ email: '', password: '', rememberMe: false })
      } else {
        setErrors({ 
          general: result.error?.message || '로그인에 실패했습니다. 다시 시도해주세요.'
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      setErrors({ 
        general: '로그인 중 오류가 발생했습니다. 다시 시도해주세요.'
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
    setFormData({ email: '', password: '', rememberMe: false })
    setErrors({})
    setIsLoading(false)
    onClose()
  }, [onClose])

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="로그인">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* General Error Message */}
        {errors.general && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {errors.general}
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            이메일
          </label>
          <input
            id="email"
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

        {/* Password Field */}
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="비밀번호를 입력하세요"
            disabled={isLoading}
            autoComplete="current-password"
          />
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) => handleChange('rememberMe', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              disabled={isLoading}
            />
            <span className="ml-2 text-sm text-gray-600">로그인 상태 유지</span>
          </label>

          {onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-blue-600 hover:text-blue-800"
              disabled={isLoading}
            >
              비밀번호를 잊으셨나요?
            </button>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          loading={isLoading}
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </Button>

        {/* Sign Up Link */}
        {onSwitchToSignUp && (
          <div className="text-center">
            <span className="text-sm text-gray-600">계정이 없으신가요? </span>
            <button
              type="button"
              onClick={onSwitchToSignUp}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              disabled={isLoading}
            >
              회원가입
            </button>
          </div>
        )}
      </form>
    </Modal>
  )
}

export default LoginForm