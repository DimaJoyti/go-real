'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, 
  Bell, 
  Database, 
  Shield, 
  Zap,
  Clock,
  Mail,
  Webhook,
  Slack,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Plus,
  Trash2,
  Edit
} from 'lucide-react'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { UserRole } from '@/types'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { toast } from 'react-hot-toast'

// Mock configuration data
const mockConfig = {
  general: {
    refresh_interval: 300, // 5 minutes
    data_retention_days: 365,
    enable_real_time: true,
    enable_predictions: true,
    enable_alerts: true,
    default_dashboard: 'overview',
    max_export_rows: 10000,
  },
  cache: {
    enable_caching: true,
    cache_ttl: 1800, // 30 minutes
    max_cache_size: 1073741824, // 1GB
    cache_strategy: 'lru',
    warmup_on_startup: true,
    cache_compression: true,
  },
  security: {
    require_ssl: true,
    allowed_ips: ['192.168.1.0/24', '10.0.0.0/8'],
    rate_limit_per_minute: 60,
    enable_audit_logging: true,
    data_masking_enabled: true,
    encryption_enabled: true,
    session_timeout: 480, // 8 hours
  },
  integrations: {
    google_analytics: {
      enabled: false,
      tracking_id: '',
      sync_interval: 24,
    },
    slack: {
      enabled: true,
      webhook_url: 'https://hooks.slack.com/services/...',
      channel: '#analytics-alerts',
      username: 'Analytics Bot',
    },
    email: {
      enabled: true,
      smtp_host: 'smtp.company.com',
      smtp_port: 587,
      from_email: 'analytics@company.com',
      from_name: 'Analytics System',
    },
  },
}

const mockAlerts = [
  {
    id: '1',
    name: 'High Sales Volume',
    metric_name: 'daily_sales',
    condition: 'greater_than',
    threshold: 50,
    frequency: 'daily',
    is_active: true,
    recipients: [
      { type: 'email', address: 'manager@company.com' },
      { type: 'slack', address: '#sales-team' },
    ],
  },
  {
    id: '2',
    name: 'Low Lead Conversion',
    metric_name: 'conversion_rate',
    condition: 'less_than',
    threshold: 0.15,
    frequency: 'weekly',
    is_active: true,
    recipients: [
      { type: 'email', address: 'sales@company.com' },
    ],
  },
]

