import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Here you could send error to logging service
    if (import.meta.env.PROD) {
      // TODO: Send to error reporting service (e.g., Sentry)
      console.log('Would send error to reporting service in production')
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-navy flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-dark-surface rounded-lg border border-ui-border-200 p-6">
            <div className="text-center">
              {/* Error icon */}
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              {/* Error message */}
              <h2 className="text-xl font-bold text-red-400 mb-2">
                오류가 발생했습니다
              </h2>
              <p className="text-ui-text-200 mb-2">
                Something went wrong
              </p>
              
              {/* Error details in development */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-sm text-ui-text-300 cursor-pointer mb-2">
                    Error Details (Dev Mode)
                  </summary>
                  <pre className="text-xs text-red-300 bg-dark-navy/50 p-3 rounded border overflow-auto">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              
              {/* Action buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={this.handleReset}
                  className="flex-1 bg-neon-blue hover:bg-neon-blue/80 text-dark-navy px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  다시 시도 / Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-ui-surface-200 hover:bg-ui-surface-300 text-ui-text-100 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  새로고침 / Reload
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary