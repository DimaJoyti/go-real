'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Home, 
  Target,
  Calendar,
  Phone,
  Mail,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period: string
  }
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple'
  description?: string
}

function StatCard({ title, value, change, icon, color = 'blue', description }: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50'
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg", colorClasses[color])}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {change && (
          <div className="flex items-center mt-2">
            {change.type === 'increase' ? (
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
            )}
            <span className={cn(
              "text-xs font-medium",
              change.type === 'increase' ? 'text-green-600' : 'text-red-600'
            )}>
              {change.value > 0 ? '+' : ''}{change.value}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              from {change.period}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function StatsCards() {
  const stats = [
    {
      title: 'Total Revenue',
      value: '$2,456,789',
      change: { value: 12.5, type: 'increase' as const, period: 'last month' },
      icon: <DollarSign className="h-4 w-4" />,
      color: 'green' as const,
      description: 'Total revenue this year'
    },
    {
      title: 'Active Leads',
      value: '1,234',
      change: { value: 8.2, type: 'increase' as const, period: 'last week' },
      icon: <Users className="h-4 w-4" />,
      color: 'blue' as const,
      description: 'Leads in pipeline'
    },
    {
      title: 'Properties Sold',
      value: '89',
      change: { value: 15.3, type: 'increase' as const, period: 'last month' },
      icon: <Home className="h-4 w-4" />,
      color: 'purple' as const,
      description: 'Completed sales'
    },
    {
      title: 'Conversion Rate',
      value: '24.8%',
      change: { value: 2.1, type: 'increase' as const, period: 'last month' },
      icon: <Target className="h-4 w-4" />,
      color: 'orange' as const,
      description: 'Lead to sale conversion'
    },
    {
      title: 'Scheduled Meetings',
      value: '47',
      change: { value: 5.7, type: 'decrease' as const, period: 'last week' },
      icon: <Calendar className="h-4 w-4" />,
      color: 'blue' as const,
      description: 'Upcoming appointments'
    },
    {
      title: 'Follow-up Calls',
      value: '156',
      change: { value: 18.9, type: 'increase' as const, period: 'last week' },
      icon: <Phone className="h-4 w-4" />,
      color: 'green' as const,
      description: 'Pending follow-ups'
    },
    {
      title: 'Email Campaigns',
      value: '23',
      change: { value: 12.0, type: 'increase' as const, period: 'last month' },
      icon: <Mail className="h-4 w-4" />,
      color: 'purple' as const,
      description: 'Active campaigns'
    },
    {
      title: 'Tasks Completed',
      value: '342',
      change: { value: 7.4, type: 'increase' as const, period: 'last week' },
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'green' as const,
      description: 'Tasks this month'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.slice(0, 4).map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}

export function ExtendedStatsCards() {
  const stats = [
    {
      title: 'Total Revenue',
      value: '$2,456,789',
      change: { value: 12.5, type: 'increase' as const, period: 'last month' },
      icon: <DollarSign className="h-4 w-4" />,
      color: 'green' as const,
      description: 'Total revenue this year'
    },
    {
      title: 'Active Leads',
      value: '1,234',
      change: { value: 8.2, type: 'increase' as const, period: 'last week' },
      icon: <Users className="h-4 w-4" />,
      color: 'blue' as const,
      description: 'Leads in pipeline'
    },
    {
      title: 'Properties Sold',
      value: '89',
      change: { value: 15.3, type: 'increase' as const, period: 'last month' },
      icon: <Home className="h-4 w-4" />,
      color: 'purple' as const,
      description: 'Completed sales'
    },
    {
      title: 'Conversion Rate',
      value: '24.8%',
      change: { value: 2.1, type: 'increase' as const, period: 'last month' },
      icon: <Target className="h-4 w-4" />,
      color: 'orange' as const,
      description: 'Lead to sale conversion'
    },
    {
      title: 'Scheduled Meetings',
      value: '47',
      change: { value: 5.7, type: 'decrease' as const, period: 'last week' },
      icon: <Calendar className="h-4 w-4" />,
      color: 'blue' as const,
      description: 'Upcoming appointments'
    },
    {
      title: 'Follow-up Calls',
      value: '156',
      change: { value: 18.9, type: 'increase' as const, period: 'last week' },
      icon: <Phone className="h-4 w-4" />,
      color: 'green' as const,
      description: 'Pending follow-ups'
    },
    {
      title: 'Email Campaigns',
      value: '23',
      change: { value: 12.0, type: 'increase' as const, period: 'last month' },
      icon: <Mail className="h-4 w-4" />,
      color: 'purple' as const,
      description: 'Active campaigns'
    },
    {
      title: 'Tasks Completed',
      value: '342',
      change: { value: 7.4, type: 'increase' as const, period: 'last week' },
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'green' as const,
      description: 'Tasks this month'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}
