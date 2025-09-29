// Frequently asked questions and responses

export interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'integration' | 'pricing' | 'implementation' | 'compliance' | 'competitive'
  tags: string[]
  priority: 'high' | 'medium' | 'low'
  industry?: 'dental' | 'hvac' | 'general'
}

export interface IndustryFAQs {
  dental: FAQItem[]
  hvac: FAQItem[]
  general: FAQItem[]
}

export interface FAQModule {
  purpose: string
  faqs: IndustryFAQs
}

// Dental Practice FAQs (15 items)
const dentalFAQs: FAQItem[] = [
  {
    id: 'dental-integration-pms',
    question: 'We already use OpenDental/Dentrix. Can this integrate?',
    answer: 'Yes, fully compatible with all major PMS platforms including OpenDental, Dentrix, Eaglesoft, and others. We also integrate via Make.com/N8N for custom workflows.',
    category: 'integration',
    tags: ['PMS', 'OpenDental', 'Dentrix', 'integration'],
    priority: 'high',
    industry: 'dental'
  },
  {
    id: 'dental-not-chatbot',
    question: 'Is this just another chatbot?',
    answer: 'No. Our Voice AI Agents sound completely natural, handle complex objections, and follow intelligent conversational flows - not rigid IVR menus. Patients often don\'t realize they\'re speaking with AI.',
    category: 'competitive',
    tags: ['chatbot', 'voice quality', 'natural conversation'],
    priority: 'high',
    industry: 'dental'
  },
  {
    id: 'dental-staff-replacement',
    question: 'Why automate if our staff already answers calls?',
    answer: 'AI enhances your staff by covering gaps they can\'t fill: after-hours calls, forgotten follow-ups, simultaneous conversations, and perfect consistency. Your team focuses on patients, not phone tag.',
    category: 'implementation',
    tags: ['staff enhancement', 'after-hours', 'consistency'],
    priority: 'high',
    industry: 'dental'
  },
  {
    id: 'dental-hipaa-compliance',
    question: 'Is this HIPAA compliant?',
    answer: 'Yes - our platform uses Retell AI + Keragon with full HIPAA compliance, BAA agreements, encryption, and audit logs. All patient data is protected according to healthcare regulations.',
    category: 'compliance',
    tags: ['HIPAA', 'compliance', 'security', 'BAA'],
    priority: 'high',
    industry: 'dental'
  },
  {
    id: 'dental-voice-quality',
    question: 'How natural does the AI voice sound?',
    answer: 'Extremely natural with custom-trained voices specific to your practice. We can match your brand voice, and patients frequently don\'t realize they\'re speaking with AI until told.',
    category: 'implementation',
    tags: ['voice quality', 'natural', 'custom training'],
    priority: 'medium',
    industry: 'dental'
  },
  {
    id: 'dental-setup-time',
    question: 'How long does it take to go live?',
    answer: 'Setup takes 7-14 days. We build around your existing workflows, import your data, train the AI on your scripts, and test thoroughly before launch.',
    category: 'implementation',
    tags: ['setup time', 'go-live', 'training'],
    priority: 'high',
    industry: 'dental'
  },
  {
    id: 'dental-vs-lighthouse',
    question: 'How is this different from Lighthouse or Doctible?',
    answer: 'Those tools send reminders and texts but don\'t handle conversations. They can\'t rebook cancellations, explain treatment plans, or handle objections. NeedAgent closes the loop with actual conversations.',
    category: 'competitive',
    tags: ['Lighthouse', 'Doctible', 'conversation handling'],
    priority: 'medium',
    industry: 'dental'
  },
  {
    id: 'dental-pricing-roi',
    question: 'What does this cost and what ROI can I expect?',
    answer: 'Setup: $2,799. Monthly: $997. Our clients typically recover $5K-$18K per month in previously lost revenue. Most see full payback within 30-60 days.',
    category: 'pricing',
    tags: ['pricing', 'ROI', 'payback period'],
    priority: 'high',
    industry: 'dental'
  },
  {
    id: 'dental-training-required',
    question: 'Do we need to train our staff on this?',
    answer: 'No training required. NeedAgent handles all scripts, configuration, and optimization. Your staff simply receives summaries and action items when needed.',
    category: 'implementation',
    tags: ['training', 'ease of use', 'staff'],
    priority: 'medium',
    industry: 'dental'
  },
  {
    id: 'dental-ai-fallback',
    question: 'What happens if the AI doesn\'t understand something?',
    answer: 'The AI rephrases questions, asks for clarification, or escalates to staff with a full conversation summary. It never leaves patients hanging.',
    category: 'implementation',
    tags: ['fallback', 'escalation', 'conversation summary'],
    priority: 'medium',
    industry: 'dental'
  },
  {
    id: 'dental-appointment-types',
    question: 'Can it handle different appointment types?',
    answer: 'Yes - cleanings, consultations, procedures, emergencies. The AI knows your schedule, availability, and can book appropriate time slots for each service type.',
    category: 'integration',
    tags: ['appointment types', 'scheduling', 'availability'],
    priority: 'medium',
    industry: 'dental'
  },
  {
    id: 'dental-insurance-verification',
    question: 'Does it handle insurance verification?',
    answer: 'The AI can collect insurance information and flag verification needs, but actual verification requires human oversight for accuracy and compliance.',
    category: 'compliance',
    tags: ['insurance', 'verification', 'compliance'],
    priority: 'low',
    industry: 'dental'
  },
  {
    id: 'dental-emergency-handling',
    question: 'How does it handle dental emergencies?',
    answer: 'Emergency calls are immediately prioritized, triaged by urgency, and either scheduled for same-day appointments or escalated to on-call staff with full details.',
    category: 'implementation',
    tags: ['emergencies', 'triage', 'same-day'],
    priority: 'high',
    industry: 'dental'
  },
  {
    id: 'dental-treatment-explanations',
    question: 'Can it explain treatment plans to patients?',
    answer: 'Yes - the AI can explain procedures, benefits, timeline, and costs in patient-friendly language, then follow up to address questions and improve case acceptance.',
    category: 'implementation',
    tags: ['treatment plans', 'case acceptance', 'patient education'],
    priority: 'medium',
    industry: 'dental'
  },
  {
    id: 'dental-multilingual-support',
    question: 'Does it support multiple languages?',
    answer: 'Yes - Spanish and other languages are available based on your patient demographics. The AI maintains the same quality and capabilities across languages.',
    category: 'implementation',
    tags: ['multilingual', 'Spanish', 'languages'],
    priority: 'low',
    industry: 'dental'
  }
]

