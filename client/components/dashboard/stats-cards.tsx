'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
    Calendar,
    CheckCircle,
    DollarSign,
    Home,
    Mail,
    Phone,
    Target,
    TrendingDown,
    TrendingUp,
    Users
} from 'lucide-react'

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
    blue: 'text-primary bg-primary/10 border-primary/20',
    green: 'text-success bg-success/10 border-success/20',
    orange: 'text-warning bg-warning/10 border-warning/20',
    red: 'text-destructive bg-destructive/10 border-destructive/20',
    purple: 'text-secondary bg-secondary/10 border-secondary/20'
  }

  const gradientClasses = {
    blue: 'from-primary/5 to-primary/10',
    green: 'from-success/5 to-success/10',
    orange: 'from-warning/5 to-warning/10',
    red: 'from-destructive/5 to-destructive/10',
    purple: 'from-secondary/5 to-secondary/10'
  }

  return (
    <Card className="group morphing-card hover-glow animate-fade-in relative overflow-hidden sparkle">
      {/* Animated background gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-30 transition-all duration-500 group-hover:opacity-60",
        gradientClasses[color]
      )} />

      {/* Floating orbs */}
      <div className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full animate-float" />
      <div className="absolute bottom-4 left-4 w-6 h-6 bg-white/5 rounded-full animate-float floating-delayed" />

      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-bold text-muted-foreground tracking-wide uppercase">
          {title}
        </CardTitle>
        <div className={cn(
          "p-4 rounded-2xl border backdrop-blur-sm transition-all duration-500 group-hover:scale-125 group-hover:rotate-12 animate-breathe",
          colorClasses[color]
        )}>
          {icon}
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <div className="text-4xl font-black text-gradient-aurora tracking-tight">{value}</div>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed font-medium">{description}</p>
        )}
        {change && (
          <div className="flex items-center justify-between">
            <div className={cn(
              "flex items-center px-3 py-2 rounded-xl text-xs font-bold shadow-lg transition-all duration-300 hover:scale-105",
              change.type === 'increase'
                ? 'bg-success/20 text-success border border-success/30 hover:bg-success/30'
                : 'bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30'
            )}>
              {change.type === 'increase' ? (
                <TrendingUp className="h-4 w-4 mr-2 animate-bounce" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-2 animate-bounce" />
              )}
              {change.value > 0 ? '+' : ''}{change.value}%
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              vs {change.period}
            </span>
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-out",
              color === 'green' && 'bg-success',
              color === 'blue' && 'bg-primary',
              color === 'purple' && 'bg-secondary',
              color === 'orange' && 'bg-warning'
            )}
            style={{
              width: `${Math.min(Math.abs(change?.value || 50), 100)}%`,
              animationDelay: '0.5s'
            }}
          />
        </div>
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
