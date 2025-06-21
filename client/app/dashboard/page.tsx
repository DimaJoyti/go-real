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
    <div className="space-y-10">
      {/* Welcome Section */}
      <div className="relative">
        {/* Background decoration */}
        <div className="absolute inset-0 gradient-aurora opacity-5 rounded-3xl animate-gradient" />

        <div className="relative flex items-center justify-between animate-slide-down p-8 rounded-3xl">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 gradient-royal rounded-2xl flex items-center justify-center animate-float shadow-2xl">
                <span className="text-2xl">🏠</span>
              </div>
              <div>
                <h1 className="text-5xl font-bold tracking-tight text-gradient-aurora mb-2">
                  Welcome back, {loggedUser?.username || 'User'}! ✨
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Here's what's happening with your real estate empire today.
                </p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center space-x-6 mt-6">
              <div className="glass-card px-4 py-2 rounded-xl sparkle">
                <span className="text-sm text-muted-foreground">Today's Revenue</span>
                <p className="text-2xl font-bold text-gradient">$24,580</p>
              </div>
              <div className="glass-card px-4 py-2 rounded-xl sparkle">
                <span className="text-sm text-muted-foreground">New Leads</span>
                <p className="text-2xl font-bold text-gradient">+12</p>
              </div>
              <div className="glass-card px-4 py-2 rounded-xl sparkle">
                <span className="text-sm text-muted-foreground">Active Deals</span>
                <p className="text-2xl font-bold text-gradient">8</p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="glass-card p-6 rounded-2xl morphing-card floating-delayed">
              <div className="w-12 h-12 gradient-sunset rounded-xl flex items-center justify-center mb-4 mx-auto animate-breathe">
                <span className="text-xl">📅</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Role: <span className="font-semibold text-gradient">{loggedUser?.role || 'Employee'}</span>
              </p>
              <div className="mt-4 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-xs text-success font-medium">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <StatsCards />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid gap-6 lg:grid-cols-7 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        {/* Revenue Chart - Takes up 4 columns */}
        <RevenueChart />

        {/* Quick Actions - Takes up 3 columns */}
        <div className="lg:col-span-3">
          <QuickActions />
        </div>
      </div>

      {/* Analytics and Activity */}
      <div className="grid gap-6 lg:grid-cols-7 animate-slide-up" style={{ animationDelay: '0.3s' }}>
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
