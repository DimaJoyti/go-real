package handlers

import (
	"net/http"
	"time"

	"goreal-backend/internal/domain"
	"goreal-backend/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

var analyticsTracer = otel.Tracer("goreal-backend/handlers/analytics")

// AnalyticsHandler handles analytics and reporting HTTP requests
type AnalyticsHandler struct {
	analyticsService domain.AnalyticsService
}

// NewAnalyticsHandler creates a new analytics handler
func NewAnalyticsHandler(analyticsService domain.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{
		analyticsService: analyticsService,
	}
}

// RegisterRoutes registers analytics routes
func (h *AnalyticsHandler) RegisterRoutes(router *gin.RouterGroup) {
	analytics := router.Group("/analytics")
	{
		analytics.GET("/dashboard", h.GetDashboardStats)
		analytics.GET("/sales", h.GetSalesAnalytics)
		analytics.GET("/leads", h.GetLeadAnalytics)
		analytics.GET("/properties", h.GetPropertyAnalytics)
		analytics.GET("/financial", h.GetFinancialAnalytics)
		analytics.GET("/user-performance/:user_id", h.GetUserPerformance)
		analytics.POST("/reports/generate", h.GenerateReport)
		analytics.POST("/export", h.ExportData)
	}
}

// GetDashboardStats retrieves dashboard statistics
func (h *AnalyticsHandler) GetDashboardStats(c *gin.Context) {
	ctx, span := analyticsTracer.Start(c.Request.Context(), "analyticsHandler.GetDashboardStats")
	defer span.End()

	// Get current user from context
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	stats, err := h.analyticsService.GetDashboardStats(ctx, user.ID)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve dashboard statistics",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(attribute.String("user.id", user.ID.String()))

	c.JSON(http.StatusOK, gin.H{
		"data": stats,
	})
}

// GetSalesAnalytics retrieves sales analytics
func (h *AnalyticsHandler) GetSalesAnalytics(c *gin.Context) {
	ctx, span := analyticsTracer.Start(c.Request.Context(), "analyticsHandler.GetSalesAnalytics")
	defer span.End()

	// Parse query parameters for filters
	filters := domain.SaleFilters{}

	if status := c.Query("status"); status != "" {
		saleStatus := domain.SaleStatus(status)
		filters.Status = &saleStatus
	}

	if clientID := c.Query("client_id"); clientID != "" {
		if id, err := uuid.Parse(clientID); err == nil {
			filters.ClientID = &id
		}
	}

	if salespersonID := c.Query("salesperson_id"); salespersonID != "" {
		if id, err := uuid.Parse(salespersonID); err == nil {
			filters.SalespersonID = &id
		}
	}

	if dateFrom := c.Query("date_from"); dateFrom != "" {
		if parsedDate, err := time.Parse("2006-01-02", dateFrom); err == nil {
			filters.SaleDateFrom = &parsedDate
		}
	}

	if dateTo := c.Query("date_to"); dateTo != "" {
		if parsedDate, err := time.Parse("2006-01-02", dateTo); err == nil {
			filters.SaleDateTo = &parsedDate
		}
	}

	analytics, err := h.analyticsService.GetSalesAnalytics(ctx, filters)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve sales analytics",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": analytics,
	})
}

// GetLeadAnalytics retrieves lead analytics
func (h *AnalyticsHandler) GetLeadAnalytics(c *gin.Context) {
	ctx, span := analyticsTracer.Start(c.Request.Context(), "analyticsHandler.GetLeadAnalytics")
	defer span.End()

	// Parse query parameters for filters
	filters := domain.LeadFilters{}

	if status := c.Query("status"); status != "" {
		leadStatus := domain.LeadStatus(status)
		filters.Status = &leadStatus
	}

	if source := c.Query("source"); source != "" {
		leadSource := domain.LeadSource(source)
		filters.Source = &leadSource
	}

	if assignedTo := c.Query("assigned_to"); assignedTo != "" {
		if id, err := uuid.Parse(assignedTo); err == nil {
			filters.AssignedTo = &id
		}
	}

	if dateFrom := c.Query("date_from"); dateFrom != "" {
		if parsedDate, err := time.Parse("2006-01-02", dateFrom); err == nil {
			filters.CreatedAfter = &parsedDate
		}
	}

	if dateTo := c.Query("date_to"); dateTo != "" {
		if parsedDate, err := time.Parse("2006-01-02", dateTo); err == nil {
			filters.CreatedBefore = &parsedDate
		}
	}

	analytics, err := h.analyticsService.GetLeadAnalytics(ctx, filters)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve lead analytics",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": analytics,
	})
}

