// Voice Skills for Dental & HVAC - Active Services Module

export interface VoiceSkill {
  name: string
  painPoint: string
  howItWorks: string
  estimatedROI: string
  monthlyPrice: string
  includedIn: string
  target: 'Dental' | 'HVAC' | 'Both'
}

export const voiceSkillsModule = {
  purpose: {
    description: "Defines all Voice Skills available for Dental Practices and HVAC Companies",
    features: [
      "Name of the skill",
      "Pain point it solves", 
      "How it works",
      "Estimated ROI",
      "Monthly price",
      "Which plan includes it"
    ]
  },

  dentalSkills: [
    {
      name: "Reception 24/7 Agent",
      painPoint: "Missed after-hours calls & repetitive questions",
      howItWorks: "Answers 24/7, provides info (hours, pricing, availability), sends WhatsApp estimates, books visits",
      estimatedROI: "Recovers 15–30 calls/month = +$3,000–$7,000",
      monthlyPrice: "$199/month",
      includedIn: "Elite Impact",
      target: "Dental" as const
    },
    {
      name: "Review Booster Agent", 
      painPoint: "Few reviews, rating <4.5★",
      howItWorks: "Contacts happy patients post-visit, guides to Google review; routes negatives to support",
      estimatedROI: "+1★ = +5–9% revenue (~$4,000/month)",
      monthlyPrice: "$199/month",
      includedIn: "Elite Impact",
      target: "Dental" as const
    },
    {
      name: "Recall & Reactivation Agent",
      painPoint: "Inactive patients & missed recalls", 
      howItWorks: "Sends voice/WhatsApp messages to patients inactive for 6+ months",
      estimatedROI: "+20% reactivated = +$5,000–$10,000/month",
      monthlyPrice: "$199/month",
      includedIn: "Elite Impact",
      target: "Dental" as const
    },
    {
      name: "Follow-Up Agent",
      painPoint: "Unconfirmed treatments or quotes",
      howItWorks: "Automatically follows up with patients holding treatment plans or estimates",
      estimatedROI: "+30% confirmed = +$8,000/month",
      monthlyPrice: "$199/month", 
      includedIn: "Elite Impact",
      target: "Dental" as const
    },
    {
      name: "Prevention & No-Show Agent",
      painPoint: "Forgotten appointments & no-shows",
      howItWorks: "Voice reminders + waitlist management to fill empty slots",
      estimatedROI: "-60% no-shows = +$3,000/month",
      monthlyPrice: "$199/month",
      includedIn: "Elite Impact", 
      target: "Dental" as const
    },
    {
      name: "Treatment Plan Closer Agent",
      painPoint: "Pending treatment plans",
      howItWorks: "Calls undecided patients, explains benefits & payment options, encourages confirmation",
      estimatedROI: "+15–25% confirmed = +$10,000–$20,000/month",
      monthlyPrice: "$199/month",
      includedIn: "Elite Impact",
      target: "Dental" as const
    }
  ] as VoiceSkill[],

  hvacSkills: [
    {
      name: "Reception 24/7 Agent and Emergency Management",
      painPoint: "Missed after-hours calls & slow responses",
      howItWorks: "Answers 24/7, filters requests, logs jobs, schedules or dispatches handles emergencies, especially during peak call times.",
      estimatedROI: "+$4,000–$8,000/month",
      monthlyPrice: "$199/month",
      includedIn: "Elite Impact",
      target: "HVAC" as const
    },
    {
      name: "Review Booster Agent",
      painPoint: "Low visibility & few reviews",
      howItWorks: "Invites satisfied clients to review; filters complaints",
      estimatedROI: "+1★ = +$3,000–$6,000/month", 
      monthlyPrice: "$199/month",
      includedIn: "Elite Impact",
      target: "HVAC" as const
    },
    {
      name: "Recall & Reactivation Agent",
      painPoint: "Inactive customers (12+ months)",
      howItWorks: "Reconnects clients, offers maintenance or upgrades",
      estimatedROI: "10–20 recalls/month = +$4,000–$7,000",
      monthlyPrice: "$199/month",
      includedIn: "Elite Impact",
      target: "HVAC" as const
    },
    {
      name: "Quote Follow-Up Agent",
      painPoint: "Unconfirmed estimates", 
      howItWorks: "Calls 3–5 days post-quote; handles objections & FAQs",
      estimatedROI: "+25% close rate = +$6,000/month",
      monthlyPrice: "$199/month",
      includedIn: "Elite Impact",
      target: "HVAC" as const
    },
    {
      name: "No-Show & Reminder Agent",
      painPoint: "Missed jobs & no-shows",
      howItWorks: "Voice/WhatsApp reminders before visits; reschedules if unconfirmed",
      estimatedROI: "-50% no-shows = +$2,000–$4,000/month",
      monthlyPrice: "$199/month",
      includedIn: "Elite Impact",
      target: "HVAC" as const
    },
    {
      name: "Contract Closer Agent",
      painPoint: "Customers undecided post-service",
      howItWorks: "Calls after job, explains benefits of contracts, closes on recurring plans", 
      estimatedROI: "+10 contracts/month = +$5,000/month",
      monthlyPrice: "$199/month",
      includedIn: "Elite Impact",
      target: "HVAC" as const
    }
  ] as VoiceSkill[]
}

// Helper functions for accessing skills
export const getAllVoiceSkills = (): VoiceSkill[] => [
  ...voiceSkillsModule.dentalSkills,
  ...voiceSkillsModule.hvacSkills
]

export const getSkillsByTarget = (target: 'Dental' | 'HVAC'): VoiceSkill[] => {
  return getAllVoiceSkills().filter(skill => skill.target === target)
}

export const findSkillByName = (name: string): VoiceSkill | undefined => {
  return getAllVoiceSkills().find(skill => skill.name === name)
}

export default voiceSkillsModule