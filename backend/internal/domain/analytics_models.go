package domain

import (
	"time"
	"github.com/google/uuid"
)

// DashboardStats represents overall dashboard statistics
type DashboardStats struct {
	// Overview metrics
	TotalUsers       int     `json:"total_users"`
	TotalLeads       int     `json:"total_leads"`
	TotalClients     int     `json:"total_clients"`
	TotalSales       int     `json:"total_sales"`
	TotalRevenue     float64 `json:"total_revenue"`
	TotalProperties  int     `json:"total_properties"`
	TotalTasks       int     `json:"total_tasks"`
	
	// Growth metrics
	NewLeadsToday       int     `json:"new_leads_today"`
	NewClientsToday     int     `json:"new_clients_today"`
	SalesToday          int     `json:"sales_today"`
	RevenueToday        float64 `json:"revenue_today"`
	TasksCompletedToday int     `json:"tasks_completed_today"`
	
	// Performance metrics
	LeadConversionRate  float64 `json:"lead_conversion_rate"`
	AverageSaleValue    float64 `json:"average_sale_value"`
	AverageLeadScore    float64 `json:"average_lead_score"`
	TaskCompletionRate  float64 `json:"task_completion_rate"`
	
	// Monthly comparisons
	MonthlyGrowth       float64 `json:"monthly_growth"`
	RevenueGrowth       float64 `json:"revenue_growth"`
	LeadGrowth          float64 `json:"lead_growth"`
	ClientGrowth        float64 `json:"client_growth"`
	
	// Recent activity
	RecentLeads         []Lead  `json:"recent_leads"`
	RecentSales         []Sale  `json:"recent_sales"`
	OverdueTasks        []Task  `json:"overdue_tasks"`
	TopPerformers       []UserPerformanceSummary `json:"top_performers"`
	
	LastUpdated         time.Time `json:"last_updated"`
}

// SalesAnalytics represents sales performance analytics
type SalesAnalytics struct {
	// Overall metrics
	TotalSales          int     `json:"total_sales"`
	TotalRevenue        float64 `json:"total_revenue"`
	AverageSaleValue    float64 `json:"average_sale_value"`
	MedianSaleValue     float64 `json:"median_sale_value"`
	
	// Status breakdown
	PendingSales        int     `json:"pending_sales"`
	ApprovedSales       int     `json:"approved_sales"`
	CompletedSales      int     `json:"completed_sales"`
	CancelledSales      int     `json:"cancelled_sales"`
	
	// Time-based metrics
	DailyRevenue        []TimeSeriesData    `json:"daily_revenue"`
	WeeklyRevenue       []TimeSeriesData    `json:"weekly_revenue"`
	MonthlyRevenue      []TimeSeriesData    `json:"monthly_revenue"`
	QuarterlyRevenue    []TimeSeriesData    `json:"quarterly_revenue"`
	YearlyRevenue       []TimeSeriesData    `json:"yearly_revenue"`
	
	// Performance metrics
	SalesByEmployee     []EmployeePerformance `json:"sales_by_employee"`
	SalesByProperty     []PropertyPerformance `json:"sales_by_property"`
	SalesBySource       []SourcePerformance   `json:"sales_by_source"`
	
	// Conversion metrics
	LeadToSaleConversion float64 `json:"lead_to_sale_conversion"`
	AverageSaleCycle     float64 `json:"average_sale_cycle"` // in days
	
	// Commission metrics
	TotalCommissions    float64 `json:"total_commissions"`
	PaidCommissions     float64 `json:"paid_commissions"`
	PendingCommissions  float64 `json:"pending_commissions"`
	
	// Forecasting
	ProjectedRevenue    float64 `json:"projected_revenue"`
	PipelineValue       float64 `json:"pipeline_value"`
	
	Period              string    `json:"period"`
	GeneratedAt         time.Time `json:"generated_at"`
}

