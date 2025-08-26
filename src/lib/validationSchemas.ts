import { z } from 'zod'

// Registration field validation schemas
export const firstNameSchema = z.string()
  .min(2, 'First name must be at least 2 characters')
  .max(50, 'First name must be less than 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')

export const lastNameSchema = z.string()
  .min(2, 'Last name must be at least 2 characters')
  .max(50, 'Last name must be less than 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')

export const emailSchema = z.string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(100, 'Email must be less than 100 characters')

export const phoneSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number (E.164 format)')

export const businessNameSchema = z.string()
  .min(2, 'Business name must be at least 2 characters')
  .max(100, 'Business name must be less than 100 characters')

export const roleSchema = z.string()
  .min(2, 'Role must be at least 2 characters')
  .max(50, 'Role must be less than 50 characters')

export const citySchema = z.string()
  .min(2, 'City must be at least 2 characters')
  .max(100, 'City must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'City can only contain letters, spaces, hyphens, and apostrophes')

export const countrySchema = z.string()
  .min(2, 'Please select a country')

// Complete registration schema
export const registrationSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  businessName: businessNameSchema,
  role: roleSchema,
  city: citySchema,
  country: countrySchema,
})

export type RegistrationFormData = z.infer<typeof registrationSchema>

// Individual field validation function
export const validateRegistrationField = (field: keyof RegistrationFormData, value: string) => {
  const schemas = {
    firstName: firstNameSchema,
    lastName: lastNameSchema,
    email: emailSchema,
    phone: phoneSchema,
    businessName: businessNameSchema,
    role: roleSchema,
    city: citySchema,
    country: countrySchema,
  }

  try {
    schemas[field].parse(value)
    return { success: true, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Invalid input' }
  }
}