'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  Plus,
  Eye,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  FileImage,
  Settings
} from 'lucide-react'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { UserRole } from '@/types'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { toast } from 'react-hot-toast'

// Report types
const reportTypes = [
  { value: 'sales', label: 'Sales Report', description: 'Comprehensive sales performance analysis' },
  { value: 'leads', label: 'Lead Report', description: 'Lead generation and conversion metrics' },
  { value: 'properties', label: 'Property Report', description: 'Inventory and property performance' },
  { value: 'financial', label: 'Financial Report', description: 'Revenue, expenses, and profit analysis' },
  { value: 'user_performance', label: 'User Performance', description: 'Individual and team performance metrics' },
  { value: 'commission', label: 'Commission Report', description: 'Sales commission calculations' },
  { value: 'client', label: 'Client Report', description: 'Client relationship and activity analysis' },
  { value: 'task', label: 'Task Report', description: 'Task completion and productivity metrics' }
]

// Export formats
const exportFormats = [
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'excel', label: 'Excel', icon: FileSpreadsheet },
  { value: 'csv', label: 'CSV', icon: FileText }
]

// Mock saved reports
const mockSavedReports = [
  {
    id: '1',
    name: 'Monthly Sales Summary',
    type: 'sales',
    format: 'pdf',
    status: 'completed',
    createdAt: '2024-01-15T10:30:00Z',
    generatedAt: '2024-01-15T10:35:00Z',
    fileSize: '2.4 MB',
    downloadCount: 12
  },
  {
    id: '2',
    name: 'Lead Conversion Analysis',
    type: 'leads',
    format: 'excel',
    status: 'completed',
    createdAt: '2024-01-14T14:20:00Z',
    generatedAt: '2024-01-14T14:22:00Z',
    fileSize: '1.8 MB',
    downloadCount: 8
  },
  {
    id: '3',
    name: 'Q1 Financial Report',
    type: 'financial',
    format: 'pdf',
    status: 'generating',
    createdAt: '2024-01-16T09:15:00Z',
    generatedAt: null,
    fileSize: null,
    downloadCount: 0
  },
  {
    id: '4',
    name: 'Property Inventory Report',
    type: 'properties',
    format: 'csv',
    status: 'failed',
    createdAt: '2024-01-13T16:45:00Z',
    generatedAt: null,
    fileSize: null,
    downloadCount: 0
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800'
    case 'generating': return 'bg-yellow-100 text-yellow-800'
    case 'failed': return 'bg-red-100 text-red-800'
    case 'pending': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return CheckCircle
    case 'generating': return Clock
    case 'failed': return AlertCircle
    default: return Clock
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function ReportsPage() {
  const { user, canViewAnalytics } = useEnhancedAuth()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedReportType, setSelectedReportType] = useState('')
  const [selectedFormat, setSelectedFormat] = useState('pdf')
  const [reportTitle, setReportTitle] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [includeCharts, setIncludeCharts] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [savedReports, setSavedReports] = useState(mockSavedReports)

  const handleGenerateReport = async () => {
    if (!selectedReportType) {
      toast.error('Please select a report type')
      return
    }

    setIsGenerating(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newReport = {
        id: Date.now().toString(),
        name: reportTitle || `${reportTypes.find(t => t.value === selectedReportType)?.label} - ${new Date().toLocaleDateString()}`,
        type: selectedReportType,
        format: selectedFormat,
        status: 'completed',
        createdAt: new Date().toISOString(),
        generatedAt: new Date().toISOString(),
        fileSize: '1.2 MB',
        downloadCount: 0
      }
      
      setSavedReports([newReport, ...savedReports])
      setIsCreateDialogOpen(false)
      toast.success('Report generated successfully!')
      
      // Reset form
      setSelectedReportType('')
      setReportTitle('')
      setReportDescription('')
      setDateFrom('')
      setDateTo('')
      setIncludeCharts(true)
      
    } catch (error) {
      toast.error('Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadReport = (reportId: string) => {
    const report = savedReports.find(r => r.id === reportId)
    if (report && report.status === 'completed') {
      // Simulate download
      toast.success(`Downloading ${report.name}...`)
      
      // Update download count
      setSavedReports(savedReports.map(r => 
        r.id === reportId ? { ...r, downloadCount: r.downloadCount + 1 } : r
      ))
    }
  }

  const handleDeleteReport = (reportId: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      setSavedReports(savedReports.filter(r => r.id !== reportId))
      toast.success('Report deleted successfully')
    }
  }

  const handleRetryReport = (reportId: string) => {
    setSavedReports(savedReports.map(r => 
      r.id === reportId ? { ...r, status: 'generating' } : r
    ))
    
    // Simulate retry
    setTimeout(() => {
      setSavedReports(prev => prev.map(r => 
        r.id === reportId ? { 
          ...r, 
          status: 'completed', 
          generatedAt: new Date().toISOString(),
          fileSize: '1.5 MB'
        } : r
      ))
      toast.success('Report generated successfully!')
    }, 3000)
  }

  return (
    <ProtectedRoute requiredRole={UserRole.MANAGER}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Generate and manage custom business reports</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generate New Report</DialogTitle>
                <DialogDescription>
                  Create a custom report with your preferred settings and filters
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Report Type */}
                <div className="space-y-2">
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-gray-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Report Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reportTitle">Report Title (Optional)</Label>
                    <Input
                      id="reportTitle"
                      placeholder="Custom report title"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="format">Export Format</Label>
                    <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {exportFormats.map(format => (
                          <SelectItem key={format.value} value={format.value}>
                            <div className="flex items-center gap-2">
                              <format.icon className="h-4 w-4" />
                              {format.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateFrom">From Date</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateTo">To Date</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Report description or notes"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <Label>Report Options</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeCharts"
                      checked={includeCharts}
                      onCheckedChange={setIncludeCharts}
                    />
                    <Label htmlFor="includeCharts" className="text-sm">
                      Include charts and visualizations
                    </Label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleGenerateReport} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.slice(0, 4).map((type) => (
            <Card key={type.value} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{type.label}</CardTitle>
                <CardDescription className="text-sm">{type.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setSelectedReportType(type.value)
                    setIsCreateDialogOpen(true)
                  }}
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Generate
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Saved Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Saved Reports
            </CardTitle>
            <CardDescription>
              View and manage your generated reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savedReports.map((report) => {
                const StatusIcon = getStatusIcon(report.status)
                const reportType = reportTypes.find(t => t.value === report.type)
                const format = exportFormats.find(f => f.value === report.format)
                
                return (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" />
                        {format && <format.icon className="h-4 w-4 text-gray-500" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{report.name}</h4>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span>{reportType?.label}</span>
                          <span>Created: {formatDate(report.createdAt)}</span>
                          {report.fileSize && <span>{report.fileSize}</span>}
                          {report.downloadCount > 0 && <span>{report.downloadCount} downloads</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {report.status === 'completed' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDownloadReport(report.id)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      
                      {report.status === 'failed' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRetryReport(report.id)}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
              
              {savedReports.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No reports generated yet.</p>
                  <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate your first report
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
