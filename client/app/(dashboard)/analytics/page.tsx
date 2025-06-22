'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { UserRole } from '@/types'
import {
    Activity,
    BarChart3,
    Building,
    DollarSign,
    Download,
    FileText,
    Filter,
    LineChart,
    PieChart,
    Target,
    TrendingUp,
    Users
} from 'lucide-react'
import { useState } from 'react'

// Mock data - would be replaced with API calls
const mockDashboardStats = {
  totalLeads: 1247,
  totalClients: 589,
  totalSales: 234,
  totalRevenue: 12450000,
  newLeadsToday: 23,
  salesToday: 5,
  revenueToday: 450000,
  leadConversionRate: 28.5,
  averageSaleValue: 532000,
  monthlyGrowth: 12.3,
  revenueGrowth: 8.7,
  leadGrowth: 15.2,
  clientGrowth: 6.8
}

const mockSalesAnalytics = {
  totalSales: 234,
  totalRevenue: 12450000,
  averageSaleValue: 532000,
  pendingSales: 45,
  approvedSales: 189,
  completedSales: 167,
  cancelledSales: 22,
  monthlyRevenue: [
    { month: 'Jan', revenue: 980000, sales: 18 },
    { month: 'Feb', revenue: 1120000, sales: 21 },
    { month: 'Mar', revenue: 1350000, sales: 25 },
    { month: 'Apr', revenue: 1180000, sales: 22 },
    { month: 'May', revenue: 1420000, sales: 27 },
    { month: 'Jun', revenue: 1650000, sales: 31 }
  ],
  salesByEmployee: [
    { name: 'Sarah Johnson', sales: 45, revenue: 2400000, rank: 1 },
    { name: 'Mike Wilson', sales: 38, revenue: 2020000, rank: 2 },
    { name: 'Emily Davis', sales: 32, revenue: 1700000, rank: 3 },
    { name: 'John Smith', sales: 28, revenue: 1490000, rank: 4 },
    { name: 'Lisa Brown', sales: 25, revenue: 1330000, rank: 5 }
  ]
}

const mockLeadAnalytics = {
  totalLeads: 1247,
  newLeads: 156,
  qualifiedLeads: 423,
  convertedLeads: 234,
  lostLeads: 89,
  conversionRate: 18.8,
  averageLeadScore: 72,
  leadsBySource: [
    { source: 'Website', count: 456, percentage: 36.6, conversion: 22.1 },
    { source: 'Referral', count: 312, percentage: 25.0, conversion: 28.5 },
    { source: 'Social Media', count: 234, percentage: 18.8, conversion: 15.4 },
    { source: 'Advertisement', count: 156, percentage: 12.5, conversion: 19.2 },
    { source: 'Phone', count: 89, percentage: 7.1, conversion: 31.5 }
  ],
  leadsByStatus: [
    { status: 'New', count: 156, percentage: 12.5 },
    { status: 'Contacted', count: 234, percentage: 18.8 },
    { status: 'Qualified', count: 423, percentage: 33.9 },
    { status: 'Proposal', count: 189, percentage: 15.2 },
    { status: 'Negotiation', count: 112, percentage: 9.0 },
    { status: 'Converted', count: 234, percentage: 18.8 },
    { status: 'Lost', count: 89, percentage: 7.1 }
  ]
}

