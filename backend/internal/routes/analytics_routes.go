package routes

import (
	"goreal-backend/internal/domain"
	"goreal-backend/internal/handlers"

	"github.com/gin-gonic/gin"
)

// RegisterAnalyticsRoutes registers all analytics-related routes
func RegisterAnalyticsRoutes(
	router *gin.Engine,
	analyticsHandler *handlers.AnalyticsHandler,
	authMiddleware gin.HandlerFunc,
	roleMiddleware func(roles ...domain.UserRole) gin.HandlerFunc,
) {
	// Analytics routes group
	analyticsGroup := router.Group("/api/analytics")
	analyticsGroup.Use(authMiddleware)

	// Dashboard analytics - accessible to managers and above
	analyticsGroup.GET("/dashboard",
		roleMiddleware(domain.RoleManager, domain.RoleAdmin, domain.RoleSuperAdmin),
		analyticsHandler.GetDashboardStats,
	)

	// Sales analytics - accessible to managers and above
	analyticsGroup.GET("/sales",
		roleMiddleware(domain.RoleManager, domain.RoleAdmin, domain.RoleSuperAdmin),
		analyticsHandler.GetSalesAnalytics,
	)

	// Lead analytics - accessible to employees and above
	analyticsGroup.GET("/leads",
		roleMiddleware(domain.RoleEmployee, domain.RoleManager, domain.RoleAdmin, domain.RoleSuperAdmin),
		analyticsHandler.GetLeadAnalytics,
	)

	// Property analytics - accessible to managers and above
	analyticsGroup.GET("/properties",
		roleMiddleware(domain.RoleManager, domain.RoleAdmin, domain.RoleSuperAdmin),
		analyticsHandler.GetPropertyAnalytics,
	)

	// Financial analytics - accessible to managers and above
	analyticsGroup.GET("/financial",
		roleMiddleware(domain.RoleManager, domain.RoleAdmin, domain.RoleSuperAdmin),
		analyticsHandler.GetFinancialAnalytics,
	)

	// User performance analytics
	analyticsGroup.GET("/user-performance/:userId",
		roleMiddleware(domain.RoleEmployee, domain.RoleManager, domain.RoleAdmin, domain.RoleSuperAdmin),
		analyticsHandler.GetUserPerformance,
	)

	// Report generation - accessible to managers and above
	analyticsGroup.POST("/reports/generate",
		roleMiddleware(domain.RoleManager, domain.RoleAdmin, domain.RoleSuperAdmin),
		analyticsHandler.GenerateReport,
	)

	// Data export - accessible to managers and above
	analyticsGroup.POST("/export",
		roleMiddleware(domain.RoleManager, domain.RoleAdmin, domain.RoleSuperAdmin),
		analyticsHandler.ExportData,
	)

	// TODO: Add more analytics endpoints as handlers are implemented
	// The following endpoints will be added when handlers are implemented:
	// - Real-time analytics endpoints (WebSocket, polling)
	// - Analytics configuration endpoints
	// - Analytics alerts and notifications
	// - Analytics benchmarks and comparisons
	// - Analytics data quality and validation
	// - Analytics audit and compliance
	// - Analytics integrations
	// - Analytics machine learning and predictions
	// - Analytics API keys and access management
	// - Analytics health and monitoring
}
