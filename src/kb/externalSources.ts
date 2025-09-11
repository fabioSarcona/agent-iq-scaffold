// External data sources and integrations

export interface ExternalSource {
  id: string;
  title: string;
  url: string;
  domain: string;
  category: 'Online Reviews & Revenue' | 'Home Services Industry' | 'Dental Practice' | 'Healthcare Compliance';
  excerpt?: string;
  year?: number;
}

export interface ExternalSourcesModule {
  purpose: {
    description: string;
    features: string[];
  };
  sources: ExternalSource[];
}

export const externalSources: ExternalSourcesModule = {
  purpose: {
    description: "Centralizes validated external references that support NeedAgent.AI's claims and provide industry benchmarks for audit, reports, and marketing assets.",
    features: [
      "Credible source validation for ROI claims",
      "Industry benchmark references",
      "Category-based source organization",
      "Domain authority tracking",
      "Excerpt preservation for quick reference"
    ]
  },
  
  sources: [
    // Online Reviews & Revenue
    {
      id: "harvard-yelp-revenue",
      title: "Harvard Business School Study - Yelp Reviews Impact",
      url: "https://www.harvardmagazine.com/2011/10/hbs-study-finds-positive-yelp-reviews-boost-business",
      domain: "harvardmagazine.com",
      category: "Online Reviews & Revenue",
      excerpt: "Positive Yelp reviews increase business revenue by 5–9%.",
      year: 2011
    },
    {
      id: "hbr-customer-reviews-impact",
      title: "Harvard Business Review – Customer Reviews Impact",
      url: "https://hbr.org/2023/03/research-the-pros-and-cons-of-soliciting-customer-reviews",
      domain: "hbr.org",
      category: "Online Reviews & Revenue",
      excerpt: "98% of consumers read reviews before purchasing; reviews influenced $3.8 trillion global revenue (2021).",
      year: 2023
    },
    {
      id: "hbr-responding-reviews",
      title: "Harvard Business Review – Responding to Reviews",
      url: "https://hbr.org/2018/02/study-replying-to-customer-reviews-results-in-better-ratings",
      domain: "hbr.org",
      category: "Online Reviews & Revenue",
      excerpt: "Hotels replying to reviews increased positive reviews by 12% and ratings by +0.12★.",
      year: 2018
    },

    // Home Services Industry
    {
      id: "servicetitan-hvac-growth",
      title: "ServiceTitan – HVAC Industry Growth",
      url: "https://www.servicetitan.com/blog/home-services-industry-statistics",
      domain: "servicetitan.com",
      category: "Home Services Industry",
      excerpt: "HVAC companies grew revenue +10% in 2023 due to climate-driven demand.",
      year: 2023
    },
    {
      id: "servicetitan-customer-priorities",
      title: "ServiceTitan – HVAC Customer Priorities",
      url: "https://www.servicetitan.com/blog/home-services-industry-statistics",
      domain: "servicetitan.com",
      category: "Home Services Industry",
      excerpt: "41% of positive reviews cite friendliness over technical skill.",
      year: 2023
    },
    {
      id: "angi-market-size",
      title: "Angi/HomeAdvisor – Home Services Market Size",
      url: "https://research.angi.com/research/reports/market/market-2020/",
      domain: "research.angi.com",
      category: "Home Services Industry",
      excerpt: "U.S. market worth ~$506B/year; 5M workers.",
      year: 2020
    },
    {
      id: "angi-job-volume",
      title: "Angi/HomeAdvisor – Volume of Jobs",
      url: "https://research.angi.com/research/reports/market/market-2020/",
      domain: "research.angi.com",
      category: "Home Services Industry",
      excerpt: "~511M home service jobs/year = 16 jobs per second.",
      year: 2020
    },
    {
      id: "servicetitan-new-businesses",
      title: "Yelp/ServiceTitan – New Home Service Businesses",
      url: "https://www.servicetitan.com/blog/home-services-industry-statistics",
      domain: "servicetitan.com",
      category: "Home Services Industry",
      excerpt: "278,000 new U.S. businesses opened in 2023 (+32% YoY).",
      year: 2023
    },
    {
      id: "servicetitan-ondemand-surge",
      title: "Amenify/ServiceTitan – On-Demand Services Uptick",
      url: "https://www.servicetitan.com/blog/home-services-industry-statistics",
      domain: "servicetitan.com",
      category: "Home Services Industry",
      excerpt: "+150% surge in on-demand bookings since pandemic.",
      year: 2023
    },
    {
      id: "hook-angi-lead-costs",
      title: "Hook Agency – Cost of Angi Leads",
      url: "https://hookagency.com/blog/angi-leads-reviews/",
      domain: "hookagency.com",
      category: "Home Services Industry",
      excerpt: "Angi leads cost $15–$100 each; pay per contact, not guaranteed clients."
    },
    {
      id: "housecall-revenue-uplift",
      title: "Housecall Pro – Revenue Uplift with Software",
      url: "https://www.housecallpro.com/resources/how-to-price-hvac-services/",
      domain: "housecallpro.com",
      category: "Home Services Industry",
      excerpt: "Companies using Housecall Pro see +35% revenue in first year."
    },

    // Dental Practice
    {
      id: "golden-dental-roi-benchmarks",
      title: "Golden Proportions – Dental ROI Benchmarks",
      url: "https://www.goldenproportions.com/blog/dental-marketing/dental-marketing-budget-roi/",
      domain: "goldenproportions.com",
      category: "Dental Practice",
      excerpt: "Typical ROI = 3–5x marketing spend."
    },
    {
      id: "golden-phone-conversion",
      title: "Golden Proportions – Phone Conversion Rate",
      url: "https://www.goldenproportions.com/blog/call-tracking/improve-your-phone-conversion-rate-with-call-tracking-for-dentists/",
      domain: "goldenproportions.com",
      category: "Dental Practice",
      excerpt: "Only 30–50% of calls convert to appointments; many practices score lower."
    },
    {
      id: "golden-hygiene-production",
      title: "Golden Proportions – Hygiene Production Ratio",
      url: "https://www.goldenproportions.com/blog/dental-marketing/key-dental-metrics-to-master-for-a-thriving-practice/",
      domain: "goldenproportions.com",
      category: "Dental Practice",
      excerpt: "Hygiene should be 25–35% of production; mismanagement erodes profit."
    },
    {
      id: "golden-collections-ratio",
      title: "Golden Proportions – Collections Ratio",
      url: "https://www.goldenproportions.com/blog/dental-marketing/key-dental-metrics-to-master-for-a-thriving-practice/",
      domain: "goldenproportions.com",
      category: "Dental Practice",
      excerpt: "Keep >95% collections; anything less = lost revenue."
    },
    {
      id: "golden-patient-lifetime",
      title: "Golden Proportions – Patient Lifetime & Referrals",
      url: "https://www.goldenproportions.com/blog/dental-marketing/dental-marketing-budget-roi/",
      domain: "goldenproportions.com",
      category: "Dental Practice",
      excerpt: "Average patient lifetime 7–10 years; referrals are critical for ROI."
    },
    {
      id: "baker-marketing-budget",
      title: "Baker Labs – Marketing Budget Guidelines",
      url: "https://bakerlabs.co/how-much-should-dental-practice-spend-marketing/",
      domain: "bakerlabs.co",
      category: "Dental Practice",
      excerpt: "Dentists should allocate 2–3% of revenue to marketing (5%+ in growth phases)."
    },
    {
      id: "doctible-noshows-case",
      title: "Doctible – Reducing No-Shows (Case Study)",
      url: "https://www.doctible.com/use-case/dental",
      domain: "doctible.com",
      category: "Dental Practice",
      excerpt: "Automated waitlist filled 44% of canceled slots without manual work."
    },
    {
      id: "yesdoctor-healthcare-search",
      title: "YesDoctor – Healthcare Meta-Search",
      url: "https://yesdoctor.com",
      domain: "yesdoctor.com",
      category: "Dental Practice",
      excerpt: "Healthcare search engines help patients compare providers effectively."
    },

    // Healthcare Compliance
    {
      id: "retell-hipaa-compliance",
      title: "Retell AI – HIPAA & BAA Compliance",
      url: "https://www.retellai.com/blog/do-retell-ais-voice-agents-have-hipaa-compliance-and-baas",
      domain: "retellai.com",
      category: "Healthcare Compliance",
      excerpt: "Full HIPAA compliance: encrypted calls, access control, secure storage."
    },
    {
      id: "retell-compliance-risks",
      title: "Retell AI – HIPAA Non-Compliance Risks",
      url: "https://www.retellai.com/blog/do-retell-ais-voice-agents-have-hipaa-compliance-and-baas",
      domain: "retellai.com",
      category: "Healthcare Compliance",
      excerpt: "Failure to comply results in severe penalties for healthcare providers."
    },
    {
      id: "keragon-hipaa-integrations",
      title: "Keragon – HIPAA-Compliant Integrations",
      url: "https://www.keragon.com/integrations/retell-ai",
      domain: "keragon.com",
      category: "Healthcare Compliance",
      excerpt: "No-code workflows connecting Retell AI to EHR systems securely."
    }
  ]
};

