'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export interface AnalyticsData {
  overview: {
    totalUsers: number
    totalChallenges: number
    totalFilms: number
    totalNFTs: number
    totalRevenue: number
    activeUsers: number
  }
  challenges: {
    totalCreated: number
    totalCompleted: number
    totalParticipants: number
    averageParticipants: number
    topCategories: Array<{ category: string; count: number }>
    recentActivity: Array<{
      id: string
      title: string
      participants: number
      created_at: string
    }>
  }
  films: {
    totalUploaded: number
    totalViews: number
    totalLikes: number
    averageViews: number
    topCategories: Array<{ category: string; count: number }>
    trending: Array<{
      id: string
      title: string
      views: number
      likes: number
      created_at: string
    }>
  }
  nfts: {
    totalMinted: number
    totalValue: number
    totalSales: number
    averagePrice: number
    topPropertyTypes: Array<{ type: string; count: number; value: number }>
    recentSales: Array<{
      id: string
      name: string
      price: number
      sold_at: string
    }>
  }
  revenue: {
    totalRevenue: number
    monthlyRevenue: Array<{ month: string; amount: number }>
    revenueBySource: Array<{ source: string; amount: number }>
    platformFees: number
  }
  users: {
    totalUsers: number
    newUsersThisMonth: number
    activeUsers: number
    userGrowth: Array<{ month: string; count: number }>
    topCreators: Array<{
      id: string
      username: string
      challenges_created: number
      films_uploaded: number
      nfts_created: number
    }>
  }
}

