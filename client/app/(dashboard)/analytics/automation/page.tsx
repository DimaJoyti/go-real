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
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Zap, 
  Clock, 
  Play,
  Pause,
  Settings,
  Plus,
  Edit,
  Trash2,
  Copy,
  Calendar,
  Mail,
  Webhook,
  FileText,
  Database,
  Brain,
  CheckCircle,
  AlertTriangle,
  Info,
  Activity,
  BarChart3,
  Users,
  Target
} from 'lucide-react'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { UserRole } from '@/types'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { toast } from 'react-hot-toast'

// Mock automation workflows
const mockWorkflows = [
  {
    id: '1',
    name: 'Daily Sales Report',
    description: 'Generate and email daily sales report to management',
    type: 'reporting',
    trigger: { type: 'schedule', schedule: '0 9 * * *' },
    is_active: true,
    last_run: '2024-01-20T09:00:00Z',
    next_run: '2024-01-21T09:00:00Z',
    run_count: 45,
    success_rate: 0.96,
    actions: [
      { type: 'generate_report', name: 'Generate Sales Report' },
      { type: 'send_notification', name: 'Email to Management' }
    ]
  },
  {
    id: '2',
    name: 'Lead Score Alert',
    description: 'Alert when high-value leads are detected',
    type: 'alerting',
    trigger: { type: 'condition', condition: 'lead_score > 80' },
    is_active: true,
    last_run: '2024-01-20T14:30:00Z',
    next_run: null,
    run_count: 23,
    success_rate: 1.0,
    actions: [
      { type: 'send_notification', name: 'Slack Alert' },
      { type: 'update_dashboard', name: 'Update Lead Dashboard' }
    ]
  },
  {
    id: '3',
    name: 'Weekly ML Model Training',
    description: 'Retrain ML models with latest data',
    type: 'ml_training',
    trigger: { type: 'schedule', schedule: '0 2 * * 0' },
    is_active: true,
    last_run: '2024-01-14T02:00:00Z',
    next_run: '2024-01-21T02:00:00Z',
    run_count: 8,
    success_rate: 0.88,
    actions: [
      { type: 'train_model', name: 'Train Sales Prediction Model' },
      { type: 'train_model', name: 'Train Lead Scoring Model' }
    ]
  }
]

const mockExecutions = [
  {
    id: '1',
    workflow_name: 'Daily Sales Report',
    status: 'completed',
    started_at: '2024-01-20T09:00:00Z',
    completed_at: '2024-01-20T09:02:30Z',
    duration: '2m 30s',
    trigger_type: 'schedule'
  },
  {
    id: '2',
    workflow_name: 'Lead Score Alert',
    status: 'completed',
    started_at: '2024-01-20T14:30:00Z',
    completed_at: '2024-01-20T14:30:15Z',
    duration: '15s',
    trigger_type: 'condition'
  },
  {
    id: '3',
    workflow_name: 'Weekly ML Model Training',
    status: 'failed',
    started_at: '2024-01-14T02:00:00Z',
    completed_at: '2024-01-14T02:45:00Z',
    duration: '45m',
    trigger_type: 'schedule'
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800'
    case 'running': return 'bg-blue-100 text-blue-800'
    case 'failed': return 'bg-red-100 text-red-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'running': return <Activity className="h-4 w-4 text-blue-500 animate-spin" />
    case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />
    case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
    default: return <Info className="h-4 w-4 text-gray-500" />
  }
}

