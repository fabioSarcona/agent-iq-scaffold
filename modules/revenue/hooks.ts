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

/**
 * Hook for saving simulation data
 */
export function useSaveSimulation() {
  const [isSaving, setIsSaving] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const saveSimulation = useCallback(async (data: any) => {
    setIsSaving(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Save to localStorage (simulate backend)
      const simulationId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const simulationData = {
        id: simulationId,
        ...data,
        saved_at: new Date().toISOString()
      }
      
      // Store in localStorage
      const existingSimulations = JSON.parse(localStorage.getItem('revenue_simulations') || '[]')
      existingSimulations.push(simulationData)
      localStorage.setItem('revenue_simulations', JSON.stringify(existingSimulations))
      
      // Log analytics event (anonymized)
      console.log('Analytics Event: revenue_simulation_saved', {
        simulation_id: simulationId,
        vertical: data.metadata.vertical,
        business_size: data.metadata.business_size,
        active_skills: data.totals.activeSkillsCount,
        net_roi: data.totals.netROI,
        roi_percentage: data.totals.roiPercentage,
        timestamp: data.metadata.timestamp
        // Note: email is NOT logged for privacy
      })
      
      setIsSuccess(true)
      
    } catch (error) {
      console.error('Error saving simulation:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [])
  
  const resetState = useCallback(() => {
    setIsSaving(false)
    setIsSuccess(false)
  }, [])
  
  return {
    saveSimulation,
    isSaving,
    isSuccess,
    resetState
  }
}