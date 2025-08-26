export interface Phone {
  countryCode: string // ISO2 code like "US", "IT", etc.
  national: string    // digits only, no formatting
}

export interface RegistrationData {
  firstName: string
  lastName: string
  email: string
  phone: Phone
  businessName: string
  role: string
  city: string
  country: string
}

export interface RegistrationField {
  key: keyof RegistrationData
  step: string
  question: string
  helper: string
  placeholder: string
  type: 'text' | 'email' | 'phone' | 'select' | 'country'
  options?: string[]
}

export const REGISTRATION_FIELDS: RegistrationField[] = [
  {
    key: 'firstName',
    step: 'registration:firstName',
    question: "What's your first name?",
    helper: "We'll keep it friendly and use your first name in the chat.",
    placeholder: 'Enter your first name',
    type: 'text'
  },
  {
    key: 'lastName',
    step: 'registration:lastName',
    question: 'And your last name?',
    helper: 'For your report and invoice details if needed.',
    placeholder: 'Enter your last name',
    type: 'text'
  },
  {
    key: 'email',
    step: 'registration:email',
    question: "What's your best email?",
    helper: "We'll send your results and report here.",
    placeholder: 'Enter your email address',
    type: 'email'
  },
  {
    key: 'phone',
    step: 'registration:phone',
    question: "What's your phone number?",
    helper: 'Country first, then your number. We format it automatically.',
    placeholder: 'Enter your phone number',
    type: 'phone'
  },
  {
    key: 'businessName',
    step: 'registration:businessName',
    question: 'What\'s the name of your business or clinic?',
    helper: 'This will appear on your final report.',
    placeholder: 'Enter business/clinic name',
    type: 'text'
  },
  {
    key: 'role',
    step: 'registration:role',
    question: "What's your role?",
    helper: 'So we can tailor the recommendations.',
    placeholder: 'Select your role',
    type: 'select',
    options: ['Owner', 'Manager', 'Front Desk', 'Operations', 'Other']
  },
  {
    key: 'city',
    step: 'registration:city',
    question: 'Which city are you located in?',
    helper: 'We use this for local benchmarks.',
    placeholder: 'Enter your city',
    type: 'text'
  },
  {
    key: 'country',
    step: 'registration:country',
    question: 'And your country?',
    helper: 'This helps us apply the right regional context.',
    placeholder: 'Select your country',
    type: 'country'
  }
]