// Response Models & Ready-to-Use Snippets
// Provides pre-approved response models for audits, sales calls, follow-ups, and solution presentations

export interface ResponseModel {
  id: string;
  content: string;
  category: string;
  tags?: string[];
}

export interface CTAPhrase extends ResponseModel {
  category: 'cta';
  urgency: 'low' | 'medium' | 'high';
}

export interface InsightExample extends ResponseModel {
  category: 'insight';
  type: 'needagentiq' | 'audit-report' | 'solutions-modal' | 'fallback';
  vertical?: 'dental' | 'hvac' | 'general';
}

export interface FollowUpPrompt extends ResponseModel {
  category: 'follow-up';
  type: 'inactive-users' | 'need-time' | 'clarify-solution';
  timing?: 'immediate' | 'delayed' | 'persistent';
}

// Call-To-Action Phrases (30 examples)
export const ctaPhrases: CTAPhrase[] = [
  {
    id: 'cta-001',
    content: "Let's uncover where your business is leaking revenue.",
    category: 'cta',
    urgency: 'medium',
    tags: ['revenue', 'discovery']
  },
  {
    id: 'cta-002',
    content: "Start your free AI-readiness audit now.",
    category: 'cta',
    urgency: 'high',
    tags: ['audit', 'free', 'ai-readiness']
  },
  {
    id: 'cta-003',
    content: "Don't let another call slip through the cracks.",
    category: 'cta',
    urgency: 'high',
    tags: ['urgency', 'missed-calls']
  },
  {
    id: 'cta-004',
    content: "This free audit could recover thousands per month.",
    category: 'cta',
    urgency: 'medium',
    tags: ['roi', 'recovery', 'free']
  },
  {
    id: 'cta-005',
    content: "The audit is free. The insights are priceless.",
    category: 'cta',
    urgency: 'low',
    tags: ['value', 'free', 'insights']
  },
  {
    id: 'cta-006',
    content: "Click here. We'll handle the rest.",
    category: 'cta',
    urgency: 'low',
    tags: ['simple', 'convenience']
  },
  {
    id: 'cta-007',
    content: "Stop losing money to missed opportunities.",
    category: 'cta',
    urgency: 'high',
    tags: ['loss-prevention', 'opportunities']
  },
  {
    id: 'cta-008',
    content: "See exactly where revenue is slipping away.",
    category: 'cta',
    urgency: 'medium',
    tags: ['visibility', 'revenue-leak']
  },
  {
    id: 'cta-009',
    content: "Your competitors aren't waiting. Neither should you.",
    category: 'cta',
    urgency: 'high',
    tags: ['competition', 'urgency']
  },
  {
    id: 'cta-010',
    content: "Turn missed calls into recovered revenue today.",
    category: 'cta',
    urgency: 'high',
    tags: ['immediate', 'call-recovery']
  },
  {
    id: 'cta-011',
    content: "Get your personalized revenue recovery report.",
    category: 'cta',
    urgency: 'medium',
    tags: ['personalized', 'report']
  },
  {
    id: 'cta-012',
    content: "Find out what you're really missing in 3 minutes.",
    category: 'cta',
    urgency: 'medium',
    tags: ['quick', 'discovery']
  },
  {
    id: 'cta-013',
    content: "Every day you wait costs you money.",
    category: 'cta',
    urgency: 'high',
    tags: ['cost-of-delay', 'urgency']
  },
  {
    id: 'cta-014',
    content: "Ready to plug the revenue leaks?",
    category: 'cta',
    urgency: 'medium',
    tags: ['readiness', 'solution']
  },
  {
    id: 'cta-015',
    content: "See how AI can transform your business today.",
    category: 'cta',
    urgency: 'medium',
    tags: ['transformation', 'ai-benefits']
  },
  {
    id: 'cta-016',
    content: "Book more. Stress less. Start here.",
    category: 'cta',
    urgency: 'low',
    tags: ['benefits', 'simplicity']
  },
  {
    id: 'cta-017',
    content: "Your free analysis is one click away.",
    category: 'cta',
    urgency: 'low',
    tags: ['convenience', 'free']
  },
  {
    id: 'cta-018',
    content: "Stop wondering. Start knowing.",
    category: 'cta',
    urgency: 'medium',
    tags: ['certainty', 'knowledge']
  },
  {
    id: 'cta-019',
    content: "Get the numbers that matter to your bottom line.",
    category: 'cta',
    urgency: 'medium',
    tags: ['metrics', 'bottom-line']
  },
  {
    id: 'cta-020',
    content: "Time is money. Save both.",
    category: 'cta',
    urgency: 'high',
    tags: ['efficiency', 'savings']
  },
  {
    id: 'cta-021',
    content: "Unlock hidden revenue in your practice.",
    category: 'cta',
    urgency: 'medium',
    tags: ['hidden-revenue', 'discovery']
  },
  {
    id: 'cta-022',
    content: "See what $50K in recovered revenue looks like.",
    category: 'cta',
    urgency: 'high',
    tags: ['specific-roi', 'visualization']
  },
  {
    id: 'cta-023',
    content: "Your patients are trying to reach you. Are you listening?",
    category: 'cta',
    urgency: 'medium',
    tags: ['patient-care', 'communication']
  },
  {
    id: 'cta-024',
    content: "Calculate your practice's AI readiness score.",
    category: 'cta',
    urgency: 'low',
    tags: ['assessment', 'readiness']
  },
  {
    id: 'cta-025',
    content: "No more missed opportunities. Guaranteed.",
    category: 'cta',
    urgency: 'high',
    tags: ['guarantee', 'reliability']
  },
  {
    id: 'cta-026',
    content: "Join practices already recovering $20K+ monthly.",
    category: 'cta',
    urgency: 'medium',
    tags: ['social-proof', 'results']
  },
  {
    id: 'cta-027',
    content: "Free audit. Real results. No strings attached.",
    category: 'cta',
    urgency: 'low',
    tags: ['no-commitment', 'trust']
  },
  {
    id: 'cta-028',
    content: "Your revenue recovery journey starts now.",
    category: 'cta',
    urgency: 'medium',
    tags: ['journey', 'beginning']
  },
  {
    id: 'cta-029',
    content: "See the money you didn't know you were losing.",
    category: 'cta',
    urgency: 'high',
    tags: ['revelation', 'awareness']
  },
  {
    id: 'cta-030',
    content: "Transform missed calls into booked appointments.",
    category: 'cta',
    urgency: 'high',
    tags: ['transformation', 'booking']
  }
];