// LeadAnalytics represents lead performance analytics
type LeadAnalytics struct {
	// Overall metrics
	TotalLeads          int     `json:"total_leads"`
	NewLeads            int     `json:"new_leads"`
	QualifiedLeads      int     `json:"qualified_leads"`
	ConvertedLeads      int     `json:"converted_leads"`
	LostLeads           int     `json:"lost_leads"`
	
	// Conversion metrics
	ConversionRate      float64 `json:"conversion_rate"`
	QualificationRate   float64 `json:"qualification_rate"`
	AverageLeadScore    float64 `json:"average_lead_score"`
	AverageResponseTime float64 `json:"average_response_time"` // in hours
	
	// Source analysis
	LeadsBySource       []SourcePerformance `json:"leads_by_source"`
	SourceConversion    []SourceConversion  `json:"source_conversion"`
	
	// Status distribution
	LeadsByStatus       []StatusDistribution `json:"leads_by_status"`
	StatusProgression   []StatusProgression  `json:"status_progression"`
	
	// Time-based metrics
	DailyLeads          []TimeSeriesData `json:"daily_leads"`
	WeeklyLeads         []TimeSeriesData `json:"weekly_leads"`
	MonthlyLeads        []TimeSeriesData `json:"monthly_leads"`
	
	// Performance metrics
	LeadsByEmployee     []EmployeePerformance `json:"leads_by_employee"`
	LeadsByScore        []ScoreDistribution   `json:"leads_by_score"`
	
	// Follow-up metrics
	OverdueFollowUps    int     `json:"overdue_follow_ups"`
	ScheduledFollowUps  int     `json:"scheduled_follow_ups"`
	AverageFollowUpTime float64 `json:"average_follow_up_time"` // in days
	
	Period              string    `json:"period"`
	GeneratedAt         time.Time `json:"generated_at"`
}

// PropertyAnalytics represents property and inventory analytics
type PropertyAnalytics struct {
	// Overall metrics
	TotalProperties     int     `json:"total_properties"`
	AvailableUnits      int     `json:"available_units"`
	SoldUnits           int     `json:"sold_units"`
	ReservedUnits       int     `json:"reserved_units"`
	TotalInventoryValue float64 `json:"total_inventory_value"`
	
	// Performance metrics
	AveragePropertyValue float64 `json:"average_property_value"`
	InventoryTurnover    float64 `json:"inventory_turnover"`
	AverageSaleTime      float64 `json:"average_sale_time"` // in days
	
	// Type distribution
	PropertiesByType    []TypeDistribution    `json:"properties_by_type"`
	SalesByType         []TypePerformance     `json:"sales_by_type"`
	
	// Location analysis
	PropertiesByLocation []LocationPerformance `json:"properties_by_location"`
	SalesByLocation      []LocationPerformance `json:"sales_by_location"`
	
	// Project analysis
	ProjectPerformance   []ProjectPerformance  `json:"project_performance"`
	SocietyPerformance   []SocietyPerformance  `json:"society_performance"`
	
	// Price analysis
	PriceRanges         []PriceRangeAnalysis  `json:"price_ranges"`
	PriceTrends         []TimeSeriesData      `json:"price_trends"`
	
	// Availability trends
	AvailabilityTrends  []TimeSeriesData      `json:"availability_trends"`
	ReservationTrends   []TimeSeriesData      `json:"reservation_trends"`
	
	Period              string    `json:"period"`
	GeneratedAt         time.Time `json:"generated_at"`
}

// FinancialAnalytics represents financial performance analytics
type FinancialAnalytics struct {
	// Overall metrics
	TotalIncome         float64 `json:"total_income"`
	TotalExpense        float64 `json:"total_expense"`
	NetProfit           float64 `json:"net_profit"`
	ProfitMargin        float64 `json:"profit_margin"`
	
	// Cash flow
	CashInflow          float64 `json:"cash_inflow"`
	CashOutflow         float64 `json:"cash_outflow"`
	NetCashFlow         float64 `json:"net_cash_flow"`
	
	// Time-based metrics
	DailyRevenue        []TimeSeriesData `json:"daily_revenue"`
	MonthlyRevenue      []TimeSeriesData `json:"monthly_revenue"`
	QuarterlyRevenue    []TimeSeriesData `json:"quarterly_revenue"`
	
	// Category analysis
	IncomeByCategory    []CategoryAnalysis `json:"income_by_category"`
	ExpenseByCategory   []CategoryAnalysis `json:"expense_by_category"`
	
	// Payment analysis
	PendingPayments     float64 `json:"pending_payments"`
	OverduePayments     float64 `json:"overdue_payments"`
	CollectionRate      float64 `json:"collection_rate"`
	
	// Commission analysis
	TotalCommissions    float64 `json:"total_commissions"`
	PaidCommissions     float64 `json:"paid_commissions"`
	PendingCommissions  float64 `json:"pending_commissions"`
	
	// Voucher analysis
	PendingVouchers     int     `json:"pending_vouchers"`
	ApprovedVouchers    int     `json:"approved_vouchers"`
	RejectedVouchers    int     `json:"rejected_vouchers"`
	
	Period              string    `json:"period"`
	GeneratedAt         time.Time `json:"generated_at"`
}

