import * as React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
import type { SimulatableSkill } from './types'
import { formatCurrency } from './utils'

interface ROIChartProps {
  skills: SimulatableSkill[]
}

interface ChartData {
  name: string
  roi: number
  cost: number
  recovery: number
  fullName: string
}

export function ROIChart({ skills }: ROIChartProps) {
  const activeSkills = skills.filter(skill => skill.isActive)
  
  // Only show chart if 2+ skills are active
  if (activeSkills.length < 2) {
    return null
  }
  
  // Prepare chart data
  const chartData: ChartData[] = activeSkills.map(skill => ({
    name: skill.name.length > 15 ? skill.name.substring(0, 15) + '...' : skill.name,
    roi: skill.roiIfActive,
    cost: skill.cost,
    recovery: skill.monthlyImpact * skill.recoveryRate,
    fullName: skill.name
  }))
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{data.fullName}</p>
          <div className="space-y-1 text-sm">
            <p className="text-success">
              ROI: {formatCurrency(data.roi)}
            </p>
            <p className="text-muted-foreground">
              Recovery: {formatCurrency(data.recovery)}
            </p>
            <p className="text-muted-foreground">
              Cost: {formatCurrency(data.cost)}
            </p>
          </div>
        </div>
      )
    }
    return null
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <span>ROI Comparison</span>
        </CardTitle>
        <CardDescription>
          Monthly return on investment for each active skill
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                className="fill-muted-foreground"
              />
              <YAxis 
                fontSize={12}
                className="fill-muted-foreground"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="roi" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                className="drop-shadow-sm"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Higher bars indicate better ROI potential. 
            Click on skills above to toggle them in the chart.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}