// HVAC Business FAQs (15 items)
const hvacFAQs: FAQItem[] = [
  {
    id: 'hvac-integration-dispatch',
    question: 'Does this work with ServiceTitan and HouseCallPro?',
    answer: 'Yes, fully integrates with ServiceTitan, HouseCallPro, and other dispatch systems. It enhances your existing workflow rather than replacing it.',
    category: 'integration',
    tags: ['ServiceTitan', 'HouseCallPro', 'dispatch integration'],
    priority: 'high',
    industry: 'hvac'
  },
  {
    id: 'hvac-vs-competitors',
    question: 'How is this different from other HVAC software?',
    answer: 'Other platforms offer routing and SMS. NeedAgent builds true Voice AI that books jobs, follows up on quotes, re-engages cold leads, and handles objections through actual conversations.',
    category: 'competitive',
    tags: ['competitive advantage', 'voice AI', 'conversation handling'],
    priority: 'high',
    industry: 'hvac'
  },
  {
    id: 'hvac-voice-quality',
    question: 'Does it sound professional for HVAC customers?',
    answer: 'Yes - HVAC-specific voices trained on industry terminology, brand-matched tone, and completely non-robotic. Customers appreciate the professionalism and availability.',
    category: 'implementation',
    tags: ['voice quality', 'professional', 'industry-specific'],
    priority: 'medium',
    industry: 'hvac'
  },
  {
    id: 'hvac-quote-followup',
    question: 'How does it handle quote follow-ups?',
    answer: 'AI calls 24-48 hours after proposals, answers common objections, addresses price concerns, explains financing options, and escalates warm leads to your sales team.',
    category: 'implementation',
    tags: ['quote follow-up', 'objection handling', 'sales'],
    priority: 'high',
    industry: 'hvac'
  },
  {
    id: 'hvac-cost-vs-hiring',
    question: 'How does the cost compare to hiring another CSR?',
    answer: 'AI costs 70% less than a full-time CSR, works 24/7 without breaks, never makes scheduling errors, and handles unlimited simultaneous calls during peak seasons.',
    category: 'pricing',
    tags: ['cost comparison', 'CSR', '24/7 availability'],
    priority: 'high',
    industry: 'hvac'
  },
  {
    id: 'hvac-data-security',
    question: 'Is customer data secure?',
    answer: 'Yes - HIPAA-ready infrastructure, SOC2 certified, full encryption, audit logs, and secure integrations. Customer information is protected with enterprise-grade security.',
    category: 'compliance',
    tags: ['data security', 'SOC2', 'encryption'],
    priority: 'high',
    industry: 'hvac'
  },
  {
    id: 'hvac-emergency-surge',
    question: 'Can it handle emergency calls and storm surges?',
    answer: 'Yes - AI can triage by urgency, log emergency issues, notify on-call techs immediately, and manage waitlists during peak demand periods like storms or heat waves.',
    category: 'implementation',
    tags: ['emergencies', 'storm surge', 'triage', 'peak demand'],
    priority: 'high',
    industry: 'hvac'
  },
  {
    id: 'hvac-results-speed',
    question: 'How quickly will we see results?',
    answer: 'ROI typically visible within 2 weeks. Most clients see full payback within 30-60 days as the AI captures previously missed opportunities and improves conversion rates.',
    category: 'pricing',
    tags: ['ROI timeline', 'results speed', 'payback'],
    priority: 'high',
    industry: 'hvac'
  },
  {
    id: 'hvac-pricing-structure',
    question: 'What are the costs involved?',
    answer: 'Setup: $2,799. Monthly: $997. Typical ROI is 5-10x within the first quarter as you capture missed calls, improve quote conversion, and reduce no-shows.',
    category: 'pricing',
    tags: ['pricing', 'setup cost', 'monthly cost', 'ROI'],
    priority: 'high',
    industry: 'hvac'
  },
  {
    id: 'hvac-satisfaction-guarantee',
    question: 'What if it doesn\'t work for our business?',
    answer: '30-day satisfaction guarantee with full setup fee refund if not satisfied. However, we maintain over 90% client retention because the results speak for themselves.',
    category: 'pricing',
    tags: ['guarantee', 'refund', 'retention rate'],
    priority: 'medium',
    industry: 'hvac'
  },
  {
    id: 'hvac-pilot-program',
    question: 'Can we start with just one location?',
    answer: 'Absolutely. Many clients start with one branch or service zone to test results before scaling across all locations. Perfect for proving ROI before full rollout.',
    category: 'implementation',
    tags: ['pilot program', 'single location', 'scaling'],
    priority: 'medium',
    industry: 'hvac'
  },
  {
    id: 'hvac-payment-integration',
    question: 'Can customers pay over the phone?',
    answer: 'Yes - integrates with Stripe, PayPal, and other payment processors. Customers can securely pay deposits, service charges, or full invoices by voice with PCI compliance.',
    category: 'integration',
    tags: ['payment processing', 'Stripe', 'PayPal', 'PCI compliance'],
    priority: 'medium',
    industry: 'hvac'
  },
  {
    id: 'hvac-multilingual-support',
    question: 'Do you support Spanish-speaking customers?',
    answer: 'Yes - Spanish and regional English variants available. The AI maintains the same professional quality and technical knowledge across all supported languages.',
    category: 'implementation',
    tags: ['multilingual', 'Spanish', 'regional variants'],
    priority: 'low',
    industry: 'hvac'
  },
  {
    id: 'hvac-mobile-voip',
    question: 'Does it work with our VoIP and mobile systems?',
    answer: 'Yes - compatible with VoIP, traditional landlines, and mobile systems. Seamless integration regardless of your current phone infrastructure.',
    category: 'integration',
    tags: ['VoIP', 'mobile', 'landline', 'phone systems'],
    priority: 'low',
    industry: 'hvac'
  },
  {
    id: 'hvac-reporting-monitoring',
    question: 'How do we monitor performance and results?',
    answer: 'Full KPI dashboard with call logs, conversion rates, revenue attribution, and detailed interaction reports. Real-time monitoring with weekly performance summaries.',
    category: 'implementation',
    tags: ['KPI dashboard', 'monitoring', 'reporting', 'analytics'],
    priority: 'medium',
    industry: 'hvac'
  }
]

