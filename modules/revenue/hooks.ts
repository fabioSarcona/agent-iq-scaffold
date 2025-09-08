import { useState, useCallback, useMemo } from 'react'
import type { 
  Insight, 
  SimulatableSkill, 
  SimulationTotals,
  BusinessSize,
  Vertical 
} from './types'
import { 
  convertInsightsToSkills, 
  calculateSimulationTotals,
  applyBusinessSizeMultiplier,
  applyVerticalAdjustments
} from './utils'

interface UseSimulatorOptions {
  insights: Insight[]
  businessSize: BusinessSize
  vertical: Vertical
}

export function useSimulator({ insights, businessSize, vertical }: UseSimulatorOptions) {
  // Convert insights to skills with adjustments applied
  const initialSkills = useMemo(() => {
    return convertInsightsToSkills(insights).map(skill => ({
      ...skill,
      cost: applyVerticalAdjustments(
        applyBusinessSizeMultiplier(skill.cost, businessSize),
        vertical
      ),
      monthlyImpact: applyVerticalAdjustments(
        applyBusinessSizeMultiplier(skill.monthlyImpact, businessSize),
        vertical
      ),
    }))
  }, [insights, businessSize, vertical])

  const [skills, setSkills] = useState<SimulatableSkill[]>(initialSkills)

  // Toggle skill activation
  const toggleSkill = useCallback((skillId: string) => {
    setSkills(prev => prev.map(skill => 
      skill.id === skillId 
        ? { ...skill, isActive: !skill.isActive }
        : skill
    ))
  }, [])

  // Activate all skills
  const activateAll = useCallback(() => {
    setSkills(prev => prev.map(skill => ({ ...skill, isActive: true })))
  }, [])

  // Deactivate all skills
  const deactivateAll = useCallback(() => {
    setSkills(prev => prev.map(skill => ({ ...skill, isActive: false })))
  }, [])

  // Calculate totals
  const totals = useMemo(() => calculateSimulationTotals(skills), [skills])

  // Check if skill is active
  const isSkillActive = useCallback((skillId: string) => {
    return skills.find(skill => skill.id === skillId)?.isActive ?? false
  }, [skills])

  // Get skill by ID
  const getSkill = useCallback((skillId: string) => {
    return skills.find(skill => skill.id === skillId)
  }, [skills])

  return {
    skills,
    totals,
    toggleSkill,
    activateAll,
    deactivateAll,
    isSkillActive,
    getSkill,
  }
}

/**
 * Hook for managing ROI calculation display
 */
export function useROICalculation(totals: SimulationTotals) {
  const isPositiveROI = totals.netROI > 0
  const hasActiveSkills = totals.activeSkillsCount > 0
  
  const roiStatus = useMemo(() => {
    if (!hasActiveSkills) return 'neutral'
    return isPositiveROI ? 'positive' : 'negative'
  }, [isPositiveROI, hasActiveSkills])

  const roiColor = useMemo(() => {
    switch (roiStatus) {
      case 'positive': return 'text-success'
      case 'negative': return 'text-destructive'
      default: return 'text-muted-foreground'
    }
  }, [roiStatus])

  return {
    isPositiveROI,
    hasActiveSkills,
    roiStatus,
    roiColor,
  }
}