// Helper Functions

/**
 * Get all unique categories from the sources
 */
export function getAllCategories(): ExternalSource['category'][] {
  const categories = new Set(externalSources.sources.map(source => source.category));
  return Array.from(categories);
}

/**
 * Filter sources by category
 */
export function getSourcesByCategory(category: ExternalSource['category']): ExternalSource[] {
  return externalSources.sources.filter(source => source.category === category);
}

/**
 * Filter sources by domain for credibility assessment
 */
export function getSourcesByDomain(domain: string): ExternalSource[] {
  return externalSources.sources.filter(source => source.domain === domain);
}

/**
 * Find a specific source by ID
 */
export function findSourceById(id: string): ExternalSource | undefined {
  return externalSources.sources.find(source => source.id === id);
}

/**
 * Get sources by year range for freshness validation
 */
export function getSourcesByYearRange(startYear?: number, endYear?: number): ExternalSource[] {
  return externalSources.sources.filter(source => {
    if (!source.year) return !startYear && !endYear; // Include sources without year only if no range specified
    if (startYear && source.year < startYear) return false;
    if (endYear && source.year > endYear) return false;
    return true;
  });
}

/**
 * Search sources by title or excerpt content
 */
export function searchSources(query: string): ExternalSource[] {
  const lowerQuery = query.toLowerCase();
  return externalSources.sources.filter(source => 
    source.title.toLowerCase().includes(lowerQuery) ||
    source.excerpt?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get high-credibility sources (Harvard, HBR, major industry players)
 */
export function getHighCredibilitySources(): ExternalSource[] {
  const highCredibilityDomains = [
    'hbr.org',
    'harvardmagazine.com',
    'servicetitan.com',
    'research.angi.com',
    'goldenproportions.com'
  ];
  
  return externalSources.sources.filter(source => 
    highCredibilityDomains.includes(source.domain)
  );
}

/**
 * Get sources relevant to ROI and financial impact
 */
export function getROIRelevantSources(): ExternalSource[] {
  const roiKeywords = ['roi', 'revenue', 'growth', 'impact', 'conversion', 'collections', 'marketing'];
  return externalSources.sources.filter(source => 
    roiKeywords.some(keyword => 
      source.title.toLowerCase().includes(keyword) ||
      source.excerpt?.toLowerCase().includes(keyword)
    )
  );
}

export default externalSources;