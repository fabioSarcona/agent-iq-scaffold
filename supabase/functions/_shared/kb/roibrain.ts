// ROI Brain Knowledge Base - Centralized KB for Single Brain System
import type { KBPayload } from './types.ts';

interface BusinessContext {
  vertical: 'dental' | 'hvac';
  auditAnswers: Record<string, unknown>;
  scoreSummary?: { overall: number; sections: Array<{ name: string; score: number }> };
  moneylost?: any;
}

// Deterministic KB Filtering - Extract only relevant knowledge
export function extractRelevantKB(context: BusinessContext): KBPayload {
  const { vertical, auditAnswers, scoreSummary } = context;
  
  // Base KB - Always included
  const baseKB = {
    brand: getBrandKB(vertical),
    responseModels: getResponseModels(vertical),
  };
  
  // Voice Skills - Based on audit answers and score
  const voiceSkills = filterVoiceSkills(vertical, auditAnswers, scoreSummary);
  
  // Pain Points - Based on identified issues
  const painPoints = filterPainPoints(vertical, auditAnswers);
  
  // Pricing - Based on business size and needs
  const pricing = filterPricing(vertical, auditAnswers);
  
  // FAQ - Based on common issues for this vertical
  const faq = filterFAQ(vertical, auditAnswers);
  
  return {
    ...baseKB,
    voiceSkills,
    painPoints, 
    pricing,
    faq
  };
}

function getBrandKB(vertical: 'dental' | 'hvac') {
  return {
    name: "AgentIQ",
    tagline: vertical === 'dental' 
      ? "AI Voice Assistant for Dental Practices"
      : "AI Voice Assistant for HVAC Companies",
    values: ["ROI-focused", "Industry expertise", "Easy integration"],
    focus: "ROI-driven voice automation",
    differentiators: [
      "Industry-specific knowledge",
      "Proven ROI tracking",
      "Easy integration"
    ]
  };
}

function getResponseModels(vertical: 'dental' | 'hvac'): any[] {
  return [{
    name: `${vertical}_professional_response`,
    description: `Professional response model for ${vertical} businesses`,
    template: "Problem → Solution → ROI → Next Steps",
    variables: vertical === 'dental' ? 
      ["patients", "appointments", "treatment plans", "practice"] :
      ["customers", "service calls", "quotes", "technicians"],
    context: vertical === 'dental' ? 
      "patient experience and practice efficiency" :
      "customer service and operational efficiency"
  }];
}

function filterVoiceSkills(
  vertical: 'dental' | 'hvac', 
  answers: Record<string, unknown>,
  scoreSummary?: { overall: number; sections: Array<{ name: string; score: number }> }
) {
  const allSkills = getVoiceSkillsDB(vertical);
  
  // Filter based on identified weaknesses from audit
  const relevantSkills = [];
  
  // Low appointment booking score = need appointment scheduling
  const bookingScore = scoreSummary?.sections.find(s => 
    s.name.toLowerCase().includes('appointment') || 
    s.name.toLowerCase().includes('scheduling')
  )?.score || 0;
  
  if (bookingScore < 70) {
    const appointmentSkill = allSkills.find(s => s.id === "appointment-scheduling");
    if (appointmentSkill) relevantSkills.push(appointmentSkill);
  }
  
  // Missed calls = need call handling
  const missedCalls = answers.daily_unanswered_calls_choice || answers.hvac_daily_unanswered_calls_choice;
  if (missedCalls && String(missedCalls) !== 'none') {
    const callSkill = allSkills.find(s => s.id === "call-handling");
    if (callSkill) relevantSkills.push(callSkill);
  }
  
  // Treatment plans / quotes issues = need sales support
  const treatmentPlans = answers.monthly_cold_treatment_plans || answers.monthly_pending_quotes;
  if (treatmentPlans && Number(treatmentPlans) > 5) {
    const salesSkill = allSkills.find(s => s.id === "sales-support");
    if (salesSkill) relevantSkills.push(salesSkill);
  }
  
  return relevantSkills.filter(Boolean);
}

function filterPainPoints(vertical: 'dental' | 'hvac', answers: Record<string, unknown>) {
  const painPointsDB = getPainPointsDB(vertical);
  const identified = [];
  
  // Identify pain points based on audit answers
  if (answers.staff_availability_rating && Number(answers.staff_availability_rating) < 3) {
    const staffPain = painPointsDB.find(p => p.id === "staff-shortage");
    if (staffPain) identified.push(staffPain);
  }
  
  if (answers.daily_unanswered_calls_choice && String(answers.daily_unanswered_calls_choice) !== 'none') {
    const callPain = painPointsDB.find(p => p.id === "missed-calls");
    if (callPain) identified.push(callPain);
  }
  
  if (answers.weekly_no_shows_choice && String(answers.weekly_no_shows_choice) !== 'none') {
    const noShowPain = painPointsDB.find(p => p.id === "no-shows");
    if (noShowPain) identified.push(noShowPain);
  }
  
  return identified.filter(Boolean);
}