// General FAQs (5 items)
const generalFAQs: FAQItem[] = [
  {
    id: 'general-ai-reliability',
    question: 'How reliable is AI for business-critical conversations?',
    answer: 'Our AI maintains 99.7% uptime with built-in failsafes. If issues arise, calls automatically route to your team with full context. Most clients find AI more reliable than human staff.',
    category: 'implementation',
    tags: ['reliability', 'uptime', 'failsafes'],
    priority: 'high',
    industry: 'general'
  },
  {
    id: 'general-customization',
    question: 'Can the AI be customized to our specific business?',
    answer: 'Yes - completely customizable to your brand voice, industry terminology, pricing, services, and workflows. It sounds like a trained employee who knows your business inside and out.',
    category: 'implementation',
    tags: ['customization', 'brand voice', 'industry-specific'],
    priority: 'high',
    industry: 'general'
  },
  {
    id: 'general-scalability',
    question: 'Will this scale as our business grows?',
    answer: 'Absolutely. The AI handles unlimited simultaneous calls, scales instantly during busy periods, and grows with your business without additional hiring or training costs.',
    category: 'implementation',
    tags: ['scalability', 'unlimited calls', 'business growth'],
    priority: 'medium',
    industry: 'general'
  },
  {
    id: 'general-data-ownership',
    question: 'Who owns the conversation data and insights?',
    answer: 'You own all your data. We provide the platform and analytics, but all customer interactions, insights, and business intelligence belong to you with full export capabilities.',
    category: 'compliance',
    tags: ['data ownership', 'customer data', 'export'],
    priority: 'medium',
    industry: 'general'
  },
  {
    id: 'general-support',
    question: 'What kind of ongoing support do you provide?',
    answer: 'Dedicated account management, 24/7 technical support, monthly optimization reviews, and continuous AI training updates. We\'re partners in your success, not just vendors.',
    category: 'implementation',
    tags: ['support', 'account management', 'optimization'],
    priority: 'medium',
    industry: 'general'
  }
]

