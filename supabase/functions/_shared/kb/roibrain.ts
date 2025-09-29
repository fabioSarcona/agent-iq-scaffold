// ROI Brain Knowledge Base - Centralized KB for Single Brain System
import type { KBPayload } from './types';

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
    focus: "ROI-driven voice automation",
    differentiators: [
      "Industry-specific knowledge",
      "Proven ROI tracking",
      "Easy integration"
    ]
  };
}

function getResponseModels(vertical: 'dental' | 'hvac') {
  const base = {
    professionalTone: "Confident, knowledgeable, solution-focused",
    structure: "Problem → Solution → ROI → Next Steps"
  };
  
  if (vertical === 'dental') {
    return {
      ...base,
      terminology: ["patients", "appointments", "treatment plans", "practice"],
      painPointFraming: "patient experience and practice efficiency"
    };
  }
  
  return {
    ...base, 
    terminology: ["customers", "service calls", "quotes", "technicians"],
    painPointFraming: "customer service and operational efficiency"
  };
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
    relevantSkills.push(allSkills.appointmentScheduling);
  }
  
  // Missed calls = need call handling
  const missedCalls = answers.daily_unanswered_calls_choice || answers.hvac_daily_unanswered_calls_choice;
  if (missedCalls && String(missedCalls) !== 'none') {
    relevantSkills.push(allSkills.callHandling);
  }
  
  // Treatment plans / quotes issues = need sales support
  const treatmentPlans = answers.monthly_cold_treatment_plans || answers.monthly_pending_quotes;
  if (treatmentPlans && Number(treatmentPlans) > 5) {
    relevantSkills.push(allSkills.salesSupport);
  }
  
  return relevantSkills.filter(Boolean);
}

function filterPainPoints(vertical: 'dental' | 'hvac', answers: Record<string, unknown>) {
  const painPointsDB = getPainPointsDB(vertical);
  const identified = [];
  
  // Identify pain points based on audit answers
  if (answers.staff_availability_rating && Number(answers.staff_availability_rating) < 3) {
    identified.push(painPointsDB.staffShortage);
  }
  
  if (answers.daily_unanswered_calls_choice && String(answers.daily_unanswered_calls_choice) !== 'none') {
    identified.push(painPointsDB.missedCalls);
  }
  
  if (answers.weekly_no_shows_choice && String(answers.weekly_no_shows_choice) !== 'none') {
    identified.push(painPointsDB.noShows);
  }
  
  return identified.filter(Boolean);
}

function filterPricing(vertical: 'dental' | 'hvac', answers: Record<string, unknown>) {
  const pricingDB = getPricingDB(vertical);
  
  // Determine appropriate pricing tier based on business size
  const staffSize = answers.staff_size || answers.team_size || 1;
  const businessSize = Number(staffSize);
  
  if (businessSize <= 3) return [pricingDB.starter];
  if (businessSize <= 10) return [pricingDB.professional];
  return [pricingDB.enterprise];
}

function filterFAQ(vertical: 'dental' | 'hvac', answers: Record<string, unknown>) {
  const faqDB = getFAQDB(vertical);
  
  // Return most relevant FAQs based on common concerns
  return [
    faqDB.implementation,
    faqDB.integration,
    faqDB.roi,
    faqDB.support
  ].filter(Boolean);
}

// Mock KB Databases - In production, these would come from your KB files
function getVoiceSkillsDB(vertical: string) {
  return {
    appointmentScheduling: {
      name: "Appointment Scheduling",
      description: "24/7 automated appointment booking and rescheduling",
      roi: "30% increase in bookings"
    },
    callHandling: {
      name: "Call Handling", 
      description: "Never miss another call with intelligent call routing",
      roi: "95% call capture rate"
    },
    salesSupport: {
      name: "Sales Support",
      description: vertical === 'dental' 
        ? "Treatment plan explanations and follow-ups"
        : "Quote follow-ups and service explanations",
      roi: "25% increase in conversion"
    }
  };
}

function getPainPointsDB(vertical: string) {
  return {
    staffShortage: {
      title: "Staff Shortage Impact",
      description: "Overwhelmed staff missing opportunities",
      solution: "AI handles routine tasks"
    },
    missedCalls: {
      title: "Missed Revenue Calls", 
      description: "Lost customers due to missed calls",
      solution: "24/7 AI call handling"
    },
    noShows: {
      title: "No-Show Problem",
      description: "Empty slots hurting revenue",
      solution: "Automated reminders and rebooking"
    }
  };
}

function getPricingDB(vertical: string) {
  return {
    starter: {
      name: "Starter",
      price: 297,
      features: ["Basic call handling", "Appointment scheduling", "SMS notifications"]
    },
    professional: {
      name: "Professional", 
      price: 497,
      features: ["Advanced AI", "Integration support", "Analytics dashboard"]
    },
    enterprise: {
      name: "Enterprise",
      price: 997, 
      features: ["Custom integration", "Priority support", "Advanced reporting"]
    }
  };
}

function getFAQDB(vertical: string) {
  return {
    implementation: {
      question: "How long does implementation take?",
      answer: "Most clients are up and running within 24-48 hours"
    },
    integration: {
      question: "Does it integrate with our current system?",
      answer: vertical === 'dental' 
        ? "Yes, we integrate with all major dental software"
        : "Yes, we integrate with all major HVAC software"
    },
    roi: {
      question: "What kind of ROI can we expect?",
      answer: "Most clients see 3-5x ROI within the first 90 days"
    },
    support: {
      question: "What kind of support do you provide?",
      answer: "24/7 technical support and dedicated success manager"
    }
  };
}

export type { BusinessContext, KBPayload };