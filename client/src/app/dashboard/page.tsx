'use client'

import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/header'
import { ProfileForm } from '@/components/features/profile/profile-form'
import { Button } from '@/components/ui/button'
import { Trophy, Film, Building, Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access your dashboard.</p>
          <Button asChild>
            <Link href="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.profile?.username || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Manage your challenges, films, and NFT portfolio from your dashboard.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Button asChild className="h-auto p-6 flex-col space-y-2" variant="outline">
            <Link href="/challenges/create">
              <Trophy className="h-8 w-8 text-challenz-600" />
              <span className="font-semibold">Create Challenge</span>
              <span className="text-sm text-muted-foreground">Start a new challenge</span>
            </Link>
          </Button>
          
          <Button asChild className="h-auto p-6 flex-col space-y-2" variant="outline">
            <Link href="/films/upload">
              <Film className="h-8 w-8 text-purple-600" />
              <span className="font-semibold">Upload Film</span>
              <span className="text-sm text-muted-foreground">Share your creativity</span>
            </Link>
          </Button>
          
          <Button asChild className="h-auto p-6 flex-col space-y-2" variant="outline">
            <Link href="/marketplace/create">
              <Building className="h-8 w-8 text-nft-600" />
              <span className="font-semibold">Create NFT</span>
              <span className="text-sm text-muted-foreground">Tokenize real estate</span>
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Challenges</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <Trophy className="h-8 w-8 text-challenz-600" />
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Films Uploaded</p>
                <p className="text-2xl font-bold">7</p>
              </div>
              <Film className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">NFTs Owned</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <Building className="h-8 w-8 text-nft-600" />
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">$1,250</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
          <ProfileForm />
        </div>
      </main>
    </div>
  )
}
