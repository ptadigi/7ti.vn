import React from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import Input from '../common/Input'

interface FormFieldProps {
  name: string
  label?: string
  placeholder?: string
  type?: string
  required?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  className?: string
  disabled?: boolean
}

const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  placeholder,
  type = 'text',
  required = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled = false,
}) => {
  const { control, formState: { errors } } = useFormContext()
  const error = errors[name]?.message as string

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Input
          {...field}
          label={label}
          placeholder={placeholder}
          type={type}
          error={error}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          className={className}
          disabled={disabled}
          required={required}
        />
      )}
    />
  )
}

export default FormField
