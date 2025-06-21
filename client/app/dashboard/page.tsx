'use client'

import { LeadsAnalytics } from '@/components/dashboard/leads-analytics'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { useSelector } from 'react-redux'

interface User {
  username: string
  role: string
  [key: string]: any
}

interface RootState {
  user: {
    loggedUser: User | null
  }
}

export default function DashboardPage() {
  const { loggedUser } = useSelector((state: RootState) => state.user)

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {loggedUser?.username || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your real estate business today.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            Role: {loggedUser?.role || 'Employee'}
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <StatsCards />

      {/* Main Dashboard Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue Chart - Takes up 4 columns */}
        <RevenueChart />

        {/* Quick Actions - Takes up 3 columns */}
        <div className="lg:col-span-3">
          <QuickActions />
        </div>
      </div>

      {/* Analytics and Activity */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Leads Analytics - Takes up 4 columns */}
        <LeadsAnalytics />

        {/* Recent Activity - Takes up 3 columns */}
        <div className="lg:col-span-3">
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}
