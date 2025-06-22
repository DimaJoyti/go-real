'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
    useCRMAnalyticsFilters,
    useCRMDashboardStats,
    useCRMDataExport,
    useCRMRealTimeAnalytics,
    useCRMReportGeneration
} from '@/hooks/useCRMAnalytics'
import {
    Activity,
    AlertCircle,
    BarChart3,
    Calendar,
    DollarSign,
    Download,
    FileText,
    RefreshCw,
    Target,
    TrendingDown,
    TrendingUp
} from 'lucide-react'
import { useState } from 'react'

interface AnalyticsDashboardProps {
  userId?: string
  className?: string
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

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value)
}

const getGrowthIcon = (value: number) => {
  return value >= 0 ? (
    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
  ) : (
    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
  )
}

const getGrowthColor = (value: number) => {
  return value >= 0 ? 'text-green-600' : 'text-red-600'
}

export function AnalyticsDashboard({ userId, className }: AnalyticsDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview')
  const { filters, updateFilter } = useCRMAnalyticsFilters()
  const { isRealTime, toggleRealTime } = useCRMRealTimeAnalytics(userId)
  const { generateReport, isGenerating } = useCRMReportGeneration()
  const { exportData, isExporting } = useCRMDataExport()

  // Fetch dashboard data
  const { 
    data: dashboardStats, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useCRMDashboardStats(userId)

  const handleExportDashboard = () => {
    exportData({
      entityType: 'dashboard',
      format: 'excel',
      includeRelated: true
    })
  }

  const handleGenerateReport = () => {
    generateReport({
      reportType: 'dashboard',
      format: 'pdf',
      title: 'Dashboard Analytics Report',
      includeCharts: true
    })
  }

  if (isError) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load analytics data. {error?.message}
          <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-2">
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Real-time business insights and performance metrics</p>
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
          
          <Button 
            variant={isRealTime ? "default" : "outline"} 
            size="sm"
            onClick={toggleRealTime}
          >
            <Activity className="h-4 w-4 mr-2" />
            {isRealTime ? 'Live' : 'Static'}
          </Button>
          
          <Button variant="outline" onClick={handleExportDashboard} disabled={isExporting}>
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
            {isLoading ? (
              <Skeleton className="h-8 w-32 mb-2" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardStats?.totalRevenue || 0)}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getGrowthIcon(dashboardStats?.revenueGrowth || 0)}
                  <span className={getGrowthColor(dashboardStats?.revenueGrowth || 0)}>
                    {formatPercentage(Math.abs(dashboardStats?.revenueGrowth || 0))} from last month
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(dashboardStats?.totalSales || 0)}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getGrowthIcon(dashboardStats?.monthlyGrowth || 0)}
                  <span className={getGrowthColor(dashboardStats?.monthlyGrowth || 0)}>
                    {formatPercentage(Math.abs(dashboardStats?.monthlyGrowth || 0))} from last month
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lead Conversion</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20 mb-2" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatPercentage(dashboardStats?.leadConversionRate || 0)}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getGrowthIcon(dashboardStats?.leadGrowth || 0)}
                  <span className={getGrowthColor(dashboardStats?.leadGrowth || 0)}>
                    {formatPercentage(Math.abs(dashboardStats?.leadGrowth || 0))} from last month
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Sale Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28 mb-2" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardStats?.averageSaleValue || 0)}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getGrowthIcon(dashboardStats?.clientGrowth || 0)}
                  <span className={getGrowthColor(dashboardStats?.clientGrowth || 0)}>
                    {formatPercentage(Math.abs(dashboardStats?.clientGrowth || 0))} from last month
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 border rounded-lg">
          <div className="text-lg font-semibold text-blue-600">
            {isLoading ? <Skeleton className="h-6 w-16 mx-auto" /> : formatNumber(dashboardStats?.totalLeads || 0)}
          </div>
          <div className="text-sm text-gray-600">Total Leads</div>
        </div>
        
        <div className="text-center p-4 border rounded-lg">
          <div className="text-lg font-semibold text-green-600">
            {isLoading ? <Skeleton className="h-6 w-16 mx-auto" /> : formatNumber(dashboardStats?.totalClients || 0)}
          </div>
          <div className="text-sm text-gray-600">Total Clients</div>
        </div>
        
        <div className="text-center p-4 border rounded-lg">
          <div className="text-lg font-semibold text-purple-600">
            {isLoading ? <Skeleton className="h-6 w-16 mx-auto" /> : formatNumber(dashboardStats?.totalProperties || 0)}
          </div>
          <div className="text-sm text-gray-600">Properties</div>
        </div>
        
        <div className="text-center p-4 border rounded-lg">
          <div className="text-lg font-semibold text-orange-600">
            {isLoading ? <Skeleton className="h-6 w-16 mx-auto" /> : formatNumber(dashboardStats?.totalTasks || 0)}
          </div>
          <div className="text-sm text-gray-600">Active Tasks</div>
        </div>
      </div>

      {/* Today's Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Activity
          </CardTitle>
          <CardDescription>Key metrics for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : dashboardStats?.newLeadsToday || 0}
              </div>
              <div className="text-sm text-gray-600">New Leads</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : dashboardStats?.salesToday || 0}
              </div>
              <div className="text-sm text-gray-600">Sales</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {isLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : formatCurrency(dashboardStats?.revenueToday || 0)}
              </div>
              <div className="text-sm text-gray-600">Revenue</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : dashboardStats?.tasksCompletedToday || 0}
              </div>
              <div className="text-sm text-gray-600">Tasks Done</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {dashboardStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leads */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Latest lead activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardStats.recentLeads?.slice(0, 5).map((lead, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{lead.name || 'Unknown Lead'}</div>
                      <div className="text-sm text-gray-500">{lead.source || 'Unknown Source'}</div>
                    </div>
                    <Badge variant="outline">
                      {lead.status || 'New'}
                    </Badge>
                  </div>
                ))}
                {(!dashboardStats.recentLeads || dashboardStats.recentLeads.length === 0) && (
                  <div className="text-center text-gray-500 py-4">No recent leads</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Best performing team members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardStats.topPerformers?.slice(0, 5).map((performer, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                        #{performer.rank}
                      </div>
                      <div>
                        <div className="font-medium">{performer.userName}</div>
                        <div className="text-sm text-gray-500">{performer.salesCount} sales</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(performer.revenue)}</div>
                    </div>
                  </div>
                ))}
                {(!dashboardStats.topPerformers || dashboardStats.topPerformers.length === 0) && (
                  <div className="text-center text-gray-500 py-4">No performance data</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
