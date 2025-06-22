import { apiClient } from './api.service'

// Analytics interfaces
export interface DashboardStats {
  totalUsers: number
  totalLeads: number
  totalClients: number
  totalSales: number
  totalRevenue: number
  totalProperties: number
  totalTasks: number
  newLeadsToday: number
  newClientsToday: number
  salesToday: number
  revenueToday: number
  tasksCompletedToday: number
  leadConversionRate: number
  averageSaleValue: number
  averageLeadScore: number
  taskCompletionRate: number
  monthlyGrowth: number
  revenueGrowth: number
  leadGrowth: number
  clientGrowth: number
  recentLeads: any[]
  recentSales: any[]
  overdueTasks: any[]
  topPerformers: UserPerformanceSummary[]
  lastUpdated: string
}

export interface SalesAnalytics {
  totalSales: number
  totalRevenue: number
  averageSaleValue: number
  medianSaleValue: number
  pendingSales: number
  approvedSales: number
  completedSales: number
  cancelledSales: number
  dailyRevenue: TimeSeriesData[]
  weeklyRevenue: TimeSeriesData[]
  monthlyRevenue: TimeSeriesData[]
  quarterlyRevenue: TimeSeriesData[]
  yearlyRevenue: TimeSeriesData[]
  salesByEmployee: EmployeePerformance[]
  salesByProperty: PropertyPerformance[]
  salesBySource: SourcePerformance[]
  leadToSaleConversion: number
  averageSaleCycle: number
  totalCommissions: number
  paidCommissions: number
  pendingCommissions: number
  projectedRevenue: number
  pipelineValue: number
  period: string
  generatedAt: string
}

export interface LeadAnalytics {
  totalLeads: number
  newLeads: number
  qualifiedLeads: number
  convertedLeads: number
  lostLeads: number
  conversionRate: number
  qualificationRate: number
  averageLeadScore: number
  averageResponseTime: number
  leadsBySource: SourcePerformance[]
  sourceConversion: SourceConversion[]
  leadsByStatus: StatusDistribution[]
  statusProgression: StatusProgression[]
  dailyLeads: TimeSeriesData[]
  weeklyLeads: TimeSeriesData[]
  monthlyLeads: TimeSeriesData[]
  leadsByEmployee: EmployeePerformance[]
  leadsByScore: ScoreDistribution[]
  overdueFollowUps: number
  scheduledFollowUps: number
  averageFollowUpTime: number
  period: string
  generatedAt: string
}

export interface PropertyAnalytics {
  totalProperties: number
  availableUnits: number
  soldUnits: number
  reservedUnits: number
  totalInventoryValue: number
  averagePropertyValue: number
  inventoryTurnover: number
  averageSaleTime: number
  propertiesByType: TypeDistribution[]
  salesByType: TypePerformance[]
  propertiesByLocation: LocationPerformance[]
  salesByLocation: LocationPerformance[]
  projectPerformance: ProjectPerformance[]
  societyPerformance: SocietyPerformance[]
  priceRanges: PriceRangeAnalysis[]
  priceTrends: TimeSeriesData[]
  availabilityTrends: TimeSeriesData[]
  reservationTrends: TimeSeriesData[]
  period: string
  generatedAt: string
}

export interface FinancialAnalytics {
  totalIncome: number
  totalExpense: number
  netProfit: number
  profitMargin: number
  cashInflow: number
  cashOutflow: number
  netCashFlow: number
  dailyRevenue: TimeSeriesData[]
  monthlyRevenue: TimeSeriesData[]
  quarterlyRevenue: TimeSeriesData[]
  incomeByCategory: CategoryAnalysis[]
  expenseByCategory: CategoryAnalysis[]
  pendingPayments: number
  overduePayments: number
  collectionRate: number
  totalCommissions: number
  paidCommissions: number
  pendingCommissions: number
  pendingVouchers: number
  approvedVouchers: number
  rejectedVouchers: number
  period: string
  generatedAt: string
}

export interface UserPerformance {
  userId: string
  userName: string
  role: string
  totalLeads: number
  qualifiedLeads: number
  convertedLeads: number
  leadConversionRate: number
  averageLeadScore: number
  totalSales: number
  totalRevenue: number
  averageSaleValue: number
  commissionEarned: number
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  taskCompletionRate: number
  averageTaskTime: number
  loginDays: number
  activeDays: number
  lastLoginDate: string | null
  leadRank: number
  salesRank: number
  overallRank: number
  performanceTrend: TimeSeriesData[]
  period: string
  generatedAt: string
}

// Supporting interfaces
export interface TimeSeriesData {
  date: string
  value: number
  count?: number
  label?: string
}

export interface EmployeePerformance {
  userId: string
  userName: string
  role: string
  count: number
  value: number
  percentage: number
  rank: number
}

export interface PropertyPerformance {
  propertyId: string
  propertyName: string
  propertyType: string
  salesCount: number
  totalValue: number
  averageValue: number
}

