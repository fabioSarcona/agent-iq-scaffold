// Knowledge base aggregator

import brandIdentity from './brand'
import voiceSkills from './voiceSkills'
import painPoints from './painPoints'
import externalSources from './externalSources'
import responseModels from './responseModels'
import faq from './faq'
import pricing from './pricing'
import aiTechnology from './aiTechnology'

// AI Services for vertical-specific recommendations
export const services = Object.freeze([
  {
    name: "Reception 24/7 Agent",
    target: "Both" as const,
    problem: "Missed calls leading to lost revenue and poor customer experience",
    how: "AI-powered call handling that answers every call, schedules appointments, and qualifies leads automatically",
    roiRangeMonthly: [800, 2400] as [number, number],
    tags: ["call handling", "scheduling", "lead qualification"]
  },
  {
    name: "Appointment Reminder System", 
    target: "Dental" as const,
    problem: "High no-show rates reducing practice efficiency and revenue",
    how: "Intelligent reminder sequence via calls, texts, and emails with confirmation tracking",
    roiRangeMonthly: [600, 1800] as [number, number],
    tags: ["reminders", "confirmations", "no-shows"]
  },
  {
    name: "Treatment Plan Presenter",
    target: "Dental" as const, 
    problem: "Low treatment plan acceptance rates and poor follow-up",
    how: "AI-powered treatment plan explanations and automated follow-up sequences",
    roiRangeMonthly: [1200, 3600] as [number, number],
    tags: ["treatment plans", "case acceptance", "follow-up"]
  },
  {
    name: "Emergency Response System",
    target: "HVAC" as const,
    problem: "Missed emergency calls and slow response times",
    how: "Priority call routing with immediate dispatch and customer communication",
    roiRangeMonthly: [1000, 3000] as [number, number], 
    tags: ["emergency", "dispatch", "routing"]
  },
  {
    name: "Lead Follow-up Assistant",
    target: "Both" as const,
    problem: "Poor lead nurturing and conversion rates",
    how: "Automated multi-touch follow-up campaigns with personalized messaging", 
    roiRangeMonthly: [500, 1500] as [number, number],
    tags: ["lead nurturing", "conversion", "automation"]
  },
  {
    name: "Quote Follow-up System",
    target: "HVAC" as const,
    problem: "Pending quotes going cold and lost sales opportunities",
    how: "Systematic quote follow-up with decision-making assistance and urgency building",
    roiRangeMonthly: [900, 2700] as [number, number],
    tags: ["quotes", "sales", "follow-up"]
  },
  {
    name: "Customer Retention Assistant",
    target: "Both" as const, 
    problem: "Low customer lifetime value and poor retention rates",
    how: "Proactive outreach for maintenance, recalls, and service reminders",
    roiRangeMonthly: [700, 2100] as [number, number],
    tags: ["retention", "maintenance", "recalls"]
  },
  {
    name: "Quality Assurance Monitor",
    target: "Both" as const,
    problem: "Inconsistent service quality and missed feedback opportunities", 
    how: "Automated post-service surveys and issue resolution workflows",
    roiRangeMonthly: [300, 900] as [number, number],
    tags: ["quality", "surveys", "feedback"]
  }
]);

// Approved marketing claims
export const approved_claims = Object.freeze([
  "Reduce missed calls by up to 60% with 24/7 AI call handling",
  "Increase appointment confirmations by 45% through automated reminders",
  "Recover 35-50% of lost revenue from improved follow-up processes",
  "Achieve 2-4 week implementation with minimal operational disruption",
  "HIPAA compliant and enterprise-grade security standards",
  "Integrate seamlessly with existing practice management systems",
  "Scale automatically during peak seasons and emergency situations",
  "Provide multilingual support for diverse customer bases",
  "Track and optimize performance with real-time analytics dashboards",
  "Reduce staff workload by automating routine administrative tasks"
]);

export const knowledgeBase = {
  brand: brandIdentity,
  voice: voiceSkills,
  painPoints,
  external: externalSources,
  responses: responseModels,
  faq,
  pricing,
  ai: aiTechnology,
  services,
  approved_claims
}

export default knowledgeBase