export default function AnalyticsSettingsPage() {
  const { user } = useEnhancedAuth()
  const [selectedTab, setSelectedTab] = useState('general')
  const [config, setConfig] = useState(mockConfig)
  const [alerts, setAlerts] = useState(mockAlerts)
  const [isSaving, setIsSaving] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)

  const handleConfigChange = (section: string, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value,
      },
    }))
  }

  const handleSaveConfig = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSaving(false)
    toast.success('Configuration saved successfully!')
  }

  const handleTestConnection = async (service: string) => {
    setIsTestingConnection(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsTestingConnection(false)
    toast.success(`${service} connection test successful!`)
  }

  const handleCreateAlert = () => {
    const newAlert = {
      id: Date.now().toString(),
      name: 'New Alert',
      metric_name: 'sales_count',
      condition: 'greater_than',
      threshold: 0,
      frequency: 'daily',
      is_active: false,
      recipients: [],
    }
    setAlerts([...alerts, newAlert])
  }

  const handleDeleteAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId))
    toast.success('Alert deleted successfully!')
  }

  const handleToggleAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, is_active: !alert.is_active }
        : alert
    ))
  }

  return (
    <ProtectedRoute requiredRole={UserRole.ADMIN}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="h-8 w-8 text-blue-600" />
              Analytics Settings
            </h1>
            <p className="text-gray-600">Configure analytics system settings and alerts</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSaveConfig} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>Basic analytics system configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="refresh_interval">Refresh Interval (seconds)</Label>
                    <Input
                      id="refresh_interval"
                      type="number"
                      value={config.general.refresh_interval}
                      onChange={(e) => handleConfigChange('general', 'refresh_interval', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-gray-500">How often to refresh analytics data</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_retention">Data Retention (days)</Label>
                    <Input
                      id="data_retention"
                      type="number"
                      value={config.general.data_retention_days}
                      onChange={(e) => handleConfigChange('general', 'data_retention_days', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-gray-500">How long to keep analytics data</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default_dashboard">Default Dashboard</Label>
                    <Select 
                      value={config.general.default_dashboard}
                      onValueChange={(value) => handleConfigChange('general', 'default_dashboard', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overview">Overview</SelectItem>
                        <SelectItem value="sales">Sales Analytics</SelectItem>
                        <SelectItem value="leads">Lead Analytics</SelectItem>
                        <SelectItem value="properties">Property Analytics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_export_rows">Max Export Rows</Label>
                    <Input
                      id="max_export_rows"
                      type="number"
                      value={config.general.max_export_rows}
                      onChange={(e) => handleConfigChange('general', 'max_export_rows', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-gray-500">Maximum rows for data export</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Feature Toggles</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enable_real_time">Real-time Updates</Label>
                      <p className="text-sm text-gray-500">Enable live data updates</p>
                    </div>
                    <Switch
                      id="enable_real_time"
                      checked={config.general.enable_real_time}
                      onCheckedChange={(checked) => handleConfigChange('general', 'enable_real_time', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enable_predictions">AI Predictions</Label>
                      <p className="text-sm text-gray-500">Enable machine learning predictions</p>
                    </div>
                    <Switch
                      id="enable_predictions"
                      checked={config.general.enable_predictions}
                      onCheckedChange={(checked) => handleConfigChange('general', 'enable_predictions', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enable_alerts">Analytics Alerts</Label>
                      <p className="text-sm text-gray-500">Enable automated alerts and notifications</p>
                    </div>
                    <Switch
                      id="enable_alerts"
                      checked={config.general.enable_alerts}
                      onCheckedChange={(checked) => handleConfigChange('general', 'enable_alerts', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Performance & Caching
                </CardTitle>
                <CardDescription>Optimize analytics performance and caching</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable_caching">Enable Caching</Label>
                    <p className="text-sm text-gray-500">Cache analytics data for better performance</p>
                  </div>
                  <Switch
                    id="enable_caching"
                    checked={config.cache.enable_caching}
                    onCheckedChange={(checked) => handleConfigChange('cache', 'enable_caching', checked)}
                  />
                </div>

                {config.cache.enable_caching && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="cache_ttl">Cache TTL (seconds)</Label>
                      <Input
                        id="cache_ttl"
                        type="number"
                        value={config.cache.cache_ttl}
                        onChange={(e) => handleConfigChange('cache', 'cache_ttl', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cache_strategy">Cache Strategy</Label>
                      <Select 
                        value={config.cache.cache_strategy}
                        onValueChange={(value) => handleConfigChange('cache', 'cache_strategy', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lru">LRU (Least Recently Used)</SelectItem>
                          <SelectItem value="lfu">LFU (Least Frequently Used)</SelectItem>
                          <SelectItem value="ttl">TTL (Time To Live)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max_cache_size">Max Cache Size (bytes)</Label>
                      <Input
                        id="max_cache_size"
                        type="number"
                        value={config.cache.max_cache_size}
                        onChange={(e) => handleConfigChange('cache', 'max_cache_size', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="warmup_on_startup">Warmup on Startup</Label>
                      <p className="text-sm text-gray-500">Pre-load cache on system startup</p>
                    </div>
                    <Switch
                      id="warmup_on_startup"
                      checked={config.cache.warmup_on_startup}
                      onCheckedChange={(checked) => handleConfigChange('cache', 'warmup_on_startup', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="cache_compression">Cache Compression</Label>
                      <p className="text-sm text-gray-500">Compress cached data to save memory</p>
                    </div>
                    <Switch
                      id="cache_compression"
                      checked={config.cache.cache_compression}
                      onCheckedChange={(checked) => handleConfigChange('cache', 'cache_compression', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Configure security and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="require_ssl">Require SSL</Label>
                      <p className="text-sm text-gray-500">Force HTTPS for all analytics requests</p>
                    </div>
                    <Switch
                      id="require_ssl"
                      checked={config.security.require_ssl}
                      onCheckedChange={(checked) => handleConfigChange('security', 'require_ssl', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enable_audit_logging">Audit Logging</Label>
                      <p className="text-sm text-gray-500">Log all analytics access and operations</p>
                    </div>
                    <Switch
                      id="enable_audit_logging"
                      checked={config.security.enable_audit_logging}
                      onCheckedChange={(checked) => handleConfigChange('security', 'enable_audit_logging', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="data_masking_enabled">Data Masking</Label>
                      <p className="text-sm text-gray-500">Mask sensitive data based on user roles</p>
                    </div>
                    <Switch
                      id="data_masking_enabled"
                      checked={config.security.data_masking_enabled}
                      onCheckedChange={(checked) => handleConfigChange('security', 'data_masking_enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="encryption_enabled">Data Encryption</Label>
                      <p className="text-sm text-gray-500">Encrypt analytics data at rest</p>
                    </div>
                    <Switch
                      id="encryption_enabled"
                      checked={config.security.encryption_enabled}
                      onCheckedChange={(checked) => handleConfigChange('security', 'encryption_enabled', checked)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="rate_limit">Rate Limit (per minute)</Label>
                    <Input
                      id="rate_limit"
                      type="number"
                      value={config.security.rate_limit_per_minute}
                      onChange={(e) => handleConfigChange('security', 'rate_limit_per_minute', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                    <Input
                      id="session_timeout"
                      type="number"
                      value={config.security.session_timeout}
                      onChange={(e) => handleConfigChange('security', 'session_timeout', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allowed_ips">Allowed IP Ranges</Label>
                  <Textarea
                    id="allowed_ips"
                    placeholder="192.168.1.0/24&#10;10.0.0.0/8"
                    value={config.security.allowed_ips.join('\n')}
                    onChange={(e) => handleConfigChange('security', 'allowed_ips', e.target.value.split('\n').filter(ip => ip.trim()))}
                    rows={3}
                  />
                  <p className="text-sm text-gray-500">One IP range per line (CIDR notation)</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Slack Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Slack className="h-5 w-5" />
                    Slack Integration
                  </CardTitle>
                  <CardDescription>Send alerts and notifications to Slack</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="slack_enabled">Enable Slack</Label>
                    <Switch
                      id="slack_enabled"
                      checked={config.integrations.slack.enabled}
                      onCheckedChange={(checked) => handleConfigChange('integrations', 'slack', { ...config.integrations.slack, enabled: checked })}
                    />
                  </div>

                  {config.integrations.slack.enabled && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="slack_webhook">Webhook URL</Label>
                        <Input
                          id="slack_webhook"
                          type="url"
                          value={config.integrations.slack.webhook_url}
                          onChange={(e) => handleConfigChange('integrations', 'slack', { ...config.integrations.slack, webhook_url: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="slack_channel">Default Channel</Label>
                        <Input
                          id="slack_channel"
                          value={config.integrations.slack.channel}
                          onChange={(e) => handleConfigChange('integrations', 'slack', { ...config.integrations.slack, channel: e.target.value })}
                        />
                      </div>

                      <Button 
                        variant="outline" 
                        onClick={() => handleTestConnection('Slack')}
                        disabled={isTestingConnection}
                      >
                        {isTestingConnection ? 'Testing...' : 'Test Connection'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Email Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Integration
                  </CardTitle>
                  <CardDescription>Send email notifications and reports</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email_enabled">Enable Email</Label>
                    <Switch
                      id="email_enabled"
                      checked={config.integrations.email.enabled}
                      onCheckedChange={(checked) => handleConfigChange('integrations', 'email', { ...config.integrations.email, enabled: checked })}
                    />
                  </div>

                  {config.integrations.email.enabled && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="smtp_host">SMTP Host</Label>
                          <Input
                            id="smtp_host"
                            value={config.integrations.email.smtp_host}
                            onChange={(e) => handleConfigChange('integrations', 'email', { ...config.integrations.email, smtp_host: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="smtp_port">SMTP Port</Label>
                          <Input
                            id="smtp_port"
                            type="number"
                            value={config.integrations.email.smtp_port}
                            onChange={(e) => handleConfigChange('integrations', 'email', { ...config.integrations.email, smtp_port: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="from_email">From Email</Label>
                        <Input
                          id="from_email"
                          type="email"
                          value={config.integrations.email.from_email}
                          onChange={(e) => handleConfigChange('integrations', 'email', { ...config.integrations.email, from_email: e.target.value })}
                        />
                      </div>

                      <Button 
                        variant="outline" 
                        onClick={() => handleTestConnection('Email')}
                        disabled={isTestingConnection}
                      >
                        {isTestingConnection ? 'Testing...' : 'Test Connection'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Analytics Alerts
                    </CardTitle>
                    <CardDescription>Configure automated alerts and notifications</CardDescription>
                  </div>
                  <Button onClick={handleCreateAlert}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Alert
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={alert.is_active}
                            onCheckedChange={() => handleToggleAlert(alert.id)}
                          />
                          <div>
                            <h4 className="font-medium">{alert.name}</h4>
                            <p className="text-sm text-gray-500">
                              {alert.metric_name} {alert.condition} {alert.threshold}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={alert.is_active ? "default" : "secondary"}>
                            {alert.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteAlert(alert.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Frequency: {alert.frequency}</span>
                        <span>Recipients: {alert.recipients.length}</span>
                      </div>
                    </div>
                  ))}

                  {alerts.length === 0 && (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No alerts configured yet.</p>
                      <Button className="mt-4" onClick={handleCreateAlert}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create your first alert
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Status Information */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Changes to analytics settings may take a few minutes to take effect. 
            Some settings require a system restart to apply.
          </AlertDescription>
        </Alert>
      </div>
    </ProtectedRoute>
  )
}