export interface SourcePerformance {
  source: string
  count: number
  value?: number
  percentage: number
  conversion?: number
}

export interface SourceConversion {
  source: string
  totalLeads: number
  convertedLeads: number
  conversionRate: number
  averageScore: number
}

export interface StatusDistribution {
  status: string
  count: number
  percentage: number
  value?: number
}

export interface StatusProgression {
  fromStatus: string
  toStatus: string
  count: number
  averageTime: number
}

export interface ScoreDistribution {
  scoreRange: string
  count: number
  percentage: number
  minScore: number
  maxScore: number
}

export interface TypeDistribution {
  type: string
  count: number
  percentage: number
  value?: number
}

export interface TypePerformance {
  type: string
  salesCount: number
  totalValue: number
  averageValue: number
  percentage: number
}

export interface LocationPerformance {
  location: string
  count: number
  totalValue: number
  averageValue: number
  percentage: number
}

export interface ProjectPerformance {
  projectId: string
  projectName: string
  totalUnits: number
  soldUnits: number
  availableUnits: number
  salesValue: number
  salesRate: number
}

export interface SocietyPerformance {
  societyId: string
  societyName: string
  projectCount: number
  totalUnits: number
  soldUnits: number
  totalValue: number
}

export interface PriceRangeAnalysis {
  priceRange: string
  minPrice: number
  maxPrice: number
  count: number
  percentage: number
  averagePrice: number
}

export interface CategoryAnalysis {
  category: string
  amount: number
  count: number
  percentage: number
  average: number
}

export interface UserPerformanceSummary {
  userId: string
  userName: string
  role: string
  score: number
  rank: number
  leadsCount: number
  salesCount: number
  revenue: number
}

export interface GenerateReportRequest {
  reportType: string
  format: string
  dateFrom?: string
  dateTo?: string
  filters?: Record<string, any>
  columns?: string[]
  groupBy?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  includeCharts?: boolean
  title?: string
  description?: string
}

export interface ExportDataRequest {
  entityType: string
  format: string
  filters?: Record<string, any>
  columns?: string[]
  dateFrom?: string
  dateTo?: string
  includeRelated?: boolean
}

// Analytics Service
export class AnalyticsService {
  private baseUrl = '/api/analytics'

  // Dashboard Analytics
  async getDashboardStats(userId?: string): Promise<DashboardStats> {
    const params = userId ? { user_id: userId } : {}
    const response = await apiClient.get(`${this.baseUrl}/dashboard`, { params })
    return response.data.data
  }

  // Sales Analytics
  async getSalesAnalytics(filters: Record<string, any> = {}): Promise<SalesAnalytics> {
    const response = await apiClient.get(`${this.baseUrl}/sales`, { params: filters })
    return response.data.data
  }

  // Lead Analytics
  async getLeadAnalytics(filters: Record<string, any> = {}): Promise<LeadAnalytics> {
    const response = await apiClient.get(`${this.baseUrl}/leads`, { params: filters })
    return response.data.data
  }

  // Property Analytics
  async getPropertyAnalytics(filters: Record<string, any> = {}): Promise<PropertyAnalytics> {
    const response = await apiClient.get(`${this.baseUrl}/properties`, { params: filters })
    return response.data.data
  }

  // Financial Analytics
  async getFinancialAnalytics(filters: Record<string, any> = {}): Promise<FinancialAnalytics> {
    const response = await apiClient.get(`${this.baseUrl}/financial`, { params: filters })
    return response.data.data
  }

  // User Performance
  async getUserPerformance(userId: string, period: string = 'month'): Promise<UserPerformance> {
    const response = await apiClient.get(`${this.baseUrl}/user-performance/${userId}`, {
      params: { period }
    })
    return response.data.data
  }

  // Report Generation
  async generateReport(request: GenerateReportRequest): Promise<Blob> {
    const response = await apiClient.post(`${this.baseUrl}/reports/generate`, request, {
      responseType: 'blob'
    })
    return response.data
  }

  // Data Export
  async exportData(request: ExportDataRequest): Promise<Blob> {
    const response = await apiClient.post(`${this.baseUrl}/export`, request, {
      responseType: 'blob'
    })
    return response.data
  }

  // Utility methods for downloading files
  downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Generate and download report
  async generateAndDownloadReport(request: GenerateReportRequest): Promise<void> {
    try {
      const blob = await this.generateReport(request)
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${request.reportType}_report_${timestamp}.${request.format}`
      this.downloadFile(blob, filename)
    } catch (error) {
      console.error('Failed to generate report:', error)
      throw error
    }
  }

  // Export and download data
  async exportAndDownloadData(request: ExportDataRequest): Promise<void> {
    try {
      const blob = await this.exportData(request)
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${request.entityType}_export_${timestamp}.${request.format}`
      this.downloadFile(blob, filename)
    } catch (error) {
      console.error('Failed to export data:', error)
      throw error
    }
  }
}

// Create and export service instance
export const analyticsService = new AnalyticsService()
export default analyticsService