// Insight Examples (60 total)
export const insightExamples: InsightExample[] = [
  // NeedAgentIQ™ Insights (20)
  {
    id: 'insight-niq-001',
    content: "You're operating with fewer than 50% of your calls being answered live. That's a silent leak.",
    category: 'insight',
    type: 'needagentiq',
    tags: ['call-answer-rate', 'missed-calls']
  },
  {
    id: 'insight-niq-002',
    content: "Even a 10% reduction in no-shows could recover $3,000+ monthly.",
    category: 'insight',
    type: 'needagentiq',
    tags: ['no-shows', 'revenue-recovery']
  },
  {
    id: 'insight-niq-003',
    content: "Manual confirmations = human error. Let Voice AI lock in each visit reliably.",
    category: 'insight',
    type: 'needagentiq',
    tags: ['automation', 'reliability', 'confirmations']
  },
  {
    id: 'insight-niq-004',
    content: "Your current phone system handles 60% of calls. The other 40% become missed revenue.",
    category: 'insight',
    type: 'needagentiq',
    tags: ['phone-system', 'missed-revenue']
  },
  {
    id: 'insight-niq-005',
    content: "After-hours calls are gold mines. Are you mining them?",
    category: 'insight',
    type: 'needagentiq',
    tags: ['after-hours', 'opportunities']
  },
  {
    id: 'insight-niq-006',
    content: "Voice AI doesn't take sick days, vacations, or breaks. Your revenue flow stays consistent.",
    category: 'insight',
    type: 'needagentiq',
    tags: ['consistency', 'reliability']
  },
  {
    id: 'insight-niq-007',
    content: "Each missed call costs you $200-500 in potential revenue. How many did you miss today?",
    category: 'insight',
    type: 'needagentiq',
    tags: ['cost-per-call', 'awareness']
  },
  {
    id: 'insight-niq-008',
    content: "Your competition answers calls you're missing. Level the playing field with AI.",
    category: 'insight',
    type: 'needagentiq',
    tags: ['competition', 'market-advantage']
  },
  {
    id: 'insight-niq-009',
    content: "Patients who get immediate responses book 3x more often than those who wait.",
    category: 'insight',
    type: 'needagentiq',
    tags: ['response-time', 'booking-rates']
  },
  {
    id: 'insight-niq-010',
    content: "Your staff is drowning in calls. Give them a Voice AI lifeline.",
    category: 'insight',
    type: 'needagentiq',
    tags: ['staff-relief', 'efficiency']
  },
  {
    id: 'insight-niq-011',
    content: "Weekend and evening inquiries convert 40% higher when answered immediately.",
    category: 'insight',
    type: 'needagentiq',
    tags: ['off-hours', 'conversion']
  },
  {
    id: 'insight-niq-012',
    content: "Your current system loses track of follow-ups. AI never forgets.",
    category: 'insight',
    type: 'needagentiq',
    tags: ['follow-up', 'memory']
  },
  {
    id: 'insight-niq-013',
    content: "Busy signals are revenue signals. Each one represents lost income.",
    category: 'insight',
    type: 'needagentiq',
    tags: ['busy-signals', 'lost-income']
  },
  {
    id: 'insight-niq-014',
    content: "Your phone rings 200+ times daily. How many become appointments?",
    category: 'insight',
    type: 'needagentiq',
    tags: ['call-volume', 'conversion']
  },
  {
    id: 'insight-niq-015',
    content: "Manual scheduling errors cost you double: lost appointments and upset patients.",
    category: 'insight',
    type: 'needagentiq',
    tags: ['scheduling-errors', 'patient-satisfaction']
  },
  {
    id: 'insight-niq-016',
    content: "Voice AI works 24/7/365. Your revenue opportunity never sleeps.",
    category: 'insight',
    type: 'needagentiq',
    tags: ['24-7', 'continuous-revenue']
  },
  {
    id: 'insight-niq-017',
    content: "Every voicemail is a missed opportunity to book immediately.",
    category: 'insight',
    type: 'needagentiq',
    tags: ['voicemail', 'immediate-booking']
  },
  {
    id: 'insight-niq-018',
    content: "Your current hold time averages 3 minutes. Patients hang up after 90 seconds.",
    category: 'insight',
    type: 'needagentiq',
    tags: ['hold-time', 'patient-behavior']
  },
  {
    id: 'insight-niq-019',
    content: "Lunch break = revenue break. Voice AI keeps the money flowing.",
    category: 'insight',
    type: 'needagentiq',
    tags: ['lunch-break', 'continuous-service']
  },
  {
    id: 'insight-niq-020',
    content: "Your best staff member handles 20 calls/hour. Voice AI handles 200.",
    category: 'insight',
    type: 'needagentiq',
    tags: ['capacity', 'efficiency']
  },
  
  // Audit Final Report Insights (20)
  {
    id: 'insight-audit-001',
    content: "Based on your current workflow, you're leaving up to $12,400/month unrecovered.",
    category: 'insight',
    type: 'audit-report',
    tags: ['workflow-analysis', 'monthly-loss']
  },
  {
    id: 'insight-audit-002',
    content: "With Voice AI, your practice could reduce missed revenue by 45% within 60 days.",
    category: 'insight',
    type: 'audit-report',
    tags: ['timeframe', 'reduction-percentage']
  },
  {
    id: 'insight-audit-003',
    content: "Your team handles the load, but AI would free them to focus on patients, not phone calls.",
    category: 'insight',
    type: 'audit-report',
    tags: ['staff-optimization', 'patient-focus']
  },
  {
    id: 'insight-audit-004',
    content: "Your audit reveals 3 critical gaps where $8,000+ monthly slips through.",
    category: 'insight',
    type: 'audit-report',
    tags: ['critical-gaps', 'specific-loss']
  },
  {
    id: 'insight-audit-005',
    content: "Implementation would pay for itself in 23 days based on your current losses.",
    category: 'insight',
    type: 'audit-report',
    tags: ['roi-timeline', 'payback-period']
  },
  {
    id: 'insight-audit-006',
    content: "Your no-show rate of 18% is costing you $156,000 annually in lost revenue.",
    category: 'insight',
    type: 'audit-report',
    tags: ['no-show-rate', 'annual-cost']
  },
  {
    id: 'insight-audit-007',
    content: "Voice AI would eliminate 89% of your current scheduling conflicts.",
    category: 'insight',
    type: 'audit-report',
    tags: ['scheduling-conflicts', 'elimination-rate']
  },
  {
    id: 'insight-audit-008',
    content: "Your practice operates at 67% capacity. AI could push that to 85%+.",
    category: 'insight',
    type: 'audit-report',
    tags: ['capacity-utilization', 'improvement-potential']
  },
  {
    id: 'insight-audit-009',
    content: "Based on your responses, you're losing 23% more revenue than similar practices.",
    category: 'insight',
    type: 'audit-report',
    tags: ['benchmark-comparison', 'relative-performance']
  },
  {
    id: 'insight-audit-010',
    content: "Your current system misses 67% of after-hours opportunities worth $4,200/month.",
    category: 'insight',
    type: 'audit-report',
    tags: ['after-hours-analysis', 'opportunity-cost']
  },
  {
    id: 'insight-audit-011',
    content: "AI implementation would generate an additional $89,000 in the first year.",
    category: 'insight',
    type: 'audit-report',
    tags: ['first-year-roi', 'revenue-generation']
  },
  {
    id: 'insight-audit-012',
    content: "Your audit score of 34/100 indicates massive untapped revenue potential.",
    category: 'insight',
    type: 'audit-report',
    tags: ['audit-score', 'potential-assessment']
  },
  {
    id: 'insight-audit-013',
    content: "Voice AI would handle 78% of your current administrative call volume automatically.",
    category: 'insight',
    type: 'audit-report',
    tags: ['automation-percentage', 'administrative-relief']
  },
  {
    id: 'insight-audit-014',
    content: "Your practice loses $340 daily to communication gaps. That's $124,100 yearly.",
    category: 'insight',
    type: 'audit-report',
    tags: ['daily-loss', 'communication-gaps']
  },
  {
    id: 'insight-audit-015',
    content: "Based on your workflow, AI would free up 14 hours weekly for revenue-generating activities.",
    category: 'insight',
    type: 'audit-report',
    tags: ['time-savings', 'revenue-activities']
  },
  {
    id: 'insight-audit-016',
    content: "Your current follow-up system recovers only 31% of missed appointments. AI achieves 89%.",
    category: 'insight',
    type: 'audit-report',
    tags: ['follow-up-effectiveness', 'recovery-rate']
  },
  {
    id: 'insight-audit-017',
    content: "Voice AI would reduce your patient wait times from 4.2 minutes to under 30 seconds.",
    category: 'insight',
    type: 'audit-report',
    tags: ['wait-time-reduction', 'patient-experience']
  },
  {
    id: 'insight-audit-018',
    content: "Your audit reveals you're operating 23% below optimal efficiency levels.",
    category: 'insight',
    type: 'audit-report',
    tags: ['efficiency-gap', 'optimization-potential']
  },
  {
    id: 'insight-audit-019',
    content: "Implementation would eliminate 94% of your current booking errors.",
    category: 'insight',
    type: 'audit-report',
    tags: ['error-reduction', 'booking-accuracy']
  },
  {
    id: 'insight-audit-020',
    content: "Your practice could serve 34% more patients without adding staff through AI optimization.",
    category: 'insight',
    type: 'audit-report',
    tags: ['capacity-expansion', 'staff-efficiency']
  },
  
  // Solutions Modal Insights (10)
  {
    id: 'insight-solution-001',
    content: "This service was designed to fill the exact type of gap you're facing.",
    category: 'insight',
    type: 'solutions-modal',
    tags: ['targeted-solution', 'gap-filling']
  },
  {
    id: 'insight-solution-002',
    content: "Our Voice Agent closes the loop where your team currently drops off.",
    category: 'insight',
    type: 'solutions-modal',
    tags: ['loop-closure', 'team-support']
  },
  {
    id: 'insight-solution-003',
    content: "Need more bookings without hiring? This Agent does just that.",
    category: 'insight',
    type: 'solutions-modal',
    tags: ['booking-increase', 'no-hiring']
  },
  {
    id: 'insight-solution-004',
    content: "This solution handles the exact scenarios causing your revenue leaks.",
    category: 'insight',
    type: 'solutions-modal',
    tags: ['scenario-specific', 'leak-prevention']
  },
  {
    id: 'insight-solution-005',
    content: "Perfect fit for practices like yours facing similar challenges.",
    category: 'insight',
    type: 'solutions-modal',
    tags: ['practice-fit', 'similar-challenges']
  },
  {
    id: 'insight-solution-006',
    content: "This Agent specializes in the exact pain points you identified.",
    category: 'insight',
    type: 'solutions-modal',
    tags: ['pain-point-specialist', 'targeted-relief']
  },
  {
    id: 'insight-solution-007',
    content: "Seamless integration with your existing workflow - no disruption, just results.",
    category: 'insight',
    type: 'solutions-modal',
    tags: ['seamless-integration', 'no-disruption']
  },
  {
    id: 'insight-solution-008',
    content: "This solution addresses all three issues you flagged in your audit.",
    category: 'insight',
    type: 'solutions-modal',
    tags: ['comprehensive-solution', 'audit-alignment']
  },
  {
    id: 'insight-solution-009',
    content: "Built specifically for the challenges your practice size faces daily.",
    category: 'insight',
    type: 'solutions-modal',
    tags: ['size-specific', 'daily-challenges']
  },
  {
    id: 'insight-solution-010',
    content: "This Agent turns your biggest operational weakness into your strongest asset.",
    category: 'insight',
    type: 'solutions-modal',
    tags: ['weakness-to-strength', 'transformation']
  },
  
  // Fallback Insights (10)
  {
    id: 'insight-fallback-001',
    content: "We've helped practices like yours recover $20K+/year from this exact issue.",
    category: 'insight',
    type: 'fallback',
    tags: ['social-proof', 'recovery-amount']
  },
  {
    id: 'insight-fallback-002',
    content: "Even if patients ignore SMS, this Agent speaks to them directly.",
    category: 'insight',
    type: 'fallback',
    tags: ['direct-communication', 'sms-alternative']
  },
  {
    id: 'insight-fallback-003',
    content: "This isn't just automation — it's real revenue recovery.",
    category: 'insight',
    type: 'fallback',
    tags: ['beyond-automation', 'revenue-focus']
  },
  {
    id: 'insight-fallback-004',
    content: "Every practice has blind spots. AI helps you see and fix them.",
    category: 'insight',
    type: 'fallback',
    tags: ['blind-spots', 'visibility']
  },
  {
    id: 'insight-fallback-005',
    content: "The difference between good and great practices? They don't miss opportunities.",
    category: 'insight',
    type: 'fallback',
    tags: ['excellence', 'opportunity-capture']
  },
  {
    id: 'insight-fallback-006',
    content: "Your patients want to book with you. Make it impossible for them to fail.",
    category: 'insight',
    type: 'fallback',
    tags: ['patient-intent', 'booking-success']
  },
  {
    id: 'insight-fallback-007',
    content: "Small improvements in communication create massive revenue gains.",
    category: 'insight',
    type: 'fallback',
    tags: ['small-improvements', 'massive-gains']
  },
  {
    id: 'insight-fallback-008',
    content: "The money is there. You just need the right system to capture it.",
    category: 'insight',
    type: 'fallback',
    tags: ['money-exists', 'capture-system']
  },
  {
    id: 'insight-fallback-009',
    content: "What if every call that came in actually became an appointment?",
    category: 'insight',
    type: 'fallback',
    tags: ['what-if', 'perfect-conversion']
  },
  {
    id: 'insight-fallback-010',
    content: "Your practice has potential. Voice AI helps you reach it.",
    category: 'insight',
    type: 'fallback',
    tags: ['potential-realization', 'goal-achievement']
  }
];

