'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  Download, 
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Share,
  Eye,
  Filter,
  Search,
  Mail,
  Printer,
  FileSpreadsheet,
  FilePdf,
  FileJson,
  Settings,
  Users,
  CheckCircle,
  AlertTriangle,
  Info,
  BarChart3,
  TrendingUp,
  DollarSign,
  Target
} from 'lucide-react'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { UserRole } from '@/types'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { toast } from 'react-hot-toast'

// Mock reports data
const mockReports = [
  {
    id: '1',
    name: 'Monthly Sales Report',
    type: 'sales',
    format: 'pdf',
    status: 'completed',
    generated_at: '2024-01-20T10:30:00Z',
    generated_by: 'John Manager',
    file_size: 2048576, // 2MB
    download_count: 15,
    expires_at: '2024-02-20T10:30:00Z',
    is_scheduled: true,
    schedule: 'Monthly on 1st'
  },
  {
    id: '2',
    name: 'Lead Analytics Dashboard',
    type: 'leads',
    format: 'excel',
    status: 'completed',
    generated_at: '2024-01-19T15:45:00Z',
    generated_by: 'Sarah Analyst',
    file_size: 1536000, // 1.5MB
    download_count: 8,
    expires_at: '2024-02-19T15:45:00Z',
    is_scheduled: false
  },
  {
    id: '3',
    name: 'Property Performance Report',
    type: 'properties',
    format: 'pdf',
    status: 'generating',
    generated_at: '2024-01-20T16:00:00Z',
    generated_by: 'Mike Director',
    file_size: 0,
    download_count: 0,
    expires_at: null,
    is_scheduled: false
  },
  {
    id: '4',
    name: 'Financial Summary Q1',
    type: 'financial',
    format: 'excel',
    status: 'failed',
    generated_at: '2024-01-20T14:20:00Z',
    generated_by: 'Lisa CFO',
    file_size: 0,
    download_count: 0,
    expires_at: null,
    is_scheduled: false
  }
]

const mockTemplates = [
  {
    id: '1',
    name: 'Executive Summary',
    type: 'dashboard',
    description: 'High-level overview for executives',
    category: 'Management',
    is_public: true,
    created_by: 'System',
    usage_count: 45
  },
  {
    id: '2',
    name: 'Sales Performance',
    type: 'sales',
    description: 'Detailed sales analytics and trends',
    category: 'Sales',
    is_public: true,
    created_by: 'John Manager',
    usage_count: 32
  },
  {
    id: '3',
    name: 'Lead Conversion Analysis',
    type: 'leads',
    description: 'Lead funnel and conversion metrics',
    category: 'Marketing',
    is_public: false,
    created_by: 'Sarah Analyst',
    usage_count: 18
  }
]

const mockSchedules = [
  {
    id: '1',
    name: 'Daily Sales Summary',
    template_name: 'Sales Performance',
    cron_schedule: '0 9 * * *',
    format: 'pdf',
    recipients: ['manager@company.com', 'sales@company.com'],
    is_active: true,
    last_run: '2024-01-20T09:00:00Z',
    next_run: '2024-01-21T09:00:00Z'
  },
  {
    id: '2',
    name: 'Weekly Executive Report',
    template_name: 'Executive Summary',
    cron_schedule: '0 8 * * 1',
    format: 'pdf',
    recipients: ['ceo@company.com', 'board@company.com'],
    is_active: true,
    last_run: '2024-01-15T08:00:00Z',
    next_run: '2024-01-22T08:00:00Z'
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800'
    case 'generating': return 'bg-blue-100 text-blue-800'
    case 'failed': return 'bg-red-100 text-red-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'generating': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
    case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />
    case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
    default: return <Info className="h-4 w-4 text-gray-500" />
  }
}

