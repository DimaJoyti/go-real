'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { useState } from 'react'
import { Users, TrendingUp, Filter, Eye } from 'lucide-react'

const leadsByStatus = [
  { name: 'New', count: 145, color: '#3b82f6' },
  { name: 'Contacted', count: 89, color: '#8b5cf6' },
  { name: 'Qualified', count: 67, color: '#10b981' },
  { name: 'Proposal', count: 34, color: '#f59e0b' },
  { name: 'Negotiation', count: 23, color: '#ef4444' },
  { name: 'Closed Won', count: 45, color: '#059669' },
  { name: 'Closed Lost', count: 28, color: '#dc2626' }
]

const leadsBySource = [
  { name: 'Website', count: 156, color: '#3b82f6' },
  { name: 'Social Media', count: 89, color: '#8b5cf6' },
  { name: 'Referrals', count: 67, color: '#10b981' },
  { name: 'Email Campaign', count: 45, color: '#f59e0b' },
  { name: 'Cold Calls', count: 34, color: '#ef4444' },
  { name: 'Events', count: 23, color: '#06b6d4' },
  { name: 'Other', count: 17, color: '#6b7280' }
]

const leadsByPriority = [
  { name: 'Hot', count: 89, color: '#ef4444' },
  { name: 'Warm', count: 156, color: '#f59e0b' },
  { name: 'Cold', count: 234, color: '#3b82f6' },
  { name: 'Very Cold', count: 67, color: '#6b7280' }
]

const monthlyLeads = [
  { month: 'Jan', new: 45, converted: 12, lost: 8 },
  { month: 'Feb', new: 52, converted: 15, lost: 10 },
  { month: 'Mar', new: 48, converted: 18, lost: 7 },
  { month: 'Apr', new: 61, converted: 22, lost: 12 },
  { month: 'May', new: 55, converted: 19, lost: 9 },
  { month: 'Jun', new: 67, converted: 25, lost: 11 },
  { month: 'Jul', new: 72, converted: 28, lost: 13 },
  { month: 'Aug', new: 69, converted: 26, lost: 10 },
  { month: 'Sep', new: 78, converted: 31, lost: 14 },
  { month: 'Oct', new: 84, converted: 35, lost: 12 },
  { month: 'Nov', new: 91, converted: 38, lost: 15 },
  { month: 'Dec', new: 89, converted: 42, lost: 11 }
]

type AnalyticsView = 'status' | 'source' | 'priority' | 'trends'

export function LeadsAnalytics() {
  const [view, setView] = useState<AnalyticsView>('status')

  const getChartData = () => {
    switch (view) {
      case 'source': return leadsBySource
      case 'priority': return leadsByPriority
      case 'trends': return monthlyLeads
      default: return leadsByStatus
    }
  }

  const getTotalLeads = () => {
    const data = getChartData()
    if (view === 'trends') {
      return (data as typeof monthlyLeads).reduce((sum, item) => sum + item.new, 0)
    }
    return (data as typeof leadsByStatus).reduce((sum, item) => sum + item.count, 0)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    const data = getChartData()

    if (view === 'trends') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-sm" />
            <YAxis className="text-sm" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="new" fill="#3b82f6" name="New Leads" />
            <Bar dataKey="converted" fill="#10b981" name="Converted" />
            <Bar dataKey="lost" fill="#ef4444" name="Lost" />
          </BarChart>
        </ResponsiveContainer>
      )
    }

    if (view === 'priority') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" className="text-sm" />
          <YAxis className="text-sm" />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <Card className="col-span-3">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Leads Analytics
            </CardTitle>
            <CardDescription>
              Analyze your leads by different criteria
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'status' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('status')}
            >
              Status
            </Button>
            <Button
              variant={view === 'source' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('source')}
            >
              Source
            </Button>
            <Button
              variant={view === 'priority' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('priority')}
            >
              Priority
            </Button>
            <Button
              variant={view === 'trends' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('trends')}
            >
              Trends
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-2xl font-bold">{getTotalLeads()}</span>
            <Badge variant="secondary" className="text-blue-600">
              Total Leads
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground">
            {view === 'trends' ? 'This year' : `By ${view}`}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
        
        {view !== 'trends' && view !== 'priority' && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            {(getChartData() as typeof leadsByStatus).slice(0, 4).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className="text-sm font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
