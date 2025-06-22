import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { 
  analyticsService, 
  DashboardStats, 
  SalesAnalytics, 
  LeadAnalytics, 
  PropertyAnalytics, 
  FinancialAnalytics, 
  UserPerformance,
  GenerateReportRequest,
  ExportDataRequest
} from '@/services/analytics.service'

// Analytics query keys
export const crmAnalyticsKeys = {
  all: ['crm-analytics'] as const,
  dashboard: (userId?: string) => [...crmAnalyticsKeys.all, 'dashboard', userId] as const,
  sales: (filters?: Record<string, any>) => [...crmAnalyticsKeys.all, 'sales', filters] as const,
  leads: (filters?: Record<string, any>) => [...crmAnalyticsKeys.all, 'leads', filters] as const,
  properties: (filters?: Record<string, any>) => [...crmAnalyticsKeys.all, 'properties', filters] as const,
  financial: (filters?: Record<string, any>) => [...crmAnalyticsKeys.all, 'financial', filters] as const,
  userPerformance: (userId: string, period: string) => [...crmAnalyticsKeys.all, 'user-performance', userId, period] as const,
}

// Dashboard analytics hook
export function useCRMDashboardStats(userId?: string) {
  return useQuery({
    queryKey: crmAnalyticsKeys.dashboard(userId),
    queryFn: () => analyticsService.getDashboardStats(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  })
}

// Sales analytics hook
export function useCRMSalesAnalytics(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: crmAnalyticsKeys.sales(filters),
    queryFn: () => analyticsService.getSalesAnalytics(filters),
    staleTime: 5 * 60 * 1000,
  })
}

// Lead analytics hook
export function useCRMLeadAnalytics(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: crmAnalyticsKeys.leads(filters),
    queryFn: () => analyticsService.getLeadAnalytics(filters),
    staleTime: 5 * 60 * 1000,
  })
}

// Property analytics hook
export function useCRMPropertyAnalytics(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: crmAnalyticsKeys.properties(filters),
    queryFn: () => analyticsService.getPropertyAnalytics(filters),
    staleTime: 5 * 60 * 1000,
  })
}

// Financial analytics hook
export function useCRMFinancialAnalytics(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: crmAnalyticsKeys.financial(filters),
    queryFn: () => analyticsService.getFinancialAnalytics(filters),
    staleTime: 5 * 60 * 1000,
  })
}

// User performance hook
export function useCRMUserPerformance(userId: string, period: string = 'month') {
  return useQuery({
    queryKey: crmAnalyticsKeys.userPerformance(userId, period),
    queryFn: () => analyticsService.getUserPerformance(userId, period),
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  })
}

// Report generation hook
export function useCRMReportGeneration() {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateReportMutation = useMutation({
    mutationFn: async (request: GenerateReportRequest) => {
      setIsGenerating(true)
      try {
        await analyticsService.generateAndDownloadReport(request)
        toast.success('Report generated and downloaded successfully!')
      } catch (error) {
        toast.error('Failed to generate report')
        throw error
      } finally {
        setIsGenerating(false)
      }
    },
  })

  const generateReport = useCallback((request: GenerateReportRequest) => {
    return generateReportMutation.mutate(request)
  }, [generateReportMutation])

  return {
    generateReport,
    isGenerating,
    error: generateReportMutation.error,
  }
}

// Data export hook
export function useCRMDataExport() {
  const [isExporting, setIsExporting] = useState(false)

  const exportDataMutation = useMutation({
    mutationFn: async (request: ExportDataRequest) => {
      setIsExporting(true)
      try {
        await analyticsService.exportAndDownloadData(request)
        toast.success('Data exported and downloaded successfully!')
      } catch (error) {
        toast.error('Failed to export data')
        throw error
      } finally {
        setIsExporting(false)
      }
    },
  })

  const exportData = useCallback((request: ExportDataRequest) => {
    return exportDataMutation.mutate(request)
  }, [exportDataMutation])

  return {
    exportData,
    isExporting,
    error: exportDataMutation.error,
  }
}

