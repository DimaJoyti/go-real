'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { useState } from 'react'
import { TrendingUp, Calendar, DollarSign } from 'lucide-react'

const revenueData = [
  { month: 'Jan', revenue: 186000, expenses: 80000, profit: 106000 },
  { month: 'Feb', revenue: 205000, expenses: 85000, profit: 120000 },
  { month: 'Mar', revenue: 237000, expenses: 90000, profit: 147000 },
  { month: 'Apr', revenue: 273000, expenses: 95000, profit: 178000 },
  { month: 'May', revenue: 209000, expenses: 88000, profit: 121000 },
  { month: 'Jun', revenue: 264000, expenses: 92000, profit: 172000 },
  { month: 'Jul', revenue: 290000, expenses: 98000, profit: 192000 },
  { month: 'Aug', revenue: 312000, expenses: 102000, profit: 210000 },
  { month: 'Sep', revenue: 298000, expenses: 100000, profit: 198000 },
  { month: 'Oct', revenue: 335000, expenses: 105000, profit: 230000 },
  { month: 'Nov', revenue: 378000, expenses: 110000, profit: 268000 },
  { month: 'Dec', revenue: 425000, expenses: 115000, profit: 310000 }
]

const quarterlyData = [
  { quarter: 'Q1 2024', revenue: 628000, expenses: 255000, profit: 373000 },
  { quarter: 'Q2 2024', revenue: 746000, expenses: 275000, profit: 471000 },
  { quarter: 'Q3 2024', revenue: 900000, expenses: 300000, profit: 600000 },
  { quarter: 'Q4 2024', revenue: 1138000, expenses: 330000, profit: 808000 }
]

const yearlyData = [
  { year: '2021', revenue: 2100000, expenses: 950000, profit: 1150000 },
  { year: '2022', revenue: 2450000, expenses: 1050000, profit: 1400000 },
  { year: '2023', revenue: 2890000, expenses: 1180000, profit: 1710000 },
  { year: '2024', revenue: 3412000, expenses: 1160000, profit: 2252000 }
]

type TimeRange = 'monthly' | 'quarterly' | 'yearly'

export function RevenueChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly')

  const getData = () => {
    switch (timeRange) {
      case 'quarterly': return quarterlyData
      case 'yearly': return yearlyData
      default: return revenueData
    }
  }

  const getXAxisKey = () => {
    switch (timeRange) {
      case 'quarterly': return 'quarter'
      case 'yearly': return 'year'
      default: return 'month'
    }
  }

  const data = getData()
  const currentPeriodRevenue = data[data.length - 1]?.revenue || 0
  const previousPeriodRevenue = data[data.length - 2]?.revenue || 0
  const growthRate = previousPeriodRevenue > 0 
    ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue * 100).toFixed(1)
    : '0'

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Overview
            </CardTitle>
            <CardDescription>
              Track your revenue, expenses, and profit over time
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={timeRange === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={timeRange === 'quarterly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('quarterly')}
            >
              Quarterly
            </Button>
            <Button
              variant={timeRange === 'yearly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('yearly')}
            >
              Yearly
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-2xl font-bold">{formatCurrency(currentPeriodRevenue)}</span>
            <Badge variant="secondary" className="text-green-600">
              +{growthRate}%
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground">
            Current {timeRange.slice(0, -2)} revenue
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey={getXAxisKey()} 
                className="text-sm"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-sm"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                name="Revenue"
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                name="Expenses"
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                name="Profit"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
