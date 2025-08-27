import * as React from "react"
import { cn } from "@/lib/utils"

interface InputOTPProps {
  value: string
  onChange: (value: string) => void
  length?: number
  onComplete?: (value: string) => void
  className?: string
  disabled?: boolean
  placeholder?: string
}

const InputOTPEnhanced = React.forwardRef<HTMLInputElement, InputOTPProps>(
  ({ className, value, onChange, length = 6, onComplete, disabled, placeholder }, ref) => {
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])
    const [localValue, setLocalValue] = React.useState(value || '')

    React.useEffect(() => {
      setLocalValue(value)
    }, [value])

    const handleChange = (index: number, inputValue: string) => {
      // Only allow digits
      if (inputValue && !/^\d$/.test(inputValue)) {
        return
      }

      const newValue = localValue.split('')
      newValue[index] = inputValue
      const updatedValue = newValue.join('').slice(0, length)
      
      setLocalValue(updatedValue)
      onChange(updatedValue)

      // Auto-focus next input
      if (inputValue && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }

      // Call onComplete when all digits are entered
      if (updatedValue.length === length && onComplete) {
        onComplete(updatedValue)
      }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !localValue[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
      if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
      if (e.key === 'ArrowRight' && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault()
      const pastedData = e.clipboardData.getData('text')
      const digits = pastedData.replace(/\D/g, '').slice(0, length)
      setLocalValue(digits)
      onChange(digits)
      
      if (digits.length === length && onComplete) {
        onComplete(digits)
      }
      
      // Focus the last filled input or the next empty one
      const nextIndex = Math.min(digits.length, length - 1)
      inputRefs.current[nextIndex]?.focus()
    }

    return (
      <div className="flex gap-2 justify-center">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
              if (index === 0 && ref) {
                if (typeof ref === 'function') {
                  ref(el)
                } else {
                  ref.current = el
                }
              }
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={localValue[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            placeholder={placeholder}
            className={cn(
              "w-12 h-12 text-center text-lg font-semibold rounded-md border border-input bg-background ring-offset-background transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
          />
        ))}
      </div>
    )
  }
)

InputOTPEnhanced.displayName = "InputOTPEnhanced"

export { InputOTPEnhanced }