export function useAnalytics(timeRange: '7d' | '30d' | '90d' | '1y' = '30d') {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(endDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(endDate.getDate() - 90)
          break
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
      }

      // Fetch all analytics data in parallel
      const [
        overviewData,
        challengesData,
        filmsData,
        nftsData,
        revenueData,
        usersData
      ] = await Promise.all([
        fetchOverviewData(startDate, endDate),
        fetchChallengesData(startDate, endDate),
        fetchFilmsData(startDate, endDate),
        fetchNFTsData(startDate, endDate),
        fetchRevenueData(startDate, endDate),
        fetchUsersData(startDate, endDate)
      ])

      setAnalytics({
        overview: overviewData,
        challenges: challengesData,
        films: filmsData,
        nfts: nftsData,
        revenue: revenueData,
        users: usersData
      })
    } catch (error: any) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOverviewData = async (startDate: Date, endDate: Date) => {
    const [users, challenges, films, nfts, revenue] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }),
      supabase.from('challenges').select('id', { count: 'exact' }),
      supabase.from('films').select('id', { count: 'exact' }),
      supabase.from('real_estate_nfts').select('id', { count: 'exact' }),
      supabase.from('transactions').select('amount').eq('status', 'confirmed')
    ])

    const totalRevenue = revenue.data?.reduce((sum, t) => sum + t.amount, 0) || 0
    
    // Active users (users who performed any action in the last 7 days)
    const activeUsersQuery = await supabase
      .from('user_activity')
      .select('user_id', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    return {
      totalUsers: users.count || 0,
      totalChallenges: challenges.count || 0,
      totalFilms: films.count || 0,
      totalNFTs: nfts.count || 0,
      totalRevenue,
      activeUsers: activeUsersQuery.count || 0
    }
  }

  const fetchChallengesData = async (startDate: Date, endDate: Date) => {
    const [total, completed, participants, categories, recent] = await Promise.all([
      supabase
        .from('challenges')
        .select('id', { count: 'exact' })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      
      supabase
        .from('challenges')
        .select('id', { count: 'exact' })
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      
      supabase
        .from('challenge_participants')
        .select('id', { count: 'exact' })
        .gte('joined_at', startDate.toISOString())
        .lte('joined_at', endDate.toISOString()),
      
      supabase
        .from('challenges')
        .select('category')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      
      supabase
        .from('challenges')
        .select('id, title, current_participants, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    // Process categories
    const categoryCount = categories.data?.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalCreated: total.count || 0,
      totalCompleted: completed.count || 0,
      totalParticipants: participants.count || 0,
      averageParticipants: total.count ? (participants.count || 0) / total.count : 0,
      topCategories,
      recentActivity: recent.data || []
    }
  }

  const fetchFilmsData = async (startDate: Date, endDate: Date) => {
    const [total, stats, categories, trending] = await Promise.all([
      supabase
        .from('films')
        .select('id', { count: 'exact' })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      
      supabase
        .from('films')
        .select('views, likes')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      
      supabase
        .from('films')
        .select('category')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      
      supabase
        .from('films')
        .select('id, title, views, likes, created_at')
        .order('views', { ascending: false })
        .limit(5)
    ])

    const totalViews = stats.data?.reduce((sum, f) => sum + f.views, 0) || 0
    const totalLikes = stats.data?.reduce((sum, f) => sum + f.likes, 0) || 0

    // Process categories
    const categoryCount = categories.data?.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalUploaded: total.count || 0,
      totalViews,
      totalLikes,
      averageViews: total.count ? totalViews / total.count : 0,
      topCategories,
      trending: trending.data || []
    }
  }

  const fetchNFTsData = async (startDate: Date, endDate: Date) => {
    const [total, sales, propertyTypes, recentSales] = await Promise.all([
      supabase
        .from('real_estate_nfts')
        .select('total_value')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      
      supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'sale')
        .eq('status', 'confirmed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      
      supabase
        .from('real_estate_nfts')
        .select('property_type, total_value')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      
      supabase
        .from('transactions')
        .select('nft:real_estate_nfts(name), amount, created_at')
        .eq('type', 'sale')
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    const totalValue = total.data?.reduce((sum, nft) => sum + nft.total_value, 0) || 0
    const totalSalesAmount = sales.data?.reduce((sum, sale) => sum + sale.amount, 0) || 0

    // Process property types
    const typeStats = propertyTypes.data?.reduce((acc, nft) => {
      if (!acc[nft.property_type]) {
        acc[nft.property_type] = { count: 0, value: 0 }
      }
      acc[nft.property_type].count += 1
      acc[nft.property_type].value += nft.total_value
      return acc
    }, {} as Record<string, { count: number; value: number }>) || {}

    const topPropertyTypes = Object.entries(typeStats)
      .map(([type, stats]) => ({ type, count: stats.count, value: stats.value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    return {
      totalMinted: total.count || 0,
      totalValue,
      totalSales: sales.count || 0,
      averagePrice: sales.count ? totalSalesAmount / sales.count : 0,
      topPropertyTypes,
      recentSales: recentSales.data?.map(sale => ({
        id: sale.nft?.id || '',
        name: sale.nft?.name || 'Unknown',
        price: sale.amount,
        sold_at: sale.created_at
      })) || []
    }
  }

  const fetchRevenueData = async (startDate: Date, endDate: Date) => {
    const [transactions, monthlyData] = await Promise.all([
      supabase
        .from('transactions')
        .select('amount, type, created_at')
        .eq('status', 'confirmed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      
      supabase.rpc('get_monthly_revenue', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      })
    ])

    const totalRevenue = transactions.data?.reduce((sum, t) => sum + t.amount, 0) || 0
    const platformFees = totalRevenue * 0.025 // 2.5% platform fee

    // Group by source
    const revenueBySource = transactions.data?.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + t.amount
      return acc
    }, {} as Record<string, number>) || {}

    return {
      totalRevenue,
      monthlyRevenue: monthlyData.data || [],
      revenueBySource: Object.entries(revenueBySource)
        .map(([source, amount]) => ({ source, amount })),
      platformFees
    }
  }

  const fetchUsersData = async (startDate: Date, endDate: Date) => {
    const [total, newUsers, growth, topCreators] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }),
      
      supabase
        .from('users')
        .select('id', { count: 'exact' })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      
      supabase.rpc('get_user_growth', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      }),
      
      supabase.rpc('get_top_creators', { limit_count: 10 })
    ])

    return {
      totalUsers: total.count || 0,
      newUsersThisMonth: newUsers.count || 0,
      activeUsers: 0, // Would need to implement activity tracking
      userGrowth: growth.data || [],
      topCreators: topCreators.data || []
    }
  }

  return {
    analytics,
    loading,
    refetch: fetchAnalytics,
    timeRange
  }
}
