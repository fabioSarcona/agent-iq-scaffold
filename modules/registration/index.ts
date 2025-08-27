// Registration module barrel file - centralized exports
export { RegistrationEngine } from './RegistrationEngine'

// Steps
export { Registration } from './steps/Registration'
export { Welcome } from './steps/Welcome'

// Client utilities
export { requestOTP, verifyOTP } from './otp.client'

// Types
export type * from './types'

// Validation
export { 
  phoneSchema, 
  registrationFieldSchemas, 
  fullRegistrationSchema,
  validateRegistrationField,
  formatE164Phone
} from './validation'