const getFormatIcon = (format: string) => {
  switch (format) {
    case 'pdf': return <FilePdf className="h-4 w-4 text-red-500" />
    case 'excel': return <FileSpreadsheet className="h-4 w-4 text-green-500" />
    case 'csv': return <FileText className="h-4 w-4 text-blue-500" />
    case 'json': return <FileJson className="h-4 w-4 text-purple-500" />
    default: return <FileText className="h-4 w-4 text-gray-500" />
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

export default function AnalyticsReportsPage() {
  const { user } = useEnhancedAuth()
  const [selectedTab, setSelectedTab] = useState('reports')
  const [reports, setReports] = useState(mockReports)
  const [templates, setTemplates] = useState(mockTemplates)
  const [schedules, setSchedules] = useState(mockSchedules)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const handleGenerateReport = () => {
    const newReport = {
      id: Date.now().toString(),
      name: 'Custom Report',
      type: 'custom',
      format: 'pdf',
      status: 'generating',
      generated_at: new Date().toISOString(),
      generated_by: user?.name || 'Current User',
      file_size: 0,
      download_count: 0,
      expires_at: null,
      is_scheduled: false
    }

    setReports([newReport, ...reports])
    toast.success('Report generation started!')

    // Simulate completion
    setTimeout(() => {
      setReports(prev => prev.map(report => 
        report.id === newReport.id 
          ? { ...report, status: 'completed', file_size: 1024000 }
          : report
      ))
      toast.success('Report generated successfully!')
    }, 3000)
  }

  const handleDownloadReport = (reportId: string) => {
    const report = reports.find(r => r.id === reportId)
    if (!report) return

    // Update download count
    setReports(reports.map(r => 
      r.id === reportId 
        ? { ...r, download_count: r.download_count + 1 }
        : r
    ))

    toast.success(`Downloading ${report.name}`)
  }

  const handleDeleteReport = (reportId: string) => {
    setReports(reports.filter(r => r.id !== reportId))
    toast.success('Report deleted successfully!')
  }

  const handleToggleSchedule = (scheduleId: string) => {
    setSchedules(schedules.map(schedule => 
      schedule.id === scheduleId 
        ? { ...schedule, is_active: !schedule.is_active }
        : schedule
    ))
    toast.success('Schedule updated!')
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || report.type === filterType
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <ProtectedRoute requiredRole={UserRole.MANAGER}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-8 w-8 text-blue-600" />
              Analytics Reports
            </h1>
            <p className="text-gray-600">Generate, manage, and schedule analytics reports</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button onClick={handleGenerateReport}>
              <Plus className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reports</p>
                  <p className="text-2xl font-bold">{reports.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Schedules</p>
                  <p className="text-2xl font-bold">{schedules.filter(s => s.is_active).length}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Downloads</p>
                  <p className="text-2xl font-bold">{reports.reduce((sum, r) => sum + r.download_count, 0)}</p>
                </div>
                <Download className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Templates</p>
                  <p className="text-2xl font-bold">{templates.length}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="schedules">Schedules</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search reports..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="leads">Leads</SelectItem>
                      <SelectItem value="properties">Properties</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="dashboard">Dashboard</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="generating">Generating</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Reports List */}
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getFormatIcon(report.format)}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{report.name}</h3>
                            <Badge className={getStatusColor(report.status)}>
                              {report.status}
                            </Badge>
                            {report.is_scheduled && (
                              <Badge variant="outline">
                                <Calendar className="h-3 w-3 mr-1" />
                                Scheduled
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Generated by {report.generated_by} • {formatDateTime(report.generated_at)}
                            {report.file_size > 0 && ` • ${formatFileSize(report.file_size)}`}
                            {report.download_count > 0 && ` • ${report.download_count} downloads`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {report.status === 'completed' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownloadReport(report.id)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Share className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {report.status === 'generating' && (
                          <div className="flex items-center gap-2">
                            <Progress value={65} className="w-20 h-2" />
                            <span className="text-sm text-gray-500">65%</span>
                          </div>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteReport(report.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredReports.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                        ? 'Try adjusting your filters or search terms.'
                        : 'Generate your first report to get started.'
                      }
                    </p>
                    <Button onClick={handleGenerateReport}>
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant={template.is_public ? "default" : "secondary"}>
                        {template.is_public ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Category:</span>
                        <span className="font-medium">{template.category}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Created by:</span>
                        <span className="font-medium">{template.created_by}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Usage:</span>
                        <span className="font-medium">{template.usage_count} times</span>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button className="flex-1" size="sm">
                          Use Template
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Create New Template Card */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-6 h-full">
                  <Plus className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">Create Template</h3>
                  <p className="text-sm text-gray-500 text-center mb-4">
                    Build a custom report template
                  </p>
                  <Button>Create Template</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedules" className="space-y-4">
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Calendar className="h-8 w-8 text-blue-500" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{schedule.name}</h3>
                            <Badge variant={schedule.is_active ? "default" : "secondary"}>
                              {schedule.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Template: {schedule.template_name} • Format: {schedule.format.toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-500">
                            Recipients: {schedule.recipients.length} • Schedule: {schedule.cron_schedule}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <div>Last run: {formatDateTime(schedule.last_run)}</div>
                          <div className="text-gray-500">Next run: {formatDateTime(schedule.next_run)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleToggleSchedule(schedule.id)}
                          >
                            {schedule.is_active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {schedules.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled reports</h3>
                    <p className="text-gray-500 mb-4">Set up automated report generation and delivery.</p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Schedule
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Report Usage Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Usage</CardTitle>
                  <CardDescription>Most popular reports and templates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {templates.map((template, index) => (
                      <div key={template.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-gray-500">{template.category}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{template.usage_count}</div>
                          <div className="text-sm text-gray-500">uses</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Generation Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Generation Statistics</CardTitle>
                  <CardDescription>Report generation metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Success Rate</span>
                      <div className="flex items-center gap-2">
                        <Progress value={92} className="w-20 h-2" />
                        <span className="font-medium">92%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Avg Generation Time</span>
                      <span className="font-medium">2.3 minutes</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Total File Size</span>
                      <span className="font-medium">
                        {formatFileSize(reports.reduce((sum, r) => sum + r.file_size, 0))}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Most Popular Format</span>
                      <span className="font-medium">PDF (65%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Reports are automatically deleted after 30 days. Download important reports for long-term storage.
          </AlertDescription>
        </Alert>
      </div>
    </ProtectedRoute>
  )
}
