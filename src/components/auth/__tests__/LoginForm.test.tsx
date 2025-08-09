/**
 * LoginForm Component Test Suite
 * Tests for login form functionality and validation
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/tests/utils/test-utils'
import { LoginForm } from '../LoginForm'
import { authService } from '@/services/auth/AuthService'

// Mock auth service
vi.mock('@/services/auth/AuthService', () => ({
  authService: {
    signIn: vi.fn()
  }
}))

describe('LoginForm', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    onSwitchToSignUp: vi.fn(),
    onForgotPassword: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render login form when open', () => {
      render(<LoginForm {...defaultProps} />)

      expect(screen.getByText('로그인')).toBeInTheDocument()
      expect(screen.getByLabelText('이메일')).toBeInTheDocument()
      expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(<LoginForm {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('로그인')).not.toBeInTheDocument()
    })

    it('should render all form elements correctly', () => {
      render(<LoginForm {...defaultProps} />)

      // Form fields
      expect(screen.getByLabelText('이메일')).toHaveAttribute('type', 'email')
      expect(screen.getByLabelText('비밀번호')).toHaveAttribute('type', 'password')
      
      // Checkbox
      expect(screen.getByLabelText('로그인 상태 유지')).toHaveAttribute('type', 'checkbox')
      
      // Links
      expect(screen.getByText('비밀번호를 잊으셨나요?')).toBeInTheDocument()
      expect(screen.getByText('회원가입')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show validation errors for empty fields', async () => {
      render(<LoginForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: '로그인' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('이메일을 입력해주세요')).toBeInTheDocument()
        expect(screen.getByText('비밀번호를 입력해주세요')).toBeInTheDocument()
      })

      expect(authService.signIn).not.toHaveBeenCalled()
    })

    it('should show validation error for invalid email format', async () => {
      render(<LoginForm {...defaultProps} />)

      const emailInput = screen.getByLabelText('이메일')
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

      const passwordInput = screen.getByLabelText('비밀번호')
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      const submitButton = screen.getByRole('button', { name: '로그인' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('올바른 이메일 형식을 입력해주세요')).toBeInTheDocument()
      })

      expect(authService.signIn).not.toHaveBeenCalled()
    })

    it('should show validation error for short password', async () => {
      render(<LoginForm {...defaultProps} />)

      const emailInput = screen.getByLabelText('이메일')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const passwordInput = screen.getByLabelText('비밀번호')
      fireEvent.change(passwordInput, { target: { value: '123' } })

      const submitButton = screen.getByRole('button', { name: '로그인' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('비밀번호는 최소 6자 이상이어야 합니다')).toBeInTheDocument()
      })

      expect(authService.signIn).not.toHaveBeenCalled()
    })

    it('should clear field errors when user starts typing', async () => {
      render(<LoginForm {...defaultProps} />)

      // Trigger validation errors first
      const submitButton = screen.getByRole('button', { name: '로그인' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('이메일을 입력해주세요')).toBeInTheDocument()
      })

      // Start typing in email field
      const emailInput = screen.getByLabelText('이메일')
      fireEvent.change(emailInput, { target: { value: 't' } })

      await waitFor(() => {
        expect(screen.queryByText('이메일을 입력해주세요')).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form with correct data on successful validation', async () => {
      vi.mocked(authService.signIn).mockResolvedValue({
        success: true,
        user: { id: 'user-123', email: 'test@example.com' } as any,
        session: {} as any,
        error: null
      })

      render(<LoginForm {...defaultProps} />)

      // Fill form
      const emailInput = screen.getByLabelText('이메일')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const passwordInput = screen.getByLabelText('비밀번호')
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      const rememberMeCheckbox = screen.getByLabelText('로그인 상태 유지')
      fireEvent.click(rememberMeCheckbox)

      // Submit form
      const submitButton = screen.getByRole('button', { name: '로그인' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(authService.signIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          rememberMe: true
        })
      })

      expect(defaultProps.onSuccess).toHaveBeenCalled()
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('should show error message on login failure', async () => {
      const error = { message: '잘못된 로그인 정보입니다.' }
      vi.mocked(authService.signIn).mockResolvedValue({
        success: false,
        user: null,
        session: null,
        error: error as any
      })

      render(<LoginForm {...defaultProps} />)

      // Fill form
      const emailInput = screen.getByLabelText('이메일')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const passwordInput = screen.getByLabelText('비밀번호')
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: '로그인' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('잘못된 로그인 정보입니다.')).toBeInTheDocument()
      })

      expect(defaultProps.onSuccess).not.toHaveBeenCalled()
      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })

    it('should handle unexpected errors gracefully', async () => {
      vi.mocked(authService.signIn).mockRejectedValue(new Error('Network error'))

      render(<LoginForm {...defaultProps} />)

      // Fill form
      const emailInput = screen.getByLabelText('이메일')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const passwordInput = screen.getByLabelText('비밀번호')
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: '로그인' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('로그인 중 오류가 발생했습니다. 다시 시도해주세요.')).toBeInTheDocument()
      })
    })

    it('should show loading state during submission', async () => {
      let resolveSignIn: (value: any) => void
      const signInPromise = new Promise((resolve) => {
        resolveSignIn = resolve
      })
      vi.mocked(authService.signIn).mockReturnValue(signInPromise)

      render(<LoginForm {...defaultProps} />)

      // Fill form
      const emailInput = screen.getByLabelText('이메일')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const passwordInput = screen.getByLabelText('비밀번호')
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: '로그인' })
      fireEvent.click(submitButton)

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText('로그인 중...')).toBeInTheDocument()
      })

      // Form should be disabled during loading
      expect(emailInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()
      expect(submitButton).toBeDisabled()

      // Resolve the promise
      resolveSignIn!({
        success: true,
        user: { id: 'user-123' },
        session: {},
        error: null
      })

      await waitFor(() => {
        expect(screen.queryByText('로그인 중...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should call onSwitchToSignUp when signup link is clicked', () => {
      render(<LoginForm {...defaultProps} />)

      const signupLink = screen.getByText('회원가입')
      fireEvent.click(signupLink)

      expect(defaultProps.onSwitchToSignUp).toHaveBeenCalled()
    })

    it('should call onForgotPassword when forgot password link is clicked', () => {
      render(<LoginForm {...defaultProps} />)

      const forgotPasswordLink = screen.getByText('비밀번호를 잊으셨나요?')
      fireEvent.click(forgotPasswordLink)

      expect(defaultProps.onForgotPassword).toHaveBeenCalled()
    })

    it('should not render signup link when onSwitchToSignUp is not provided', () => {
      const props = { ...defaultProps, onSwitchToSignUp: undefined }
      render(<LoginForm {...props} />)

      expect(screen.queryByText('회원가입')).not.toBeInTheDocument()
    })

    it('should not render forgot password link when onForgotPassword is not provided', () => {
      const props = { ...defaultProps, onForgotPassword: undefined }
      render(<LoginForm {...props} />)

      expect(screen.queryByText('비밀번호를 잊으셨나요?')).not.toBeInTheDocument()
    })
  })

  describe('Modal Behavior', () => {
    it('should reset form when modal closes', () => {
      const { rerender } = render(<LoginForm {...defaultProps} />)

      // Fill form
      const emailInput = screen.getByLabelText('이메일')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const passwordInput = screen.getByLabelText('비밀번호')
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // Close and reopen modal
      rerender(<LoginForm {...defaultProps} isOpen={false} />)
      rerender(<LoginForm {...defaultProps} isOpen={true} />)

      // Form should be reset
      expect(screen.getByLabelText('이메일')).toHaveValue('')
      expect(screen.getByLabelText('비밀번호')).toHaveValue('')
      expect(screen.getByLabelText('로그인 상태 유지')).not.toBeChecked()
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels and associations', () => {
      render(<LoginForm {...defaultProps} />)

      const emailInput = screen.getByLabelText('이메일')
      expect(emailInput).toHaveAttribute('id')
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('autoComplete', 'email')

      const passwordInput = screen.getByLabelText('비밀번호')
      expect(passwordInput).toHaveAttribute('id')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password')
    })

    it('should have proper error message associations', async () => {
      render(<LoginForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: '로그인' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const emailInput = screen.getByLabelText('이메일')
        const errorMessage = screen.getByText('이메일을 입력해주세요')
        
        expect(emailInput).toHaveClass('border-red-300')
        expect(errorMessage).toBeInTheDocument()
      })
    })
  })
})