const mockPropertyAnalytics = {
  totalProperties: 1456,
  availableUnits: 892,
  soldUnits: 456,
  reservedUnits: 108,
  totalInventoryValue: 45600000,
  averagePropertyValue: 512000,
  propertiesByType: [
    { type: '1 BHK', count: 234, percentage: 16.1, avgPrice: 320000 },
    { type: '2 BHK', count: 456, percentage: 31.3, avgPrice: 480000 },
    { type: '3 BHK', count: 523, percentage: 35.9, avgPrice: 650000 },
    { type: '4 BHK', count: 189, percentage: 13.0, avgPrice: 850000 },
    { type: 'Penthouse', count: 54, percentage: 3.7, avgPrice: 1200000 }
  ],
  salesByLocation: [
    { location: 'Downtown', sales: 89, value: 4560000 },
    { location: 'Suburbs', sales: 67, value: 3420000 },
    { location: 'Waterfront', sales: 45, value: 5400000 },
    { location: 'Business District', sales: 33, value: 4200000 }
  ]
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'new': return 'bg-blue-100 text-blue-800'
    case 'contacted': return 'bg-yellow-100 text-yellow-800'
    case 'qualified': return 'bg-green-100 text-green-800'
    case 'proposal': return 'bg-purple-100 text-purple-800'
    case 'negotiation': return 'bg-orange-100 text-orange-800'
    case 'converted': return 'bg-emerald-100 text-emerald-800'
    case 'lost': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`
}

export default function AnalyticsPage() {
  const { user, canViewAnalytics } = useEnhancedAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedTab, setSelectedTab] = useState('overview')

  // Use the comprehensive analytics dashboard component
  const { filters, updateFilter } = useCRMAnalyticsFilters()
  const { generateReport, isGenerating } = useCRMReportGeneration()
  const { exportData, isExporting } = useCRMDataExport()

  const handleExportAnalytics = () => {
    exportData({
      entityType: 'analytics',
      format: 'excel',
      filters: filters,
      includeRelated: true
    })
  }

  const handleGenerateReport = () => {
    generateReport({
      reportType: 'comprehensive',
      format: 'pdf',
      title: 'Comprehensive Analytics Report',
      includeCharts: true,
      filters: filters
    })
  }

  return (
    <ProtectedRoute requiredRole={UserRole.MANAGER}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-600">Comprehensive business intelligence and insights</p>
          </div>
          <div className="flex gap-3">
            <Select value={filters.period} onValueChange={(value) => updateFilter('period', value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button onClick={handleExportAnalytics} disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
            <Button onClick={handleGenerateReport} disabled={isGenerating}>
              <FileText className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Report'}
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(mockDashboardStats.totalRevenue)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +{formatPercentage(mockDashboardStats.revenueGrowth)} from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockDashboardStats.totalSales}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +{formatPercentage(mockDashboardStats.monthlyGrowth)} from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lead Conversion</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(mockDashboardStats.leadConversionRate)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +{formatPercentage(mockDashboardStats.leadGrowth)} from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Sale Value</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(mockDashboardStats.averageSaleValue)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +{formatPercentage(mockDashboardStats.clientGrowth)} from last month
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
            <TabsTrigger value="leads">Lead Analytics</TabsTrigger>
            <TabsTrigger value="properties">Property Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Revenue Trend
                  </CardTitle>
                  <CardDescription>Monthly revenue performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockSalesAnalytics.monthlyRevenue.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 text-sm font-medium">{item.month}</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(item.revenue / 2000000) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatCurrency(item.revenue)}</div>
                          <div className="text-xs text-gray-500">{item.sales} sales</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Top Performers
                  </CardTitle>
                  <CardDescription>Sales team leaderboard</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockSalesAnalytics.salesByEmployee.map((employee, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                            #{employee.rank}
                          </div>
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.sales} sales</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(employee.revenue)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sales Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Sales Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pending</span>
                      <Badge variant="outline">{mockSalesAnalytics.pendingSales}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Approved</span>
                      <Badge variant="outline">{mockSalesAnalytics.approvedSales}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completed</span>
                      <Badge variant="outline">{mockSalesAnalytics.completedSales}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Cancelled</span>
                      <Badge variant="outline">{mockSalesAnalytics.cancelledSales}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sales Metrics */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Sales Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{mockSalesAnalytics.totalSales}</div>
                      <div className="text-sm text-gray-600">Total Sales</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(mockSalesAnalytics.totalRevenue)}</div>
                      <div className="text-sm text-gray-600">Total Revenue</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{formatCurrency(mockSalesAnalytics.averageSaleValue)}</div>
                      <div className="text-sm text-gray-600">Average Sale Value</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{formatPercentage(mockDashboardStats.leadConversionRate)}</div>
                      <div className="text-sm text-gray-600">Conversion Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lead Sources */}
              <Card>
                <CardHeader>
                  <CardTitle>Lead Sources</CardTitle>
                  <CardDescription>Lead generation by source</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockLeadAnalytics.leadsBySource.map((source, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{source.source}</span>
                          <div className="text-right">
                            <div className="text-sm font-medium">{source.count}</div>
                            <div className="text-xs text-gray-500">{formatPercentage(source.percentage)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${source.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-green-600">{formatPercentage(source.conversion)} conv.</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Lead Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Lead Status Distribution</CardTitle>
                  <CardDescription>Current lead pipeline</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockLeadAnalytics.leadsByStatus.map((status, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(status.status)}>
                            {status.status}
                          </Badge>
                          <span className="text-sm">{status.count} leads</span>
                        </div>
                        <span className="text-sm font-medium">{formatPercentage(status.percentage)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="properties" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Property Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Property Types
                  </CardTitle>
                  <CardDescription>Inventory by property type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockPropertyAnalytics.propertiesByType.map((type, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{type.type}</span>
                          <div className="text-right">
                            <div className="text-sm font-medium">{type.count} units</div>
                            <div className="text-xs text-gray-500">{formatCurrency(type.avgPrice)} avg</div>
                          </div>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${type.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Sales by Location */}
              <Card>
                <CardHeader>
                  <CardTitle>Sales by Location</CardTitle>
                  <CardDescription>Performance by area</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockPropertyAnalytics.salesByLocation.map((location, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{location.location}</div>
                          <div className="text-sm text-gray-500">{location.sales} sales</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(location.value)}</div>
                          <div className="text-sm text-gray-500">{formatCurrency(location.value / location.sales)} avg</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