// Main FAQ structure
export const faq: FAQModule = {
  purpose: 'Comprehensive FAQ repository addressing real client concerns for both Dental Practices and HVAC Businesses, providing ready-to-use answers, positioning statements, and fallback functions for integration into audits, websites, and sales conversations.',
  faqs: {
    dental: dentalFAQs,
    hvac: hvacFAQs,
    general: generalFAQs
  }
}

// Helper Functions
export function getAllFAQs(): FAQItem[] {
  return [...faq.faqs.dental, ...faq.faqs.hvac, ...faq.faqs.general]
}

export function getFAQsByIndustry(industry: 'dental' | 'hvac' | 'general'): FAQItem[] {
  return faq.faqs[industry]
}

export function searchFAQs(term: string, industry?: 'dental' | 'hvac' | 'general'): FAQItem[] {
  const searchPool = industry ? getFAQsByIndustry(industry) : getAllFAQs()
  const searchTerm = term.toLowerCase()
  
  return searchPool.filter(faqItem => 
    faqItem.question.toLowerCase().includes(searchTerm) ||
    faqItem.answer.toLowerCase().includes(searchTerm) ||
    faqItem.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  )
}

export function getFAQByQuestion(question: string, industry?: 'dental' | 'hvac' | 'general'): FAQItem | undefined {
  const searchPool = industry ? getFAQsByIndustry(industry) : getAllFAQs()
  
  return searchPool.find(faqItem => 
    faqItem.question.toLowerCase() === question.toLowerCase()
  )
}

export function getRandomFAQ(industry?: 'dental' | 'hvac' | 'general'): FAQItem {
  const searchPool = industry ? getFAQsByIndustry(industry) : getAllFAQs()
  const randomIndex = Math.floor(Math.random() * searchPool.length)
  return searchPool[randomIndex]
}

export default faq