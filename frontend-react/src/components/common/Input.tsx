import React from 'react'
import { clsx } from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: 'default' | 'success' | 'error'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ 
  label,
  error,
  leftIcon,
  rightIcon,
  variant = 'default',
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  
  const baseClasses = 'block w-full rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0'
  
  const variantClasses = {
    default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
    success: 'border-success-300 focus:border-success-500 focus:ring-success-500',
    error: 'border-danger-300 focus:border-danger-500 focus:ring-danger-500'
  }
  
  const paddingClasses = leftIcon && rightIcon 
    ? 'pl-10 pr-10' 
    : leftIcon 
    ? 'pl-10 pr-3' 
    : rightIcon 
    ? 'pl-3 pr-10' 
    : 'px-3'
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">
              {leftIcon}
            </div>
          </div>
        )}
        
        <input
          id={inputId}
          className={clsx(
            baseClasses,
            variantClasses[variant],
            paddingClasses,
            'py-2',
            className
          )}
          ref={ref}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">
              {rightIcon}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  )
})

export default Input