// GetPropertyAnalytics retrieves property analytics
func (h *AnalyticsHandler) GetPropertyAnalytics(c *gin.Context) {
	ctx, span := analyticsTracer.Start(c.Request.Context(), "analyticsHandler.GetPropertyAnalytics")
	defer span.End()

	// Parse query parameters for filters
	filters := domain.InventoryFilters{}

	if projectID := c.Query("project_id"); projectID != "" {
		if id, err := uuid.Parse(projectID); err == nil {
			filters.ProjectID = &id
		}
	}

	if status := c.Query("status"); status != "" {
		unitStatus := domain.UnitStatus(status)
		filters.Status = &unitStatus
	}

	if unitType := c.Query("unit_type"); unitType != "" {
		filters.UnitType = &unitType
	}

	analytics, err := h.analyticsService.GetPropertyAnalytics(ctx, filters)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve property analytics",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": analytics,
	})
}

// GetFinancialAnalytics retrieves financial analytics
func (h *AnalyticsHandler) GetFinancialAnalytics(c *gin.Context) {
	ctx, span := analyticsTracer.Start(c.Request.Context(), "analyticsHandler.GetFinancialAnalytics")
	defer span.End()

	// Parse query parameters for filters
	filters := domain.CashbookFilters{}

	if transactionType := c.Query("transaction_type"); transactionType != "" {
		txType := domain.TransactionType(transactionType)
		filters.TransactionType = &txType
	}

	if category := c.Query("category"); category != "" {
		filters.Category = &category
	}

	if dateFrom := c.Query("date_from"); dateFrom != "" {
		if parsedDate, err := time.Parse("2006-01-02", dateFrom); err == nil {
			filters.DateFrom = &parsedDate
		}
	}

	if dateTo := c.Query("date_to"); dateTo != "" {
		if parsedDate, err := time.Parse("2006-01-02", dateTo); err == nil {
			filters.DateTo = &parsedDate
		}
	}

	analytics, err := h.analyticsService.GetFinancialAnalytics(ctx, filters)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve financial analytics",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": analytics,
	})
}

// GetUserPerformance retrieves user performance analytics
func (h *AnalyticsHandler) GetUserPerformance(c *gin.Context) {
	ctx, span := analyticsTracer.Start(c.Request.Context(), "analyticsHandler.GetUserPerformance")
	defer span.End()

	userIDStr := c.Param("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	period := c.Query("period")
	if period == "" {
		period = "month" // default to monthly
	}

	performance, err := h.analyticsService.GetUserPerformance(ctx, userID, period)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve user performance",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("user.id", userID.String()),
		attribute.String("period", period),
	)

	c.JSON(http.StatusOK, gin.H{
		"data": performance,
	})
}

// GenerateReport generates a custom report
func (h *AnalyticsHandler) GenerateReport(c *gin.Context) {
	ctx, span := analyticsTracer.Start(c.Request.Context(), "analyticsHandler.GenerateReport")
	defer span.End()

	var req domain.GenerateReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	reportData, err := h.analyticsService.GenerateReport(ctx, &req)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate report",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("report.type", req.ReportType),
		attribute.String("report.format", req.Format),
	)

	// Set appropriate content type based on format
	switch req.Format {
	case "pdf":
		c.Header("Content-Type", "application/pdf")
		c.Header("Content-Disposition", "attachment; filename=report.pdf")
	case "excel":
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		c.Header("Content-Disposition", "attachment; filename=report.xlsx")
	case "csv":
		c.Header("Content-Type", "text/csv")
		c.Header("Content-Disposition", "attachment; filename=report.csv")
	default:
		c.Header("Content-Type", "application/json")
	}

	c.Data(http.StatusOK, c.GetHeader("Content-Type"), reportData)
}

// ExportData exports data in various formats
func (h *AnalyticsHandler) ExportData(c *gin.Context) {
	ctx, span := analyticsTracer.Start(c.Request.Context(), "analyticsHandler.ExportData")
	defer span.End()

	var req domain.ExportDataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	exportData, err := h.analyticsService.ExportData(ctx, &req)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to export data",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("export.entity", req.EntityType),
		attribute.String("export.format", req.Format),
	)

	// Set appropriate content type based on format
	switch req.Format {
	case "excel":
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		c.Header("Content-Disposition", "attachment; filename=export.xlsx")
	case "csv":
		c.Header("Content-Type", "text/csv")
		c.Header("Content-Disposition", "attachment; filename=export.csv")
	default:
		c.Header("Content-Type", "application/json")
	}

	c.Data(http.StatusOK, c.GetHeader("Content-Type"), exportData)
}

// Machine Learning and Predictive Analytics Handlers
// TODO: Implement ML services when available