// Follow-Up Prompts (35 total)
export const followUpPrompts: FollowUpPrompt[] = [
  // For Inactive Users (10)
  {
    id: 'followup-inactive-001',
    content: "We noticed you haven't completed your audit. Want to pick up where you left off?",
    category: 'follow-up',
    type: 'inactive-users',
    timing: 'delayed',
    tags: ['incomplete-audit', 'continuation']
  },
  {
    id: 'followup-inactive-002',
    content: "Still curious about how much you're losing to no-shows? Let's finish the report.",
    category: 'follow-up',
    type: 'inactive-users',
    timing: 'delayed',
    tags: ['no-shows', 'report-completion']
  },
  {
    id: 'followup-inactive-003',
    content: "Your partial audit shows promising insights. Ready to see the full picture?",
    category: 'follow-up',
    type: 'inactive-users',
    timing: 'delayed',
    tags: ['partial-insights', 'full-picture']
  },
  {
    id: 'followup-inactive-004',
    content: "We saved your progress. Complete your revenue analysis in just 2 more minutes.",
    category: 'follow-up',
    type: 'inactive-users',
    timing: 'immediate',
    tags: ['saved-progress', 'time-estimate']
  },
  {
    id: 'followup-inactive-005',
    content: "Don't miss out on your personalized revenue recovery report.",
    category: 'follow-up',
    type: 'inactive-users',
    timing: 'persistent',
    tags: ['personalized-report', 'fomo']
  },
  {
    id: 'followup-inactive-006',
    content: "Your competitors are getting their audits done. Shouldn't you?",
    category: 'follow-up',
    type: 'inactive-users',
    timing: 'delayed',
    tags: ['competitive-pressure', 'urgency']
  },
  {
    id: 'followup-inactive-007',
    content: "We're holding your spot. Finish your audit before it expires.",
    category: 'follow-up',
    type: 'inactive-users',
    timing: 'persistent',
    tags: ['scarcity', 'expiration']
  },
  {
    id: 'followup-inactive-008',
    content: "Quick question: What's preventing you from completing the audit?",
    category: 'follow-up',
    type: 'inactive-users',
    timing: 'immediate',
    tags: ['barrier-identification', 'question']
  },
  {
    id: 'followup-inactive-009',
    content: "Every day you delay costs you money. Finish your audit now.",
    category: 'follow-up',
    type: 'inactive-users',
    timing: 'persistent',
    tags: ['cost-of-delay', 'urgency']
  },
  {
    id: 'followup-inactive-010',
    content: "Last chance to see what you're really losing. Complete your audit today.",
    category: 'follow-up',
    type: 'inactive-users',
    timing: 'persistent',
    tags: ['last-chance', 'finality']
  },
  
  // For "Need More Time to Decide" (15)
  {
    id: 'followup-time-001',
    content: "Take your time — but let us know if you'd like to see examples from similar businesses.",
    category: 'follow-up',
    type: 'need-time',
    timing: 'immediate',
    tags: ['patience', 'examples-offer']
  },
  {
    id: 'followup-time-002',
    content: "We can prepare a custom projection for your practice in the meantime.",
    category: 'follow-up',
    type: 'need-time',
    timing: 'delayed',
    tags: ['custom-projection', 'added-value']
  },
  {
    id: 'followup-time-003',
    content: "When you're ready, we'll walk through the numbers together.",
    category: 'follow-up',
    type: 'need-time',
    timing: 'delayed',
    tags: ['support-offer', 'guidance']
  },
  {
    id: 'followup-time-004',
    content: "No pressure. Here's what other practices decided after taking time to think.",
    category: 'follow-up',
    type: 'need-time',
    timing: 'delayed',
    tags: ['no-pressure', 'social-proof']
  },
  {
    id: 'followup-time-005',
    content: "While you decide, would you like to see a quick demo of how it works?",
    category: 'follow-up',
    type: 'need-time',
    timing: 'immediate',
    tags: ['demo-offer', 'education']
  },
  {
    id: 'followup-time-006',
    content: "Totally understand. Can I answer any specific concerns while you consider?",
    category: 'follow-up',
    type: 'need-time',
    timing: 'immediate',
    tags: ['understanding', 'concern-addressing']
  },
  {
    id: 'followup-time-007',
    content: "Here's what you should consider while making your decision...",
    category: 'follow-up',
    type: 'need-time',
    timing: 'delayed',
    tags: ['decision-framework', 'guidance']
  },
  {
    id: 'followup-time-008',
    content: "We'll check back in a few days. Meanwhile, your report will be waiting.",
    category: 'follow-up',
    type: 'need-time',
    timing: 'delayed',
    tags: ['check-back', 'report-availability']
  },
  {
    id: 'followup-time-009',
    content: "Smart to think it through. Here are the key questions other practices asked.",
    category: 'follow-up',
    type: 'need-time',
    timing: 'delayed',
    tags: ['validation', 'common-questions']
  },
  {
    id: 'followup-time-010',
    content: "Take all the time you need. The opportunity will be here when you're ready.",
    category: 'follow-up',
    type: 'need-time',
    timing: 'immediate',
    tags: ['patience', 'opportunity-persistence']
  },
  {
    id: 'followup-time-011',
    content: "While you're deciding, would a conversation with our implementation team help?",
    category: 'follow-up',
    type: 'need-time',
    timing: 'delayed',
    tags: ['implementation-team', 'support']
  },
  {
    id: 'followup-time-012',
    content: "No rush. Here's what you should expect if you move forward...",
    category: 'follow-up',
    type: 'need-time',
    timing: 'delayed',
    tags: ['expectations', 'process-clarity']
  },
  {
    id: 'followup-time-013',
    content: "Good call taking time to evaluate. Want to discuss your specific situation?",
    category: 'follow-up',
    type: 'need-time',
    timing: 'delayed',
    tags: ['evaluation-support', 'specific-discussion']
  },
  {
    id: 'followup-time-014',
    content: "We respect your decision process. Here are resources to help you decide.",
    category: 'follow-up',
    type: 'need-time',
    timing: 'delayed',
    tags: ['respect', 'decision-resources']
  },
  {
    id: 'followup-time-015',
    content: "Perfect time to review your current costs vs. our solution benefits.",
    category: 'follow-up',
    type: 'need-time',
    timing: 'delayed',
    tags: ['cost-benefit', 'comparison']
  },
  
  // Clarify / Expand a Solution (10)
  {
    id: 'followup-clarify-001',
    content: "Would you like a quick demo of how this Agent handles follow-ups?",
    category: 'follow-up',
    type: 'clarify-solution',
    timing: 'immediate',
    tags: ['demo-request', 'follow-up-handling']
  },
  {
    id: 'followup-clarify-002',
    content: "Want to simulate a real patient scenario with this Agent?",
    category: 'follow-up',
    type: 'clarify-solution',
    timing: 'immediate',
    tags: ['simulation', 'patient-scenario']
  },
  {
    id: 'followup-clarify-003',
    content: "Need help calculating exact savings with this integration?",
    category: 'follow-up',
    type: 'clarify-solution',
    timing: 'immediate',
    tags: ['savings-calculation', 'integration']
  },
  {
    id: 'followup-clarify-004',
    content: "Let me show you exactly how this works with your current system.",
    category: 'follow-up',
    type: 'clarify-solution',
    timing: 'immediate',
    tags: ['system-integration', 'demonstration']
  },
  {
    id: 'followup-clarify-005',
    content: "Want to see how this handles your most challenging call scenarios?",
    category: 'follow-up',
    type: 'clarify-solution',
    timing: 'immediate',
    tags: ['challenging-scenarios', 'capability-demo']
  },
  {
    id: 'followup-clarify-006',
    content: "Curious about implementation timeline? Let me walk you through it.",
    category: 'follow-up',
    type: 'clarify-solution',
    timing: 'immediate',
    tags: ['implementation-timeline', 'process']
  },
  {
    id: 'followup-clarify-007',
    content: "Would examples from similar practices help clarify the benefits?",
    category: 'follow-up',
    type: 'clarify-solution',
    timing: 'delayed',
    tags: ['similar-practices', 'benefit-clarification']
  },
  {
    id: 'followup-clarify-008',
    content: "Let's dive deeper into how this solves your specific pain point.",
    category: 'follow-up',
    type: 'clarify-solution',
    timing: 'immediate',
    tags: ['pain-point', 'deep-dive']
  },
  {
    id: 'followup-clarify-009',
    content: "Want to understand the technical integration requirements?",
    category: 'follow-up',
    type: 'clarify-solution',
    timing: 'immediate',
    tags: ['technical-integration', 'requirements']
  },
  {
    id: 'followup-clarify-010',
    content: "Should we schedule a detailed walkthrough of this solution?",
    category: 'follow-up',
    type: 'clarify-solution',
    timing: 'delayed',
    tags: ['detailed-walkthrough', 'scheduling']
  }
];