// UserPerformance represents individual user performance metrics
type UserPerformance struct {
	UserID              uuid.UUID `json:"user_id"`
	UserName            string    `json:"user_name"`
	Role                UserRole  `json:"role"`
	
	// Lead metrics
	TotalLeads          int     `json:"total_leads"`
	QualifiedLeads      int     `json:"qualified_leads"`
	ConvertedLeads      int     `json:"converted_leads"`
	LeadConversionRate  float64 `json:"lead_conversion_rate"`
	AverageLeadScore    float64 `json:"average_lead_score"`
	
	// Sales metrics
	TotalSales          int     `json:"total_sales"`
	TotalRevenue        float64 `json:"total_revenue"`
	AverageSaleValue    float64 `json:"average_sale_value"`
	CommissionEarned    float64 `json:"commission_earned"`
	
	// Task metrics
	TotalTasks          int     `json:"total_tasks"`
	CompletedTasks      int     `json:"completed_tasks"`
	OverdueTasks        int     `json:"overdue_tasks"`
	TaskCompletionRate  float64 `json:"task_completion_rate"`
	AverageTaskTime     float64 `json:"average_task_time"` // in hours
	
	// Activity metrics
	LoginDays           int     `json:"login_days"`
	ActiveDays          int     `json:"active_days"`
	LastLoginDate       *time.Time `json:"last_login_date"`
	
	// Performance ranking
	LeadRank            int     `json:"lead_rank"`
	SalesRank           int     `json:"sales_rank"`
	OverallRank         int     `json:"overall_rank"`
	
	// Trends
	PerformanceTrend    []TimeSeriesData `json:"performance_trend"`
	
	Period              string    `json:"period"`
	GeneratedAt         time.Time `json:"generated_at"`
}

// Supporting types for analytics

// TimeSeriesData represents time-based data points
type TimeSeriesData struct {
	Date   time.Time `json:"date"`
	Value  float64   `json:"value"`
	Count  int       `json:"count,omitempty"`
	Label  string    `json:"label,omitempty"`
}

// EmployeePerformance represents employee performance metrics
type EmployeePerformance struct {
	UserID       uuid.UUID `json:"user_id"`
	UserName     string    `json:"user_name"`
	Role         UserRole  `json:"role"`
	Count        int       `json:"count"`
	Value        float64   `json:"value"`
	Percentage   float64   `json:"percentage"`
	Rank         int       `json:"rank"`
}

// PropertyPerformance represents property performance metrics
type PropertyPerformance struct {
	PropertyID   uuid.UUID `json:"property_id"`
	PropertyName string    `json:"property_name"`
	PropertyType string    `json:"property_type"`
	SalesCount   int       `json:"sales_count"`
	TotalValue   float64   `json:"total_value"`
	AverageValue float64   `json:"average_value"`
}

// SourcePerformance represents source performance metrics
type SourcePerformance struct {
	Source       string  `json:"source"`
	Count        int     `json:"count"`
	Value        float64 `json:"value,omitempty"`
	Percentage   float64 `json:"percentage"`
	Conversion   float64 `json:"conversion,omitempty"`
}

// SourceConversion represents conversion metrics by source
type SourceConversion struct {
	Source         string  `json:"source"`
	TotalLeads     int     `json:"total_leads"`
	ConvertedLeads int     `json:"converted_leads"`
	ConversionRate float64 `json:"conversion_rate"`
	AverageScore   float64 `json:"average_score"`
}

// StatusDistribution represents distribution by status
type StatusDistribution struct {
	Status     string  `json:"status"`
	Count      int     `json:"count"`
	Percentage float64 `json:"percentage"`
	Value      float64 `json:"value,omitempty"`
}

// StatusProgression represents progression between statuses
type StatusProgression struct {
	FromStatus string  `json:"from_status"`
	ToStatus   string  `json:"to_status"`
	Count      int     `json:"count"`
	AverageTime float64 `json:"average_time"` // in days
}

