import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸', phone: '+1' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', phone: '+1' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', phone: '+44' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', phone: '+61' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', phone: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', phone: '+33' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', phone: '+39' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', phone: '+34' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', phone: '+31' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', phone: '+32' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', phone: '+41' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', phone: '+43' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', phone: '+46' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', phone: '+47' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', phone: '+45' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', phone: '+358' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', phone: '+353' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', phone: '+351' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', phone: '+48' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', phone: '+420' },
]

interface CountrySelectorProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function CountrySelector({ value, onValueChange, placeholder = "Select country", className }: CountrySelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-popover border border-border shadow-lg z-50">
        {COUNTRIES.map((country) => (
          <SelectItem key={country.code} value={country.name}>
            <div className="flex items-center gap-2">
              <span className="text-base">{country.flag}</span>
              <span>{country.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function getCountryPhoneCode(countryName: string): string {
  const country = COUNTRIES.find(c => c.name === countryName)
  return country?.phone || '+1'
}

export { COUNTRIES }