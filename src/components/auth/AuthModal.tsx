/**
 * Auth Modal Component
 * Main authentication modal that manages login, signup, and forgot password flows
 */

import React, { useState, useCallback } from 'react'
import { LoginForm } from './LoginForm'
import { SignUpForm } from './SignUpForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'

type AuthModalType = 'login' | 'signup' | 'forgot-password'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialView?: AuthModalType
  onSuccess?: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialView = 'login',
  onSuccess
}) => {
  const [currentView, setCurrentView] = useState<AuthModalType>(initialView)

  const handleSuccess = useCallback(() => {
    onSuccess?.()
    onClose()
  }, [onSuccess, onClose])

  const handleClose = useCallback(() => {
    setCurrentView('login') // Reset to login view when closing
    onClose()
  }, [onClose])

  const switchToLogin = useCallback(() => {
    setCurrentView('login')
  }, [])

  const switchToSignUp = useCallback(() => {
    setCurrentView('signup')
  }, [])

  const switchToForgotPassword = useCallback(() => {
    setCurrentView('forgot-password')
  }, [])

  // Reset view when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentView(initialView)
    }
  }, [isOpen, initialView])

  // Render current view
  switch (currentView) {
    case 'login':
      return (
        <LoginForm
          isOpen={isOpen}
          onClose={handleClose}
          onSuccess={handleSuccess}
          onSwitchToSignUp={switchToSignUp}
          onForgotPassword={switchToForgotPassword}
        />
      )

    case 'signup':
      return (
        <SignUpForm
          isOpen={isOpen}
          onClose={handleClose}
          onSuccess={handleSuccess}
          onSwitchToLogin={switchToLogin}
        />
      )

    case 'forgot-password':
      return (
        <ForgotPasswordForm
          isOpen={isOpen}
          onClose={handleClose}
          onBackToLogin={switchToLogin}
        />
      )

    default:
      return null
  }
}

export default AuthModal