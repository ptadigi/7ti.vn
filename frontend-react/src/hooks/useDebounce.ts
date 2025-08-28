import { useState, useEffect } from 'react'

/**
 * Custom hook for debouncing values
 * Useful for search inputs, API calls, and other expensive operations
 * 
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns The debounced value
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearchTerm = useDebounce(searchTerm, 500)
 * 
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     // Make API call with debounced value
 *     searchAPI(debouncedSearchTerm)
 *   }
 * }, [debouncedSearchTerm])
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up the timeout if value changes or component unmounts
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Custom hook for debouncing function calls
 * Useful for preventing excessive API calls or expensive operations
 * 
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns The debounced function
 * 
 * @example
 * ```tsx
 * const debouncedSave = useDebouncedCallback(
 *   (data) => saveToAPI(data),
 *   1000
 * )
 * 
 * // This will only execute once after 1 second of no calls
 * debouncedSave(formData)
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  return (...args: Parameters<T>) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Set new timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args)
    }, delay)

    setTimeoutId(newTimeoutId)
  }
}

/**
 * Custom hook for debouncing with immediate execution option
 * Useful when you want to execute immediately on first call
 * 
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 300ms)
 * @param immediate - Whether to execute immediately on first call (default: false)
 * @returns The debounced value and a function to trigger immediate execution
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('')
 * const { debouncedValue, executeImmediately } = useDebounceWithImmediate(searchTerm, 500, true)
 * 
 * const handleSearch = () => {
 *   executeImmediately() // Execute immediately
 * }
 * ```
 */
export function useDebounceWithImmediate<T>(
  value: T,
  delay: number = 300,
  immediate: boolean = false
) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const [isFirstCall, setIsFirstCall] = useState(true)

  useEffect(() => {
    if (immediate && isFirstCall) {
      setDebouncedValue(value)
      setIsFirstCall(false)
      return
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value)
      setIsFirstCall(false)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay, immediate, isFirstCall])

  const executeImmediately = () => {
    setDebouncedValue(value)
    setIsFirstCall(false)
  }

  return { debouncedValue, executeImmediately }
}

/**
 * Custom hook for debouncing with cancel functionality
 * Useful when you need to cancel pending debounced operations
 * 
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns The debounced value and a function to cancel the operation
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('')
 * const { debouncedValue, cancel } = useDebounceWithCancel(searchTerm, 500)
 * 
 * const handleCancel = () => {
 *   cancel() // Cancel pending debounced operation
 * }
 * ```
 */
export function useDebounceWithCancel<T>(
  value: T,
  delay: number = 300
) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    const newTimeoutId = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    setTimeoutId(newTimeoutId)

    return () => {
      if (newTimeoutId) {
        clearTimeout(newTimeoutId)
      }
    }
  }, [value, delay])

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
  }

  return { debouncedValue, cancel }
}

/**
 * Custom hook for debouncing with leading and trailing options
 * Similar to lodash debounce with more control
 * 
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 300ms)
 * @param options - Options for leading and trailing execution
 * @returns The debounced value
 * 
 * @example
 * ```tsx
 * const [scrollPosition, setScrollPosition] = useState(0)
 * const debouncedScroll = useDebounceAdvanced(scrollPosition, 100, {
 *   leading: true,  // Execute on first call
 *   trailing: true  // Execute after delay
 * })
 * ```
 */
export function useDebounceAdvanced<T>(
  value: T,
  delay: number = 300,
  options: {
    leading?: boolean
    trailing?: boolean
  } = {}
) {
  const { leading = false, trailing = true } = options
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const [isFirstCall, setIsFirstCall] = useState(true)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Execute immediately on first call if leading is true
    if (leading && isFirstCall) {
      setDebouncedValue(value)
      setIsFirstCall(false)
      return
    }

    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Set new timeout if trailing is true
    if (trailing) {
      const newTimeoutId = setTimeout(() => {
        setDebouncedValue(value)
        setIsFirstCall(false)
      }, delay)

      setTimeoutId(newTimeoutId)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [value, delay, leading, trailing, isFirstCall, timeoutId])

  return debouncedValue
}