// ScoreDistribution represents distribution by score ranges
type ScoreDistribution struct {
	ScoreRange string  `json:"score_range"`
	Count      int     `json:"count"`
	Percentage float64 `json:"percentage"`
	MinScore   int     `json:"min_score"`
	MaxScore   int     `json:"max_score"`
}

// TypeDistribution represents distribution by type
type TypeDistribution struct {
	Type       string  `json:"type"`
	Count      int     `json:"count"`
	Percentage float64 `json:"percentage"`
	Value      float64 `json:"value,omitempty"`
}

// TypePerformance represents performance metrics by type
type TypePerformance struct {
	Type         string  `json:"type"`
	SalesCount   int     `json:"sales_count"`
	TotalValue   float64 `json:"total_value"`
	AverageValue float64 `json:"average_value"`
	Percentage   float64 `json:"percentage"`
}

// LocationPerformance represents performance metrics by location
type LocationPerformance struct {
	Location     string  `json:"location"`
	Count        int     `json:"count"`
	TotalValue   float64 `json:"total_value"`
	AverageValue float64 `json:"average_value"`
	Percentage   float64 `json:"percentage"`
}

// ProjectPerformance represents project performance metrics
type ProjectPerformance struct {
	ProjectID    uuid.UUID `json:"project_id"`
	ProjectName  string    `json:"project_name"`
	TotalUnits   int       `json:"total_units"`
	SoldUnits    int       `json:"sold_units"`
	AvailableUnits int     `json:"available_units"`
	SalesValue   float64   `json:"sales_value"`
	SalesRate    float64   `json:"sales_rate"`
}

// SocietyPerformance represents society performance metrics
type SocietyPerformance struct {
	SocietyID    uuid.UUID `json:"society_id"`
	SocietyName  string    `json:"society_name"`
	ProjectCount int       `json:"project_count"`
	TotalUnits   int       `json:"total_units"`
	SoldUnits    int       `json:"sold_units"`
	TotalValue   float64   `json:"total_value"`
}

// PriceRangeAnalysis represents analysis by price ranges
type PriceRangeAnalysis struct {
	PriceRange   string  `json:"price_range"`
	MinPrice     float64 `json:"min_price"`
	MaxPrice     float64 `json:"max_price"`
	Count        int     `json:"count"`
	Percentage   float64 `json:"percentage"`
	AveragePrice float64 `json:"average_price"`
}

// CategoryAnalysis represents analysis by category
type CategoryAnalysis struct {
	Category   string  `json:"category"`
	Amount     float64 `json:"amount"`
	Count      int     `json:"count"`
	Percentage float64 `json:"percentage"`
	Average    float64 `json:"average"`
}

// UserPerformanceSummary represents a summary of user performance
type UserPerformanceSummary struct {
	UserID       uuid.UUID `json:"user_id"`
	UserName     string    `json:"user_name"`
	Role         UserRole  `json:"role"`
	Score        float64   `json:"score"`
	Rank         int       `json:"rank"`
	LeadsCount   int       `json:"leads_count"`
	SalesCount   int       `json:"sales_count"`
	Revenue      float64   `json:"revenue"`
}

// GenerateReportRequest represents a request to generate a custom report
type GenerateReportRequest struct {
	ReportType   string                 `json:"report_type" binding:"required"`
	Format       string                 `json:"format" binding:"required"` // pdf, excel, csv
	DateFrom     *time.Time             `json:"date_from"`
	DateTo       *time.Time             `json:"date_to"`
	Filters      map[string]interface{} `json:"filters"`
	Columns      []string               `json:"columns"`
	GroupBy      []string               `json:"group_by"`
	SortBy       string                 `json:"sort_by"`
	SortOrder    string                 `json:"sort_order"` // asc, desc
	IncludeCharts bool                  `json:"include_charts"`
	Title        string                 `json:"title"`
	Description  string                 `json:"description"`
}

// ExportDataRequest represents a request to export data
type ExportDataRequest struct {
	EntityType   string                 `json:"entity_type" binding:"required"` // leads, clients, sales, etc.
	Format       string                 `json:"format" binding:"required"`      // excel, csv, json
	Filters      map[string]interface{} `json:"filters"`
	Columns      []string               `json:"columns"`
	DateFrom     *time.Time             `json:"date_from"`
	DateTo       *time.Time             `json:"date_to"`
	IncludeRelated bool                 `json:"include_related"`
}
