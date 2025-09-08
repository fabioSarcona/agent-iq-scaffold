import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Mail, CheckCircle, Loader2 } from 'lucide-react'
import { useSaveSimulation } from './hooks'
import type { SimulationTotals, SimulatableSkill } from './types'

interface SaveFormProps {
  isOpen: boolean
  onClose: () => void
  totals: SimulationTotals
  skills: SimulatableSkill[]
  vertical: string
  businessSize: string
}

export function SaveForm({ 
  isOpen, 
  onClose, 
  totals, 
  skills, 
  vertical, 
  businessSize 
}: SaveFormProps) {
  const [email, setEmail] = React.useState('')
  const [emailError, setEmailError] = React.useState('')
  const { toast } = useToast()
  
  const { saveSimulation, isSaving, isSuccess } = useSaveSimulation()
  
  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    
    if (emailError && value.trim() && validateEmail(value)) {
      setEmailError('')
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required')
      return
    }
    
    if (!validateEmail(email.trim())) {
      setEmailError('Please enter a valid email address')
      return
    }
    
    // Check if any skills are selected
    if (totals.activeSkillsCount === 0) {
      toast({
        title: "No skills selected",
        description: "Please select at least one AI Voice Skill before saving.",
        variant: "destructive"
      })
      return
    }
    
    try {
      await saveSimulation({
        email: email.trim(),
        totals,
        skills: skills.filter(skill => skill.isActive),
        metadata: {
          vertical,
          businessSize,
          timestamp: new Date().toISOString()
        }
      })
      
      toast({
        title: "Simulation saved successfully!",
        description: "We'll send you a custom implementation plan soon.",
      })
    } catch (error) {
      toast({
        title: "Error saving simulation",
        description: "Please try again or contact support.",
        variant: "destructive"
      })
    }
  }
  
  const handleClose = () => {
    setEmail('')
    setEmailError('')
    onClose()
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-primary" />
            <span>Save Your ROI Simulation</span>
          </DialogTitle>
          <DialogDescription>
            Enter your email and we'll send you this simulation with a custom implementation plan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Summary Card */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Monthly ROI</p>
                  <p className="font-semibold text-lg text-success">
                    ${totals.netROI.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Active Skills</p>
                  <p className="font-semibold text-lg">
                    {totals.activeSkillsCount} of {totals.totalSkillsCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {isSuccess ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                All Set!
              </h3>
              <p className="text-muted-foreground">
                We'll send you a custom plan based on your simulation soon.
              </p>
              <Button 
                onClick={handleClose} 
                className="mt-4"
                variant="outline"
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={handleEmailChange}
                  className={emailError ? 'border-destructive' : ''}
                  disabled={isSaving}
                />
                {emailError && (
                  <p className="text-sm text-destructive">{emailError}</p>
                )}
              </div>
              
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSaving}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save & Send Plan'
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                By saving this simulation, you agree to receive implementation guidance via email.
                No spam, unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}