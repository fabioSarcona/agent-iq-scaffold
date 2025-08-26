import { z } from 'zod'

export const phoneSchema = z.object({
  countryCode: z.string().min(2, 'Please select a country code.').max(2),
  national: z.string()
    .min(6, 'Phone number must be at least 6 digits.')
    .max(15, 'Phone number cannot exceed 15 digits.')
    .regex(/^\d+$/, 'Phone number can only contain digits.')
})

export const registrationFieldSchemas = {
  firstName: z.string().trim().min(2, 'Please enter at least 2 characters.'),
  lastName: z.string().trim().min(2, 'Please enter at least 2 characters.'),
  email: z.string().trim().email('Please enter a valid email address.'),
  phone: phoneSchema,
  businessName: z.string().trim().min(2, 'Business/Clinic name is required.'),
  role: z.enum(['Owner', 'Manager', 'Front Desk', 'Operations', 'Other'], {
    errorMap: () => ({ message: 'Please select your role.' })
  }),
  city: z.string().trim().min(2, 'City is required.'),
  country: z.string().min(2, 'Please select your country.')
}

export const fullRegistrationSchema = z.object(registrationFieldSchemas)

export type RegistrationFormData = z.infer<typeof fullRegistrationSchema>

export function validateRegistrationField(key: keyof typeof registrationFieldSchemas, value: any): { success: boolean; error?: string } {
  try {
    registrationFieldSchemas[key].parse(value)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Invalid input.' }
    }
    return { success: false, error: 'Invalid input.' }
  }
}

// Helper to format E.164 phone number
export function formatE164Phone(countryCode: string, national: string): string {
  // Map common country codes to their dial codes
  const dialCodes: Record<string, string> = {
    'US': '1', 'CA': '1', 'GB': '44', 'DE': '49', 'FR': '33', 
    'IT': '39', 'ES': '34', 'AU': '61', 'JP': '81', 'KR': '82',
    'CN': '86', 'IN': '91', 'BR': '55', 'MX': '52', 'RU': '7'
  }
  
  const dialCode = dialCodes[countryCode] || '1'
  return `+${dialCode}${national}`
}