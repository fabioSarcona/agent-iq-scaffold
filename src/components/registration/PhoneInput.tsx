import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Phone } from '../../../modules/registration/types'

interface PhoneInputProps {
  value?: string
  onChange: (value: Phone) => void
  placeholder?: string
  className?: string
}

const DIAL_CODES = [
  { code: 'US', name: 'United States', flag: '🇺🇸', dial: '+1' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dial: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dial: '+44' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dial: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dial: '+33' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', dial: '+39' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', dial: '+34' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dial: '+61' },
]

export function PhoneInput({ value = '', onChange, placeholder = "Enter phone number", className }: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState('US')
  const [phoneNumber, setPhoneNumber] = useState('')

  useEffect(() => {
    // Parse existing E.164 value if provided
    if (value && value.startsWith('+')) {
      const match = value.match(/^\+(\d{1,3})(.*)$/)
      if (match) {
        const dialCode = `+${match[1]}`
        const national = match[2]
        const country = DIAL_CODES.find(c => c.dial === dialCode)
        if (country) {
          setCountryCode(country.code)
          setPhoneNumber(national)
        }
      }
    }
  }, [value])

  const handleCountryChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode)
    onChange({ countryCode: newCountryCode, national: phoneNumber })
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value.replace(/[^\d]/g, '') // Only allow digits
    setPhoneNumber(newNumber)
    onChange({ countryCode, national: newNumber })
  }

  const selectedCountry = DIAL_CODES.find(c => c.code === countryCode) || DIAL_CODES[0]

  return (
    <div className={`flex gap-2 ${className}`}>
      <Select value={countryCode} onValueChange={handleCountryChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span>{selectedCountry.flag}</span>
              <span>{selectedCountry.dial}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-popover border border-border shadow-lg z-50">
          {DIAL_CODES.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <div className="flex items-center gap-2">
                <span className="text-sm">{country.flag}</span>
                <span className="text-sm">{country.dial}</span>
                <span className="text-sm">{country.name}</span>
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