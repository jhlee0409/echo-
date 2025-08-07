import { FC, ReactNode, ButtonHTMLAttributes } from 'react'
import { cn } from '@utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'neon'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-navy disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-neon-blue hover:bg-neon-blue/80 text-dark-navy focus:ring-neon-blue/50',
    secondary: 'bg-ui-surface-200 hover:bg-ui-surface-300 text-ui-text-100 focus:ring-ui-surface-300',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500/50',
    ghost: 'bg-transparent hover:bg-ui-surface-100 text-ui-text-200 focus:ring-ui-surface-200',
    neon: 'bg-transparent border-2 border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-dark-navy focus:ring-neon-blue/50 glow-neon'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        loading && 'pointer-events-none',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  )
}

export default Button