function filterPricing(vertical: 'dental' | 'hvac', answers: Record<string, unknown>) {
  const pricingDB = getPricingDB(vertical);
  
  // Determine appropriate pricing tier based on business size
  const staffSize = answers.staff_size || answers.team_size || 1;
  const businessSize = Number(staffSize);
  
  if (businessSize <= 3) return [pricingDB[0]]; // starter
  if (businessSize <= 10) return [pricingDB[1]]; // professional  
  return [pricingDB[2]]; // enterprise
}

function filterFAQ(vertical: 'dental' | 'hvac', answers: Record<string, unknown>) {
  const faqDB = getFAQDB(vertical);
  
  // Return most relevant FAQs based on common concerns
  return [
    faqDB[0], // implementation
    faqDB[1], // integration
    faqDB[2], // roi  
    faqDB[3]  // support
  ].filter(Boolean);
}

// Mock KB Databases - In production, these would come from your KB files
function getVoiceSkillsDB(vertical: string) {
  return [
    {
      id: "appointment-scheduling",
      name: "Appointment Scheduling",
      target: vertical === 'dental' ? 'Dental' as const : 'HVAC' as const,
      problem: "Lost bookings due to phone availability",
      how: "24/7 automated appointment booking and rescheduling",
      description: "24/7 automated appointment booking and rescheduling",
      roi: "30% increase in bookings"
    },
    {
      id: "call-handling", 
      name: "Call Handling",
      target: vertical === 'dental' ? 'Dental' as const : 'HVAC' as const,
      problem: "Missed calls losing customers",
      how: "Never miss another call with intelligent call routing",
      description: "Never miss another call with intelligent call routing", 
      roi: "95% call capture rate"
    },
    {
      id: "sales-support",
      name: "Sales Support",
      target: vertical === 'dental' ? 'Dental' as const : 'HVAC' as const,
      problem: "Cold leads not following up",
      how: vertical === 'dental' 
        ? "Treatment plan explanations and follow-ups"
        : "Quote follow-ups and service explanations",
      description: vertical === 'dental' 
        ? "Treatment plan explanations and follow-ups"
        : "Quote follow-ups and service explanations",
      roi: "25% increase in conversion"
    }
  ].filter(Boolean);
}

function getPainPointsDB(vertical: string) {
  return [
    {
      id: "staff-shortage",
      title: "Staff Shortage Impact",
      vertical: vertical as 'dental' | 'hvac',
      category: "operational",
      problem: "Overwhelmed staff missing opportunities",
      description: "Overwhelmed staff missing opportunities",
      solution: "AI handles routine tasks",
      impact: "medium" as const,
      frequency: "medium" as const,
      severity: "major" as const
    },
    {
      id: "missed-calls",
      title: "Missed Revenue Calls", 
      vertical: vertical as 'dental' | 'hvac',
      category: "communication",
      problem: "Lost customers due to missed calls",
      description: "Lost customers due to missed calls",
      solution: "24/7 AI call handling",
      impact: "high" as const,
      frequency: "high" as const,
      severity: "critical" as const
    },
    {
      id: "no-shows",
      title: "No-Show Problem",
      vertical: vertical as 'dental' | 'hvac',
      category: "scheduling",
      problem: "Empty slots hurting revenue",
      description: "Empty slots hurting revenue",
      solution: "Automated reminders and rebooking",
      impact: "medium" as const,
      frequency: "medium" as const,
      severity: "major" as const
    }
  ].filter(Boolean);
}

function getPricingDB(vertical: string) {
  return [
    {
      name: "Starter",
      monthlyPrice: 297,
      yearlyPrice: 2970,
      target: "starter" as const,
      features: ["Basic call handling", "Appointment scheduling", "SMS notifications"]
    },
    {
      name: "Professional", 
      monthlyPrice: 497,
      yearlyPrice: 4970,
      target: "professional" as const,
      features: ["Advanced AI", "Integration support", "Analytics dashboard"]
    },
    {
      name: "Enterprise",
      monthlyPrice: 997,
      yearlyPrice: 9970,
      target: "enterprise" as const,
      features: ["Custom integration", "Priority support", "Advanced reporting"]
    }
  ];
}

function getFAQDB(vertical: string) {
  return [
    {
      question: "How long does implementation take?",
      answer: "Most clients are up and running within 24-48 hours",
      category: "implementation"
    },
    {
      question: "Does it integrate with our current system?",
      answer: vertical === 'dental' 
        ? "Yes, we integrate with all major dental software"
        : "Yes, we integrate with all major HVAC software",
      category: "integration"
    },
    {
      question: "What kind of ROI can we expect?",
      answer: "Most clients see 3-5x ROI within the first 90 days",
      category: "roi"
    },
    {
      question: "What kind of support do you provide?",
      answer: "24/7 technical support and dedicated success manager",
      category: "support"
    }
  ];
}

export type { BusinessContext, KBPayload };