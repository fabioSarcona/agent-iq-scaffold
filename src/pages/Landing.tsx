import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import { Stethoscope, Wrench } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

export default function Landing() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Transform Your Business with 
            <span className="bg-brand-gradient bg-clip-text text-transparent ml-2">
              AI-Powered Insights
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('audit.description')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-brand-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="h-8 w-8 text-white" />
              </div>
              <CardTitle>{t('audit.dental')}</CardTitle>
              <CardDescription>
                Comprehensive audit for dental offices, clinics, and practices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-brand-gradient hover:opacity-90" 
                onClick={() => navigate('/audit/dental')}
              >
                {t('audit.startAudit')}
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-brand-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <Wrench className="h-8 w-8 text-white" />
              </div>
              <CardTitle>{t('audit.hvac')}</CardTitle>
              <CardDescription>
                Tailored insights for HVAC contractors and service providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-brand-gradient hover:opacity-90"
                onClick={() => navigate('/audit/hvac')}
              >
                {t('audit.startAudit')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}