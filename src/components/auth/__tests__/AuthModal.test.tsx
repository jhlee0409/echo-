/**
 * AuthModal Component Test Suite
 * Tests for authentication modal navigation and flow management
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@/tests/utils/test-utils'
import { AuthModal } from '../AuthModal'

// Mock the individual form components
vi.mock('../LoginForm', () => ({
  LoginForm: ({ isOpen, onClose, onSuccess, onSwitchToSignUp, onForgotPassword }: any) => (
    <div>
      Login Form - {isOpen ? 'Open' : 'Closed'}
      <button onClick={onSuccess}>Login Success</button>
      <button onClick={onClose}>Close Login</button>
      <button onClick={onSwitchToSignUp}>Switch to SignUp</button>
      <button onClick={onForgotPassword}>Forgot Password</button>
    </div>
  )
}))

vi.mock('../SignUpForm', () => ({
  SignUpForm: ({ isOpen, onClose, onSuccess, onSwitchToLogin }: any) => (
    <div>
      SignUp Form - {isOpen ? 'Open' : 'Closed'}
      <button onClick={onSuccess}>SignUp Success</button>
      <button onClick={onClose}>Close SignUp</button>
      <button onClick={onSwitchToLogin}>Switch to Login</button>
    </div>
  )
}))

vi.mock('../ForgotPasswordForm', () => ({
  ForgotPasswordForm: ({ isOpen, onClose, onBackToLogin }: any) => (
    <div>
      ForgotPassword Form - {isOpen ? 'Open' : 'Closed'}
      <button onClick={onClose}>Close ForgotPassword</button>
      <button onClick={onBackToLogin}>Back to Login</button>
    </div>
  )
}))

describe('AuthModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('should render login form by default', () => {
      render(<AuthModal {...defaultProps} />)

      expect(screen.getByText('Login Form - Open')).toBeInTheDocument()
      expect(screen.queryByText('SignUp Form - Open')).not.toBeInTheDocument()
      expect(screen.queryByText('ForgotPassword Form - Open')).not.toBeInTheDocument()
    })

    it('should render signup form when initialView is signup', () => {
      render(<AuthModal {...defaultProps} initialView="signup" />)

      expect(screen.getByText('SignUp Form - Open')).toBeInTheDocument()
      expect(screen.queryByText('Login Form - Open')).not.toBeInTheDocument()
      expect(screen.queryByText('ForgotPassword Form - Open')).not.toBeInTheDocument()
    })

    it('should render forgot password form when initialView is forgot-password', () => {
      render(<AuthModal {...defaultProps} initialView="forgot-password" />)

      expect(screen.getByText('ForgotPassword Form - Open')).toBeInTheDocument()
      expect(screen.queryByText('Login Form - Open')).not.toBeInTheDocument()
      expect(screen.queryByText('SignUp Form - Open')).not.toBeInTheDocument()
    })
  })

  describe('View Navigation', () => {
    it('should switch from login to signup', () => {
      render(<AuthModal {...defaultProps} />)

      // Initially shows login form
      expect(screen.getByText('Login Form - Open')).toBeInTheDocument()

      // Click switch to signup button
      const switchToSignUpButton = screen.getByText('Switch to SignUp')
      fireEvent.click(switchToSignUpButton)

      // Should now show signup form
      expect(screen.getByText('SignUp Form - Open')).toBeInTheDocument()
      expect(screen.queryByText('Login Form - Open')).not.toBeInTheDocument()
    })

    it('should switch from signup to login', () => {
      render(<AuthModal {...defaultProps} initialView="signup" />)

      // Initially shows signup form
      expect(screen.getByText('SignUp Form - Open')).toBeInTheDocument()

      // Click switch to login button
      const switchToLoginButton = screen.getByText('Switch to Login')
      fireEvent.click(switchToLoginButton)

      // Should now show login form
      expect(screen.getByText('Login Form - Open')).toBeInTheDocument()
      expect(screen.queryByText('SignUp Form - Open')).not.toBeInTheDocument()
    })

    it('should switch from login to forgot password', () => {
      render(<AuthModal {...defaultProps} />)

      // Initially shows login form
      expect(screen.getByText('Login Form - Open')).toBeInTheDocument()

      // Click forgot password button
      const forgotPasswordButton = screen.getByText('Forgot Password')
      fireEvent.click(forgotPasswordButton)

      // Should now show forgot password form
      expect(screen.getByText('ForgotPassword Form - Open')).toBeInTheDocument()
      expect(screen.queryByText('Login Form - Open')).not.toBeInTheDocument()
    })

    it('should switch from forgot password back to login', () => {
      render(<AuthModal {...defaultProps} initialView="forgot-password" />)

      // Initially shows forgot password form
      expect(screen.getByText('ForgotPassword Form - Open')).toBeInTheDocument()

      // Click back to login button
      const backToLoginButton = screen.getByText('Back to Login')
      fireEvent.click(backToLoginButton)

      // Should now show login form
      expect(screen.getByText('Login Form - Open')).toBeInTheDocument()
      expect(screen.queryByText('ForgotPassword Form - Open')).not.toBeInTheDocument()
    })
  })

  describe('Success Handling', () => {
    it('should call onSuccess and onClose when login succeeds', () => {
      render(<AuthModal {...defaultProps} />)

      const loginSuccessButton = screen.getByText('Login Success')
      fireEvent.click(loginSuccessButton)

      expect(defaultProps.onSuccess).toHaveBeenCalled()
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('should call onSuccess and onClose when signup succeeds', () => {
      render(<AuthModal {...defaultProps} initialView="signup" />)

      const signupSuccessButton = screen.getByText('SignUp Success')
      fireEvent.click(signupSuccessButton)

      expect(defaultProps.onSuccess).toHaveBeenCalled()
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  describe('Modal Close Handling', () => {
    it('should reset to login view when modal closes', () => {
      const { rerender } = render(<AuthModal {...defaultProps} initialView="signup" />)

      // Initially showing signup
      expect(screen.getByText('SignUp Form - Open')).toBeInTheDocument()

      // Close modal
      rerender(<AuthModal {...defaultProps} isOpen={false} initialView="signup" />)

      // Reopen modal
      rerender(<AuthModal {...defaultProps} isOpen={true} initialView="signup" />)

      // Should reset to login view (default)
      expect(screen.getByText('Login Form - Open')).toBeInTheDocument()
      expect(screen.queryByText('SignUp Form - Open')).not.toBeInTheDocument()
    })

    it('should call onClose when individual forms are closed', () => {
      render(<AuthModal {...defaultProps} />)

      const closeLoginButton = screen.getByText('Close Login')
      fireEvent.click(closeLoginButton)

      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  describe('Modal State Management', () => {
    it('should not render anything when modal is closed', () => {
      render(<AuthModal {...defaultProps} isOpen={false} />)

      expect(screen.queryByText(/Form - Open/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Form - Closed/)).not.toBeInTheDocument()
    })

    it('should reset to initialView when modal opens', () => {
      const { rerender } = render(<AuthModal {...defaultProps} isOpen={false} initialView="signup" />)

      // Switch to different view and close
      rerender(<AuthModal {...defaultProps} isOpen={true} initialView="signup" />)
      
      // Navigate to login
      const switchToLoginButton = screen.getByText('Switch to Login')
      fireEvent.click(switchToLoginButton)
      expect(screen.getByText('Login Form - Open')).toBeInTheDocument()

      // Close modal
      rerender(<AuthModal {...defaultProps} isOpen={false} initialView="signup" />)

      // Reopen modal - should show initialView (signup)
      rerender(<AuthModal {...defaultProps} isOpen={true} initialView="signup" />)
      expect(screen.getByText('SignUp Form - Open')).toBeInTheDocument()
    })
  })

  describe('Props Passing', () => {
    it('should pass correct props to login form', () => {
      render(<AuthModal {...defaultProps} />)

      // All expected buttons should be present
      expect(screen.getByText('Login Success')).toBeInTheDocument()
      expect(screen.getByText('Close Login')).toBeInTheDocument()
      expect(screen.getByText('Switch to SignUp')).toBeInTheDocument()
      expect(screen.getByText('Forgot Password')).toBeInTheDocument()
    })

    it('should pass correct props to signup form', () => {
      render(<AuthModal {...defaultProps} initialView="signup" />)

      // All expected buttons should be present
      expect(screen.getByText('SignUp Success')).toBeInTheDocument()
      expect(screen.getByText('Close SignUp')).toBeInTheDocument()
      expect(screen.getByText('Switch to Login')).toBeInTheDocument()
    })

    it('should pass correct props to forgot password form', () => {
      render(<AuthModal {...defaultProps} initialView="forgot-password" />)

      // All expected buttons should be present
      expect(screen.getByText('Close ForgotPassword')).toBeInTheDocument()
      expect(screen.getByText('Back to Login')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle invalid initialView gracefully', () => {
      // @ts-ignore - Testing invalid prop value
      render(<AuthModal {...defaultProps} initialView="invalid" />)

      // Should not render anything for invalid view
      expect(screen.queryByText(/Form - Open/)).not.toBeInTheDocument()
    })

    it('should handle multiple rapid view switches', () => {
      render(<AuthModal {...defaultProps} />)

      // Rapid view switches
      fireEvent.click(screen.getByText('Switch to SignUp'))
      expect(screen.getByText('SignUp Form - Open')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Switch to Login'))
      expect(screen.getByText('Login Form - Open')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Forgot Password'))
      expect(screen.getByText('ForgotPassword Form - Open')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Back to Login'))
      expect(screen.getByText('Login Form - Open')).toBeInTheDocument()
    })
  })
})