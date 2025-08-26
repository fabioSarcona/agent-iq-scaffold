import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Settings, Users, BarChart3 } from 'lucide-react'

export default function Admin() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Protected admin area for system management
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="text-center">
            <Shield className="h-8 w-8 mx-auto mb-2 text-brand-secondary" />
            <CardTitle className="text-lg">Access Control</CardTitle>
            <CardDescription>User permissions and authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-brand-secondary" />
            <CardTitle className="text-lg">User Management</CardTitle>
            <CardDescription>Manage audit participants</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-brand-secondary" />
            <CardTitle className="text-lg">Analytics</CardTitle>
            <CardDescription>Audit performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Settings className="h-8 w-8 mx-auto mb-2 text-brand-secondary" />
            <CardTitle className="text-lg">System Settings</CardTitle>
            <CardDescription>Configure audit parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">Coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}