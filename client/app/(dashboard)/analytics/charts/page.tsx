'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  LineChart,
  Download,
  Maximize2,
  Settings
} from 'lucide-react'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { UserRole } from '@/types'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import {
  RevenueTrendChart,
  SalesPerformanceChart,
  LeadSourcesChart,
  LeadStatusChart,
  PropertyTypesChart,
  ConversionFunnelChart,
  KPIGauge,
} from '@/components/analytics/ChartComponents'

// Mock data for charts
const revenueData = [
  { month: 'Jan', revenue: 980000, sales: 18 },
  { month: 'Feb', revenue: 1120000, sales: 21 },
  { month: 'Mar', revenue: 1350000, sales: 25 },
  { month: 'Apr', revenue: 1180000, sales: 22 },
  { month: 'May', revenue: 1420000, sales: 27 },
  { month: 'Jun', revenue: 1650000, sales: 31 },
  { month: 'Jul', revenue: 1580000, sales: 29 },
  { month: 'Aug', revenue: 1720000, sales: 33 },
  { month: 'Sep', revenue: 1890000, sales: 36 },
  { month: 'Oct', revenue: 2100000, sales: 40 },
  { month: 'Nov', revenue: 1950000, sales: 37 },
  { month: 'Dec', revenue: 2250000, sales: 43 }
]

const salesPerformanceData = [
  { name: 'Sarah Johnson', sales: 45, revenue: 2400000 },
  { name: 'Mike Wilson', sales: 38, revenue: 2020000 },
  { name: 'Emily Davis', sales: 32, revenue: 1700000 },
  { name: 'John Smith', sales: 28, revenue: 1490000 },
  { name: 'Lisa Brown', sales: 25, revenue: 1330000 },
  { name: 'David Lee', sales: 22, revenue: 1180000 },
  { name: 'Anna White', sales: 19, revenue: 1020000 }
]

const leadSourcesData = [
  { source: 'Website', count: 456, percentage: 36.6 },
  { source: 'Referral', count: 312, percentage: 25.0 },
  { source: 'Social Media', count: 234, percentage: 18.8 },
  { source: 'Advertisement', count: 156, percentage: 12.5 },
  { source: 'Phone', count: 89, percentage: 7.1 }
]

const leadStatusData = [
  { status: 'New', count: 156, percentage: 12.5 },
  { status: 'Contacted', count: 234, percentage: 18.8 },
  { status: 'Qualified', count: 423, percentage: 33.9 },
  { status: 'Proposal', count: 189, percentage: 15.2 },
  { status: 'Negotiation', count: 112, percentage: 9.0 },
  { status: 'Converted', count: 234, percentage: 18.8 },
  { status: 'Lost', count: 89, percentage: 7.1 }
]

const propertyTypesData = [
  { type: '1 BHK', count: 234, avgPrice: 320000 },
  { type: '2 BHK', count: 456, avgPrice: 480000 },
  { type: '3 BHK', count: 523, avgPrice: 650000 },
  { type: '4 BHK', count: 189, avgPrice: 850000 },
  { type: 'Penthouse', count: 54, avgPrice: 1200000 }
]

const conversionFunnelData = [
  { stage: 'Leads', count: 1247, percentage: 100 },
  { stage: 'Contacted', count: 934, percentage: 74.9 },
  { stage: 'Qualified', count: 623, percentage: 49.9 },
  { stage: 'Proposal', count: 389, percentage: 31.2 },
  { stage: 'Converted', count: 234, percentage: 18.8 }
]

export default function ChartsPage() {
  const { user, canViewAnalytics } = useEnhancedAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('year')
  const [selectedTab, setSelectedTab] = useState('revenue')

  return (
    <ProtectedRoute requiredRole={UserRole.MANAGER}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Charts</h1>
            <p className="text-gray-600">Visual insights and data visualization</p>
          </div>
          <div className="flex gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
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
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Charts
            </Button>
          </div>
        </div>

        {/* KPI Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Lead Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <KPIGauge 
                value={28.5} 
                max={100} 
                label="Conversion" 
                color="rgba(16, 185, 129, 0.8)"
                height={150}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sales Target</CardTitle>
            </CardHeader>
            <CardContent>
              <KPIGauge 
                value={234} 
                max={300} 
                label="Sales" 
                color="rgba(59, 130, 246, 0.8)"
                height={150}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Revenue Target</CardTitle>
            </CardHeader>
            <CardContent>
              <KPIGauge 
                value={18.5} 
                max={25} 
                label="Revenue (M)" 
                color="rgba(245, 158, 11, 0.8)"
                height={150}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Client Satisfaction</CardTitle>
            </CardHeader>
            <CardContent>
              <KPIGauge 
                value={92} 
                max={100} 
                label="Satisfaction" 
                color="rgba(139, 92, 246, 0.8)"
                height={150}
              />
            </CardContent>
          </Card>
        </div>

        {/* Chart Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="funnel">Funnel</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Revenue Trend
                  </CardTitle>
                  <CardDescription>Monthly revenue and sales performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <RevenueTrendChart data={revenueData} height={400} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Sales Performance
                  </CardTitle>
                  <CardDescription>Top performing sales team members</CardDescription>
                </CardHeader>
                <CardContent>
                  <SalesPerformanceChart data={salesPerformanceData} height={400} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Sales Team Performance
                  </CardTitle>
                  <CardDescription>Individual sales performance comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <SalesPerformanceChart data={salesPerformanceData} height={400} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Monthly Sales Trend
                  </CardTitle>
                  <CardDescription>Sales count and revenue over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <RevenueTrendChart data={revenueData} height={400} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Lead Sources
                  </CardTitle>
                  <CardDescription>Distribution of lead generation sources</CardDescription>
                </CardHeader>
                <CardContent>
                  <LeadSourcesChart data={leadSourcesData} height={400} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Lead Status Distribution
                  </CardTitle>
                  <CardDescription>Current lead pipeline status</CardDescription>
                </CardHeader>
                <CardContent>
                  <LeadStatusChart data={leadStatusData} height={400} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="properties" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Property Types
                  </CardTitle>
                  <CardDescription>Inventory count and average pricing by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <PropertyTypesChart data={propertyTypesData} height={400} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Property Distribution
                  </CardTitle>
                  <CardDescription>Property type distribution overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <LeadSourcesChart 
                    data={propertyTypesData.map(item => ({
                      source: item.type,
                      count: item.count,
                      percentage: (item.count / propertyTypesData.reduce((sum, p) => sum + p.count, 0)) * 100
                    }))} 
                    height={400} 
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="funnel" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Conversion Funnel
                  </CardTitle>
                  <CardDescription>Lead to sale conversion pipeline</CardDescription>
                </CardHeader>
                <CardContent>
                  <ConversionFunnelChart data={conversionFunnelData} height={400} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conversion Metrics</CardTitle>
                  <CardDescription>Key conversion statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {conversionFunnelData.map((stage, index) => {
                      const nextStage = conversionFunnelData[index + 1]
                      const conversionRate = nextStage ? (nextStage.count / stage.count) * 100 : 0
                      
                      return (
                        <div key={stage.stage} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{stage.stage}</span>
                            <div className="text-right">
                              <div className="text-lg font-bold">{stage.count.toLocaleString()}</div>
                              <div className="text-sm text-gray-500">{stage.percentage.toFixed(1)}%</div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${stage.percentage}%` }}
                            />
                          </div>
                          
                          {nextStage && (
                            <div className="text-sm text-gray-600">
                              → {conversionRate.toFixed(1)}% convert to {nextStage.stage}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Chart Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Chart Actions</CardTitle>
            <CardDescription>Export and customize your charts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export as PNG
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export as PDF
              </Button>
              <Button variant="outline">
                <Maximize2 className="h-4 w-4 mr-2" />
                Full Screen View
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Customize Charts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