const getWorkflowTypeIcon = (type: string) => {
  switch (type) {
    case 'reporting': return <FileText className="h-4 w-4" />
    case 'alerting': return <AlertTriangle className="h-4 w-4" />
    case 'ml_training': return <Brain className="h-4 w-4" />
    case 'data_sync': return <Database className="h-4 w-4" />
    default: return <Zap className="h-4 w-4" />
  }
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

export default function AnalyticsAutomationPage() {
  const { user } = useEnhancedAuth()
  const [selectedTab, setSelectedTab] = useState('workflows')
  const [workflows, setWorkflows] = useState(mockWorkflows)
  const [executions, setExecutions] = useState(mockExecutions)
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false)

  const handleToggleWorkflow = (workflowId: string) => {
    setWorkflows(workflows.map(workflow => 
      workflow.id === workflowId 
        ? { ...workflow, is_active: !workflow.is_active }
        : workflow
    ))
    toast.success('Workflow status updated!')
  }

  const handleRunWorkflow = async (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId)
    if (!workflow) return

    toast.success(`Running workflow: ${workflow.name}`)
    
    // Simulate workflow execution
    const newExecution = {
      id: Date.now().toString(),
      workflow_name: workflow.name,
      status: 'running',
      started_at: new Date().toISOString(),
      completed_at: null,
      duration: null,
      trigger_type: 'manual'
    }
    
    setExecutions([newExecution, ...executions])

    // Simulate completion after 3 seconds
    setTimeout(() => {
      setExecutions(prev => prev.map(exec => 
        exec.id === newExecution.id 
          ? { 
              ...exec, 
              status: 'completed', 
              completed_at: new Date().toISOString(),
              duration: '3s'
            }
          : exec
      ))
      toast.success('Workflow completed successfully!')
    }, 3000)
  }

  const handleDeleteWorkflow = (workflowId: string) => {
    setWorkflows(workflows.filter(w => w.id !== workflowId))
    toast.success('Workflow deleted successfully!')
  }

  const handleCreateWorkflow = () => {
    setIsCreatingWorkflow(true)
    // Would open workflow creation modal/form
    toast.info('Workflow creation form would open here')
  }

  return (
    <ProtectedRoute requiredRole={UserRole.MANAGER}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="h-8 w-8 text-purple-600" />
              Analytics Automation
            </h1>
            <p className="text-gray-600">Automate analytics workflows, reports, and alerts</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button onClick={handleCreateWorkflow}>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Workflows</p>
                  <p className="text-2xl font-bold">{workflows.filter(w => w.is_active).length}</p>
                </div>
                <Zap className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Executions</p>
                  <p className="text-2xl font-bold">{workflows.reduce((sum, w) => sum + w.run_count, 0)}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold">
                    {Math.round(workflows.reduce((sum, w) => sum + w.success_rate, 0) / workflows.length * 100)}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Scheduled Today</p>
                  <p className="text-2xl font-bold">
                    {workflows.filter(w => w.next_run && new Date(w.next_run).toDateString() === new Date().toDateString()).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="executions">Execution History</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="space-y-4">
            <div className="grid grid-cols-1 gap-6">
              {workflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getWorkflowTypeIcon(workflow.type)}
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {workflow.name}
                            <Badge variant={workflow.is_active ? "default" : "secondary"}>
                              {workflow.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </CardTitle>
                          <CardDescription>{workflow.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={workflow.is_active}
                          onCheckedChange={() => handleToggleWorkflow(workflow.id)}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRunWorkflow(workflow.id)}
                          disabled={!workflow.is_active}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Workflow Info */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Trigger</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            {workflow.trigger.type === 'schedule' ? (
                              <span>Schedule: {workflow.trigger.schedule}</span>
                            ) : (
                              <span>Condition: {workflow.trigger.condition}</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Actions ({workflow.actions.length})</h4>
                          <div className="space-y-1">
                            {workflow.actions.map((action, index) => (
                              <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                {action.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Statistics */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Statistics</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Total Runs:</span>
                              <span className="font-medium">{workflow.run_count}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Success Rate:</span>
                              <span className="font-medium">{Math.round(workflow.success_rate * 100)}%</span>
                            </div>
                            <div className="mt-2">
                              <Progress value={workflow.success_rate * 100} className="h-2" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Schedule</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            {workflow.last_run && (
                              <div>Last run: {formatDateTime(workflow.last_run)}</div>
                            )}
                            {workflow.next_run && (
                              <div>Next run: {formatDateTime(workflow.next_run)}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Recent Executions */}
                      <div>
                        <h4 className="font-medium mb-2">Recent Executions</h4>
                        <div className="space-y-2">
                          {executions
                            .filter(exec => exec.workflow_name === workflow.name)
                            .slice(0, 3)
                            .map((execution) => (
                              <div key={execution.id} className="flex items-center justify-between p-2 border rounded text-sm">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(execution.status)}
                                  <span>{execution.trigger_type}</span>
                                </div>
                                <div className="text-right">
                                  <div>{execution.duration || 'Running...'}</div>
                                  <div className="text-xs text-gray-500">
                                    {formatDateTime(execution.started_at)}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {workflows.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows yet</h3>
                    <p className="text-gray-500 mb-4">Create your first automation workflow to get started.</p>
                    <Button onClick={handleCreateWorkflow}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Workflow
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="executions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Execution History</CardTitle>
                <CardDescription>Recent workflow executions and their results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {executions.map((execution) => (
                    <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(execution.status)}
                        <div>
                          <div className="font-medium">{execution.workflow_name}</div>
                          <div className="text-sm text-gray-500">
                            Triggered by {execution.trigger_type} • {formatDateTime(execution.started_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={getStatusColor(execution.status)}>
                          {execution.status}
                        </Badge>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {execution.duration || 'Running...'}
                          </div>
                          {execution.completed_at && (
                            <div className="text-xs text-gray-500">
                              Completed {formatDateTime(execution.completed_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Workflow Templates */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Daily Report
                  </CardTitle>
                  <CardDescription>Generate and send daily analytics reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>• Scheduled execution</div>
                    <div>• Email notifications</div>
                    <div>• PDF report generation</div>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    Use Template
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Alert System
                  </CardTitle>
                  <CardDescription>Set up automated alerts for key metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>• Condition-based triggers</div>
                    <div>• Multi-channel notifications</div>
                    <div>• Threshold monitoring</div>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    Use Template
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    ML Training
                  </CardTitle>
                  <CardDescription>Automated machine learning model training</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>• Weekly model retraining</div>
                    <div>• Performance monitoring</div>
                    <div>• Automated deployment</div>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    Use Template
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data Sync
                  </CardTitle>
                  <CardDescription>Synchronize data between systems</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>• External API integration</div>
                    <div>• Data validation</div>
                    <div>• Error handling</div>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    Use Template
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Dashboard Update
                  </CardTitle>
                  <CardDescription>Automatically update dashboard data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>• Real-time data refresh</div>
                    <div>• Cache invalidation</div>
                    <div>• Performance optimization</div>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    Use Template
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Engagement
                  </CardTitle>
                  <CardDescription>Monitor and respond to user activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>• Activity tracking</div>
                    <div>• Engagement scoring</div>
                    <div>• Automated follow-ups</div>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Status Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Automation workflows run in the background and can be monitored in real-time. 
            Failed workflows will automatically retry based on their configuration.
          </AlertDescription>
        </Alert>
      </div>
    </ProtectedRoute>
  )
}
