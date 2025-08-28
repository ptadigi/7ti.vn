import React from 'react'
import { clsx } from 'clsx'

interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
  variant?: 'default' | 'success' | 'error'
}

const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  placeholder,
  variant = 'default',
  className = '',
  id,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`
  
  const baseClasses = 'block w-full rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0'
  
  const variantClasses = {
    default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
    success: 'border-success-300 focus:border-success-500 focus:ring-success-500',
    error: 'border-danger-300 focus:border-danger-500 focus:ring-danger-500'
  }
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
        </label>
      )}
      
      <select
        id={selectId}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          'px-3 py-2',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="mt-1 text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  )
}

export default Select