// Helper Functions
export function getAllFollowUpPrompts(): FollowUpPrompt[] {
  return followUpPrompts;
}

export function getFollowUpPromptsByType(type: FollowUpPrompt['type']): FollowUpPrompt[] {
  return followUpPrompts.filter(prompt => prompt.type === type);
}

export function getRandomFollowUpPrompt(type?: FollowUpPrompt['type']): FollowUpPrompt {
  const prompts = type ? getFollowUpPromptsByType(type) : followUpPrompts;
  return prompts[Math.floor(Math.random() * prompts.length)];
}

export function getAllInsights(): InsightExample[] {
  return insightExamples;
}

export function getInsightsByType(type: InsightExample['type']): InsightExample[] {
  return insightExamples.filter(insight => insight.type === type);
}

export function getRandomInsight(type?: InsightExample['type']): InsightExample {
  const insights = type ? getInsightsByType(type) : insightExamples;
  return insights[Math.floor(Math.random() * insights.length)];
}

export function getRandomCTA(): CTAPhrase {
  return ctaPhrases[Math.floor(Math.random() * ctaPhrases.length)];
}

// Legacy structure for backward compatibility
export const responseModels = {
  templates: {
    greeting: ctaPhrases.filter(cta => cta.urgency === 'low'),
    questioning: followUpPrompts.filter(prompt => prompt.type === 'clarify-solution'),
    clarification: followUpPrompts.filter(prompt => prompt.type === 'need-time'),
    summary: insightExamples.filter(insight => insight.type === 'audit-report'),
    recommendation: insightExamples.filter(insight => insight.type === 'solutions-modal')
  },
  
  toneAdjustments: {
    urgent: ctaPhrases.filter(cta => cta.urgency === 'high'),
    gentle: followUpPrompts.filter(prompt => prompt.type === 'need-time'),
    persuasive: insightExamples.filter(insight => insight.type === 'needagentiq'),
    supportive: followUpPrompts.filter(prompt => prompt.timing === 'immediate')
  },
  
  contextualResponses: {
    afterAudit: insightExamples.filter(insight => insight.type === 'audit-report'),
    duringFollowUp: followUpPrompts,
    inSolutionsModal: insightExamples.filter(insight => insight.type === 'solutions-modal'),
    forInactiveUsers: followUpPrompts.filter(prompt => prompt.type === 'inactive-users')
  }
};

export default responseModels;