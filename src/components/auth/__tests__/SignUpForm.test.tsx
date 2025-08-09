/**
 * SignUpForm Component Test Suite
 * Tests for registration form functionality and validation
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/tests/utils/test-utils'
import { SignUpForm } from '../SignUpForm'
import { authService } from '@/services/auth/AuthService'

// Mock auth service
vi.mock('@/services/auth/AuthService', () => ({
  authService: {
    signUp: vi.fn()
  }
}))

describe('SignUpForm', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    onSwitchToLogin: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render signup form when open', () => {
      render(<SignUpForm {...defaultProps} />)

      expect(screen.getByText('회원가입')).toBeInTheDocument()
      expect(screen.getByLabelText('이메일 *')).toBeInTheDocument()
      expect(screen.getByLabelText('표시 이름 *')).toBeInTheDocument()
      expect(screen.getByLabelText('사용자명 (선택)')).toBeInTheDocument()
      expect(screen.getByLabelText('비밀번호 *')).toBeInTheDocument()
      expect(screen.getByLabelText('비밀번호 확인 *')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '계정 만들기' })).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(<SignUpForm {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('회원가입')).not.toBeInTheDocument()
    })

    it('should render terms acceptance checkbox', () => {
      render(<SignUpForm {...defaultProps} />)

      const termsCheckbox = screen.getByRole('checkbox')
      expect(termsCheckbox).toBeInTheDocument()
      expect(screen.getByText(/이용약관 및 개인정보처리방침에 동의합니다/)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show validation errors for empty required fields', async () => {
      render(<SignUpForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: '계정 만들기' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('이메일을 입력해주세요')).toBeInTheDocument()
        expect(screen.getByText('표시 이름을 입력해주세요')).toBeInTheDocument()
        expect(screen.getByText('비밀번호를 입력해주세요')).toBeInTheDocument()
        expect(screen.getByText('비밀번호 확인을 입력해주세요')).toBeInTheDocument()
        expect(screen.getByText('이용약관에 동의해주세요')).toBeInTheDocument()
      })

      expect(authService.signUp).not.toHaveBeenCalled()
    })

    it('should validate email format', async () => {
      render(<SignUpForm {...defaultProps} />)

      const emailInput = screen.getByLabelText('이메일 *')
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

      const submitButton = screen.getByRole('button', { name: '계정 만들기' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('올바른 이메일 형식을 입력해주세요')).toBeInTheDocument()
      })
    })

    it('should validate password strength', async () => {
      render(<SignUpForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText('비밀번호 *')
      fireEvent.change(passwordInput, { target: { value: '123' } })

      const submitButton = screen.getByRole('button', { name: '계정 만들기' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('비밀번호는 최소 8자 이상이어야 합니다')).toBeInTheDocument()
      })
    })

    it('should validate password complexity', async () => {
      render(<SignUpForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText('비밀번호 *')
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      const submitButton = screen.getByRole('button', { name: '계정 만들기' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다')).toBeInTheDocument()
      })
    })

    it('should validate password confirmation match', async () => {
      render(<SignUpForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText('비밀번호 *')
      fireEvent.change(passwordInput, { target: { value: 'Password123' } })

      const confirmPasswordInput = screen.getByLabelText('비밀번호 확인 *')
      fireEvent.change(confirmPasswordInput, { target: { value: 'Different123' } })

      const submitButton = screen.getByRole('button', { name: '계정 만들기' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('비밀번호가 일치하지 않습니다')).toBeInTheDocument()
      })
    })

    it('should validate display name length', async () => {
      render(<SignUpForm {...defaultProps} />)

      const displayNameInput = screen.getByLabelText('표시 이름 *')
      fireEvent.change(displayNameInput, { target: { value: 'a' } })

      const submitButton = screen.getByRole('button', { name: '계정 만들기' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('표시 이름은 최소 2자 이상이어야 합니다')).toBeInTheDocument()
      })
    })

    it('should validate username format when provided', async () => {
      render(<SignUpForm {...defaultProps} />)

      const usernameInput = screen.getByLabelText('사용자명 (선택)')
      fireEvent.change(usernameInput, { target: { value: 'ab' } })

      const submitButton = screen.getByRole('button', { name: '계정 만들기' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('사용자명은 3-20자의 영문, 숫자, 언더스코어만 사용 가능합니다')).toBeInTheDocument()
      })
    })

    it('should not validate empty username (optional field)', async () => {
      render(<SignUpForm {...defaultProps} />)

      // Fill all required fields correctly except username
      fireEvent.change(screen.getByLabelText('이메일 *'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('표시 이름 *'), { target: { value: 'Test User' } })
      fireEvent.change(screen.getByLabelText('비밀번호 *'), { target: { value: 'Password123' } })
      fireEvent.change(screen.getByLabelText('비밀번호 확인 *'), { target: { value: 'Password123' } })
      fireEvent.click(screen.getByRole('checkbox'))

      // Username is left empty - should be valid
      const submitButton = screen.getByRole('button', { name: '계정 만들기' })
      fireEvent.click(submitButton)

      // Should not show username validation error
      await waitFor(() => {
        expect(screen.queryByText(/사용자명은/)).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    const fillValidForm = () => {
      fireEvent.change(screen.getByLabelText('이메일 *'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('표시 이름 *'), { target: { value: 'Test User' } })
      fireEvent.change(screen.getByLabelText('사용자명 (선택)'), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText('비밀번호 *'), { target: { value: 'Password123' } })
      fireEvent.change(screen.getByLabelText('비밀번호 확인 *'), { target: { value: 'Password123' } })
      fireEvent.click(screen.getByRole('checkbox'))
    }

    it('should submit form with correct data on successful validation', async () => {
      vi.mocked(authService.signUp).mockResolvedValue({
        success: true,
        user: { id: 'user-123', email: 'test@example.com' } as any,
        session: {} as any,
        error: null
      })

      render(<SignUpForm {...defaultProps} />)
      fillValidForm()

      const submitButton = screen.getByRole('button', { name: '계정 만들기' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(authService.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'Password123',
          displayName: 'Test User',
          username: 'testuser',
          language: 'ko',
          timezone: expect.any(String)
        })
      })

      expect(defaultProps.onSuccess).toHaveBeenCalled()
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('should handle optional username correctly', async () => {
      vi.mocked(authService.signUp).mockResolvedValue({
        success: true,
        user: { id: 'user-123' } as any,
        session: {} as any,
        error: null
      })

      render(<SignUpForm {...defaultProps} />)
      
      // Fill form without username
      fireEvent.change(screen.getByLabelText('이메일 *'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('표시 이름 *'), { target: { value: 'Test User' } })
      fireEvent.change(screen.getByLabelText('비밀번호 *'), { target: { value: 'Password123' } })
      fireEvent.change(screen.getByLabelText('비밀번호 확인 *'), { target: { value: 'Password123' } })
      fireEvent.click(screen.getByRole('checkbox'))

      const submitButton = screen.getByRole('button', { name: '계정 만들기' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(authService.signUp).toHaveBeenCalledWith(
          expect.objectContaining({
            username: undefined // Empty username should become undefined
          })
        )
      })
    })

    it('should show error message on signup failure', async () => {
      const error = { message: '이미 사용 중인 이메일입니다.' }
      vi.mocked(authService.signUp).mockResolvedValue({
        success: false,
        user: null,
        session: null,
        error: error as any
      })

      render(<SignUpForm {...defaultProps} />)
      fillValidForm()

      const submitButton = screen.getByRole('button', { name: '계정 만들기' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('이미 사용 중인 이메일입니다.')).toBeInTheDocument()
      })

      expect(defaultProps.onSuccess).not.toHaveBeenCalled()
    })

    it('should handle unexpected errors gracefully', async () => {
      vi.mocked(authService.signUp).mockRejectedValue(new Error('Network error'))

      render(<SignUpForm {...defaultProps} />)
      fillValidForm()

      const submitButton = screen.getByRole('button', { name: '계정 만들기' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.')).toBeInTheDocument()
      })
    })

    it('should show loading state during submission', async () => {
      let resolveSignUp: (value: any) => void
      const signUpPromise = new Promise((resolve) => {
        resolveSignUp = resolve
      })
      vi.mocked(authService.signUp).mockReturnValue(signUpPromise)

      render(<SignUpForm {...defaultProps} />)
      fillValidForm()

      const submitButton = screen.getByRole('button', { name: '계정 만들기' })
      fireEvent.click(submitButton)

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText('계정 생성 중...')).toBeInTheDocument()
      })

      // Form should be disabled during loading
      expect(screen.getByLabelText('이메일 *')).toBeDisabled()
      expect(submitButton).toBeDisabled()

      // Resolve the promise
      resolveSignUp!({
        success: true,
        user: { id: 'user-123' },
        session: {},
        error: null
      })

      await waitFor(() => {
        expect(screen.queryByText('계정 생성 중...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Field Error Clearing', () => {
    it('should clear field errors when user starts typing', async () => {
      render(<SignUpForm {...defaultProps} />)

      // Trigger validation errors
      const submitButton = screen.getByRole('button', { name: '계정 만들기' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('이메일을 입력해주세요')).toBeInTheDocument()
      })

      // Start typing in email field
      const emailInput = screen.getByLabelText('이메일 *')
      fireEvent.change(emailInput, { target: { value: 't' } })

      await waitFor(() => {
        expect(screen.queryByText('이메일을 입력해주세요')).not.toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should call onSwitchToLogin when login link is clicked', () => {
      render(<SignUpForm {...defaultProps} />)

      const loginLink = screen.getByText('로그인')
      fireEvent.click(loginLink)

      expect(defaultProps.onSwitchToLogin).toHaveBeenCalled()
    })

    it('should not render login link when onSwitchToLogin is not provided', () => {
      const props = { ...defaultProps, onSwitchToLogin: undefined }
      render(<SignUpForm {...props} />)

      expect(screen.queryByText('이미 계정이 있으신가요?')).not.toBeInTheDocument()
    })
  })

  describe('Form Reset', () => {
    it('should reset form when modal closes', () => {
      const { rerender } = render(<SignUpForm {...defaultProps} />)

      // Fill form
      fireEvent.change(screen.getByLabelText('이메일 *'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('표시 이름 *'), { target: { value: 'Test User' } })

      // Close and reopen modal
      rerender(<SignUpForm {...defaultProps} isOpen={false} />)
      rerender(<SignUpForm {...defaultProps} isOpen={true} />)

      // Form should be reset
      expect(screen.getByLabelText('이메일 *')).toHaveValue('')
      expect(screen.getByLabelText('표시 이름 *')).toHaveValue('')
      expect(screen.getByRole('checkbox')).not.toBeChecked()
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels and associations', () => {
      render(<SignUpForm {...defaultProps} />)

      const emailInput = screen.getByLabelText('이메일 *')
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('autoComplete', 'email')

      const passwordInput = screen.getByLabelText('비밀번호 *')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('autoComplete', 'new-password')

      const confirmPasswordInput = screen.getByLabelText('비밀번호 확인 *')
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('autoComplete', 'new-password')
    })

    it('should show password requirements help text', () => {
      render(<SignUpForm {...defaultProps} />)

      expect(screen.getByText('8자 이상, 대소문자와 숫자 포함')).toBeInTheDocument()
      expect(screen.getByText('3-20자, 영문, 숫자, _ 사용 가능')).toBeInTheDocument()
    })
  })
})