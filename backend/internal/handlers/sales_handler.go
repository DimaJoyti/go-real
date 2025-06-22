package handlers

import (
	"net/http"
	"strconv"

	"goreal-backend/internal/domain"
	"goreal-backend/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

var salesTracer = otel.Tracer("goreal-backend/handlers/sales")

// SalesHandler handles sales-related HTTP requests
type SalesHandler struct {
	salesService domain.SalesService
}

// NewSalesHandler creates a new sales handler
func NewSalesHandler(salesService domain.SalesService) *SalesHandler {
	return &SalesHandler{
		salesService: salesService,
	}
}

// RegisterRoutes registers sales routes
func (h *SalesHandler) RegisterRoutes(router *gin.RouterGroup) {
	sales := router.Group("/sales")
	{
		sales.GET("", h.ListSales)
		sales.POST("", h.CreateSale)
		sales.GET("/:id", h.GetSale)
		sales.PUT("/:id", h.UpdateSale)
		sales.DELETE("/:id", h.DeleteSale)
		sales.POST("/:id/approve", h.ApproveSale)
		sales.POST("/:id/reject", h.RejectSale)
		sales.GET("/:id/payments", h.GetSalePayments)
		sales.POST("/:id/payments", h.CreateSalePayment)
		sales.GET("/:id/documents", h.GetSaleDocuments)
		sales.POST("/:id/documents", h.UploadSaleDocument)
		sales.GET("/stats", h.GetSalesStats)
		sales.GET("/commission/:employee_id", h.GetEmployeeCommission)
		sales.POST("/bulk-approve", h.BulkApproveSales)
	}
}

// CreateSale creates a new sale
func (h *SalesHandler) CreateSale(c *gin.Context) {
	ctx, span := salesTracer.Start(c.Request.Context(), "salesHandler.CreateSale")
	defer span.End()

	var req domain.CreateSaleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Get current user from context
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	// Set salesperson if not specified
	if req.SalespersonID == nil {
		req.SalespersonID = &user.ID
	}

	sale, err := h.salesService.Create(ctx, &req)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to create sale",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("sale.id", sale.ID.String()),
		attribute.Float64("sale.amount", sale.TotalAmount),
	)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Sale created successfully",
		"data": sale,
	})
}

// GetSale retrieves a sale by ID
func (h *SalesHandler) GetSale(c *gin.Context) {
	ctx, span := salesTracer.Start(c.Request.Context(), "salesHandler.GetSale")
	defer span.End()

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid sale ID",
		})
		return
	}

	sale, err := h.salesService.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Sale not found",
		})
		return
	}

	span.SetAttributes(attribute.String("sale.id", id.String()))

	c.JSON(http.StatusOK, gin.H{
		"data": sale,
	})
}

// UpdateSale updates an existing sale
func (h *SalesHandler) UpdateSale(c *gin.Context) {
	ctx, span := salesTracer.Start(c.Request.Context(), "salesHandler.UpdateSale")
	defer span.End()

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid sale ID",
		})
		return
	}

	var req domain.UpdateSaleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	sale, err := h.salesService.Update(ctx, id, &req)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to update sale",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(attribute.String("sale.id", id.String()))

	c.JSON(http.StatusOK, gin.H{
		"message": "Sale updated successfully",
		"data": sale,
	})
}

// DeleteSale deletes a sale
func (h *SalesHandler) DeleteSale(c *gin.Context) {
	ctx, span := salesTracer.Start(c.Request.Context(), "salesHandler.DeleteSale")
	defer span.End()

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid sale ID",
		})
		return
	}

	if err := h.salesService.Delete(ctx, id); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete sale",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(attribute.String("sale.id", id.String()))

	c.JSON(http.StatusOK, gin.H{
		"message": "Sale deleted successfully",
	})
}

// ListSales lists sales with filtering and pagination
func (h *SalesHandler) ListSales(c *gin.Context) {
	ctx, span := salesTracer.Start(c.Request.Context(), "salesHandler.ListSales")
	defer span.End()

	// Parse query parameters
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

	if search := c.Query("search"); search != "" {
		filters.Search = &search
	}

	// Parse pagination
	if limitStr := c.Query("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 {
			filters.Limit = limit
		}
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil && offset >= 0 {
			filters.Offset = offset
		}
	}

	// Get sales
	sales, err := h.salesService.List(ctx, filters)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve sales",
			"details": err.Error(),
		})
		return
	}

	// For now, we'll use the length of sales as total
	// In a real implementation, we'd need a Count method in the service
	total := len(sales)

	span.SetAttributes(
		attribute.Int("sales.count", len(sales)),
		attribute.Int("sales.total", total),
	)

	c.JSON(http.StatusOK, gin.H{
		"data": sales,
		"pagination": gin.H{
			"total": total,
			"count": len(sales),
			"limit": filters.Limit,
			"offset": filters.Offset,
		},
	})
}

// ApproveSale approves a sale
func (h *SalesHandler) ApproveSale(c *gin.Context) {
	ctx, span := salesTracer.Start(c.Request.Context(), "salesHandler.ApproveSale")
	defer span.End()

	idStr := c.Param("id")
	saleID, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid sale ID",
		})
		return
	}

	var req struct {
		Notes string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Get current user from context
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	if err := h.salesService.ApproveSale(ctx, saleID, user.ID); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to approve sale",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("sale.id", saleID.String()),
		attribute.String("approved_by", user.ID.String()),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Sale approved successfully",
	})
}

// RejectSale rejects a sale
func (h *SalesHandler) RejectSale(c *gin.Context) {
	ctx, span := salesTracer.Start(c.Request.Context(), "salesHandler.RejectSale")
	defer span.End()

	idStr := c.Param("id")
	saleID, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid sale ID",
		})
		return
	}

	var req struct {
		Reason string `json:"reason" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Get current user from context
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	if err := h.salesService.CancelSale(ctx, saleID, req.Reason); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to reject sale",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("sale.id", saleID.String()),
		attribute.String("rejected_by", user.ID.String()),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Sale rejected successfully",
	})
}

// GetSalesStats gets sales statistics
func (h *SalesHandler) GetSalesStats(c *gin.Context) {
	ctx, span := salesTracer.Start(c.Request.Context(), "salesHandler.GetSalesStats")
	defer span.End()

	// Parse query parameters for date range
	filters := domain.SaleFilters{}

	stats, err := h.salesService.GetSalesStats(ctx, filters)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve sales statistics",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": stats,
	})
}

// Placeholder handlers for additional functionality
func (h *SalesHandler) GetSalePayments(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"data": []interface{}{}, "message": "Payments retrieved"})
}

func (h *SalesHandler) CreateSalePayment(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Payment creation not yet implemented"})
}

func (h *SalesHandler) GetSaleDocuments(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"data": []interface{}{}, "message": "Documents retrieved"})
}

func (h *SalesHandler) UploadSaleDocument(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Document upload not yet implemented"})
}

func (h *SalesHandler) GetEmployeeCommission(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"data": []interface{}{}, "message": "Commission retrieved"})
}

func (h *SalesHandler) BulkApproveSales(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Bulk approval not yet implemented"})
}
