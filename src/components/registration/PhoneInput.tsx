import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { COUNTRIES } from './CountrySelector'

interface PhoneInputProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function PhoneInput({ value = '', onChange, placeholder = "Enter phone number", className }: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState('+1')
  const [phoneNumber, setPhoneNumber] = useState('')

  useEffect(() => {
    // Parse existing value if provided
    if (value && value.startsWith('+')) {
      const match = value.match(/^(\+\d{1,3})(.*)$/)
      if (match) {
        setCountryCode(match[1])
        setPhoneNumber(match[2])
      }
    } else {
      setPhoneNumber(value)
    }
  }, [value])

  const handleCountryChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode)
    onChange(`${newCountryCode}${phoneNumber}`)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value.replace(/[^\d]/g, '') // Only allow digits
    setPhoneNumber(newNumber)
    onChange(`${countryCode}${newNumber}`)
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <Select value={countryCode} onValueChange={handleCountryChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover border border-border shadow-lg z-50">
          {COUNTRIES.map((country) => (
            <SelectItem key={country.code} value={country.phone}>
              <div className="flex items-center gap-2">
                <span className="text-sm">{country.flag}</span>
                <span className="text-sm">{country.phone}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        className="flex-1"
      />
    </div>
  )
}