// Combined analytics hook for dashboard
export function useCRMAnalyticsDashboard(userId?: string) {
  const dashboardQuery = useCRMDashboardStats(userId)
  const salesQuery = useCRMSalesAnalytics()
  const leadsQuery = useCRMLeadAnalytics()
  const propertiesQuery = useCRMPropertyAnalytics()
  const financialQuery = useCRMFinancialAnalytics()

  const isLoading = dashboardQuery.isLoading || 
                   salesQuery.isLoading || 
                   leadsQuery.isLoading || 
                   propertiesQuery.isLoading || 
                   financialQuery.isLoading

  const isError = dashboardQuery.isError || 
                  salesQuery.isError || 
                  leadsQuery.isError || 
                  propertiesQuery.isError || 
                  financialQuery.isError

  const error = dashboardQuery.error || 
                salesQuery.error || 
                leadsQuery.error || 
                propertiesQuery.error || 
                financialQuery.error

  return {
    dashboard: dashboardQuery.data,
    sales: salesQuery.data,
    leads: leadsQuery.data,
    properties: propertiesQuery.data,
    financial: financialQuery.data,
    isLoading,
    isError,
    error,
    refetch: () => {
      dashboardQuery.refetch()
      salesQuery.refetch()
      leadsQuery.refetch()
      propertiesQuery.refetch()
      financialQuery.refetch()
    }
  }
}

// Analytics filters hook
export function useCRMAnalyticsFilters() {
  const [filters, setFilters] = useState<Record<string, any>>({
    period: 'month',
    dateFrom: null,
    dateTo: null,
  })

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  const updateFilters = useCallback((newFilters: Record<string, any>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      period: 'month',
      dateFrom: null,
      dateTo: null,
    })
  }, [])

  const getDateRange = useCallback(() => {
    const now = new Date()
    const { period } = filters

    switch (period) {
      case 'week':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
        const weekEnd = new Date(now.setDate(weekStart.getDate() + 6))
        return { dateFrom: weekStart, dateTo: weekEnd }
      
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return { dateFrom: monthStart, dateTo: monthEnd }
      
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0)
        return { dateFrom: quarterStart, dateTo: quarterEnd }
      
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1)
        const yearEnd = new Date(now.getFullYear(), 11, 31)
        return { dateFrom: yearStart, dateTo: yearEnd }
      
      default:
        return { 
          dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : null, 
          dateTo: filters.dateTo ? new Date(filters.dateTo) : null 
        }
    }
  }, [filters])

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    getDateRange,
  }
}

// Real-time analytics hook
export function useCRMRealTimeAnalytics(userId?: string, interval: number = 30000) {
  const queryClient = useQueryClient()
  const [isRealTime, setIsRealTime] = useState(false)

  useEffect(() => {
    if (!isRealTime) return

    const intervalId = setInterval(() => {
      // Invalidate and refetch analytics data
      queryClient.invalidateQueries({ queryKey: crmAnalyticsKeys.dashboard(userId) })
      queryClient.invalidateQueries({ queryKey: crmAnalyticsKeys.sales() })
      queryClient.invalidateQueries({ queryKey: crmAnalyticsKeys.leads() })
    }, interval)

    return () => clearInterval(intervalId)
  }, [isRealTime, interval, queryClient, userId])

  const toggleRealTime = useCallback(() => {
    setIsRealTime(prev => !prev)
  }, [])

  return {
    isRealTime,
    toggleRealTime,
  }
}

// Analytics comparison hook
export function useCRMAnalyticsComparison(
  currentFilters: Record<string, any>,
  previousFilters: Record<string, any>
) {
  const currentData = useCRMAnalyticsDashboard()
  const previousData = useCRMAnalyticsDashboard() // Would use previousFilters in real implementation

  const comparison = {
    revenue: {
      current: currentData.dashboard?.totalRevenue || 0,
      previous: previousData.dashboard?.totalRevenue || 0,
      change: 0,
      percentage: 0,
    },
    sales: {
      current: currentData.dashboard?.totalSales || 0,
      previous: previousData.dashboard?.totalSales || 0,
      change: 0,
      percentage: 0,
    },
    leads: {
      current: currentData.dashboard?.totalLeads || 0,
      previous: previousData.dashboard?.totalLeads || 0,
      change: 0,
      percentage: 0,
    },
  }

  // Calculate changes and percentages
  Object.keys(comparison).forEach(key => {
    const metric = comparison[key as keyof typeof comparison]
    metric.change = metric.current - metric.previous
    metric.percentage = metric.previous > 0 ? (metric.change / metric.previous) * 100 : 0
  })

  return {
    comparison,
    isLoading: currentData.isLoading,
    isError: currentData.isError,
  }
}

export default {
  useCRMDashboardStats,
  useCRMSalesAnalytics,
  useCRMLeadAnalytics,
  useCRMPropertyAnalytics,
  useCRMFinancialAnalytics,
  useCRMUserPerformance,
  useCRMReportGeneration,
  useCRMDataExport,
  useCRMAnalyticsDashboard,
  useCRMAnalyticsFilters,
  useCRMRealTimeAnalytics,
  useCRMAnalyticsComparison,
}
