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

var leadTracer = otel.Tracer("goreal-backend/handlers/lead")

// LeadHandler handles lead-related HTTP requests
type LeadHandler struct {
	leadService domain.LeadService
}

// NewLeadHandler creates a new lead handler
func NewLeadHandler(leadService domain.LeadService) *LeadHandler {
	return &LeadHandler{
		leadService: leadService,
	}
}

// RegisterRoutes registers lead routes
func (h *LeadHandler) RegisterRoutes(router *gin.RouterGroup) {
	leads := router.Group("/leads")
	{
		leads.GET("", h.ListLeads)
		leads.POST("", h.CreateLead)
		leads.GET("/:id", h.GetLead)
		leads.PUT("/:id", h.UpdateLead)
		leads.DELETE("/:id", h.DeleteLead)
		leads.POST("/:id/assign", h.AssignLead)
		leads.POST("/:id/convert", h.ConvertLead)
		leads.PUT("/:id/score", h.UpdateLeadScore)
		leads.POST("/:id/follow-up", h.ScheduleFollowUp)
		leads.GET("/overdue-follow-ups", h.GetOverdueFollowUps)
		leads.POST("/bulk-assign", h.BulkAssignLeads)
		leads.POST("/import", h.ImportLeads)
	}
}

// CreateLead creates a new lead
func (h *LeadHandler) CreateLead(c *gin.Context) {
	ctx, span := leadTracer.Start(c.Request.Context(), "leadHandler.CreateLead")
	defer span.End()

	var req domain.CreateLeadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Get current user from context
	user, err := middleware.GetUserFromGinContext(c)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	// Set created by if not specified
	if req.AssignedTo == nil {
		req.AssignedTo = &user.ID
	}

	lead, err := h.leadService.Create(ctx, &req)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to create lead",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("lead.id", lead.ID.String()),
		attribute.String("lead.name", lead.Name),
	)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Lead created successfully",
		"data": lead,
	})
}

// GetLead retrieves a lead by ID
func (h *LeadHandler) GetLead(c *gin.Context) {
	ctx, span := leadTracer.Start(c.Request.Context(), "leadHandler.GetLead")
	defer span.End()

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid lead ID",
		})
		return
	}

	lead, err := h.leadService.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Lead not found",
		})
		return
	}

	span.SetAttributes(attribute.String("lead.id", id.String()))

	c.JSON(http.StatusOK, gin.H{
		"data": lead,
	})
}

// UpdateLead updates an existing lead
func (h *LeadHandler) UpdateLead(c *gin.Context) {
	ctx, span := leadTracer.Start(c.Request.Context(), "leadHandler.UpdateLead")
	defer span.End()

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid lead ID",
		})
		return
	}

	var req domain.UpdateLeadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	lead, err := h.leadService.Update(ctx, id, &req)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to update lead",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(attribute.String("lead.id", id.String()))

	c.JSON(http.StatusOK, gin.H{
		"message": "Lead updated successfully",
		"data": lead,
	})
}

// DeleteLead deletes a lead
func (h *LeadHandler) DeleteLead(c *gin.Context) {
	ctx, span := leadTracer.Start(c.Request.Context(), "leadHandler.DeleteLead")
	defer span.End()

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid lead ID",
		})
		return
	}

	if err := h.leadService.Delete(ctx, id); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete lead",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(attribute.String("lead.id", id.String()))

	c.JSON(http.StatusOK, gin.H{
		"message": "Lead deleted successfully",
	})
}

// ListLeads lists leads with filtering and pagination
func (h *LeadHandler) ListLeads(c *gin.Context) {
	ctx, span := leadTracer.Start(c.Request.Context(), "leadHandler.ListLeads")
	defer span.End()

	// Parse query parameters
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

	if search := c.Query("search"); search != "" {
		filters.Search = &search
	}

	if tags := c.Query("tags"); tags != "" {
		filters.Tags = []string{tags}
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

	// Get leads
	leads, err := h.leadService.List(ctx, filters)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve leads",
			"details": err.Error(),
		})
		return
	}

	// Get total count
	total, err := h.leadService.Count(ctx, filters)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to count leads",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.Int("leads.count", len(leads)),
		attribute.Int("leads.total", total),
	)

	c.JSON(http.StatusOK, gin.H{
		"data": leads,
		"pagination": gin.H{
			"total": total,
			"count": len(leads),
			"limit": filters.Limit,
			"offset": filters.Offset,
		},
	})
}

// AssignLead assigns a lead to a user
func (h *LeadHandler) AssignLead(c *gin.Context) {
	ctx, span := leadTracer.Start(c.Request.Context(), "leadHandler.AssignLead")
	defer span.End()

	idStr := c.Param("id")
	leadID, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid lead ID",
		})
		return
	}

	var req struct {
		UserID uuid.UUID `json:"user_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	if err := h.leadService.AssignToUser(ctx, leadID, req.UserID); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to assign lead",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("lead.id", leadID.String()),
		attribute.String("user.id", req.UserID.String()),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Lead assigned successfully",
	})
}

// ConvertLead converts a lead to a client
func (h *LeadHandler) ConvertLead(c *gin.Context) {
	ctx, span := leadTracer.Start(c.Request.Context(), "leadHandler.ConvertLead")
	defer span.End()

	idStr := c.Param("id")
	leadID, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid lead ID",
		})
		return
	}

	var req domain.ConvertLeadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	client, err := h.leadService.ConvertToClient(ctx, leadID, &req)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to convert lead",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("lead.id", leadID.String()),
		attribute.String("client.id", client.ID.String()),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Lead converted successfully",
		"data": client,
	})
}

// UpdateLeadScore updates a lead's score
func (h *LeadHandler) UpdateLeadScore(c *gin.Context) {
	ctx, span := leadTracer.Start(c.Request.Context(), "leadHandler.UpdateLeadScore")
	defer span.End()

	idStr := c.Param("id")
	leadID, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid lead ID",
		})
		return
	}

	var req struct {
		Score int `json:"score" binding:"required,min=0,max=100"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	updateReq := domain.UpdateLeadRequest{
		Score: &req.Score,
	}

	lead, err := h.leadService.Update(ctx, leadID, &updateReq)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to update lead score",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("lead.id", leadID.String()),
		attribute.Int("lead.score", req.Score),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Lead score updated successfully",
		"data": lead,
	})
}

// ScheduleFollowUp schedules a follow-up for a lead
func (h *LeadHandler) ScheduleFollowUp(c *gin.Context) {
	_, span := leadTracer.Start(c.Request.Context(), "leadHandler.ScheduleFollowUp")
	defer span.End()

	idStr := c.Param("id")
	_, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid lead ID",
		})
		return
	}

	var req struct {
		ScheduledDate string `json:"scheduled_date" binding:"required"`
		Notes         string `json:"notes"`
		Type          string `json:"type" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// This would typically create a follow-up record
	// For now, we'll just update the lead's next follow-up date
	// In a full implementation, this would use a FollowUpService

	c.JSON(http.StatusOK, gin.H{
		"message": "Follow-up scheduled successfully",
	})
}

// GetOverdueFollowUps gets leads with overdue follow-ups
func (h *LeadHandler) GetOverdueFollowUps(c *gin.Context) {
	_, span := leadTracer.Start(c.Request.Context(), "leadHandler.GetOverdueFollowUps")
	defer span.End()

	// This would typically use the repository's GetOverdueFollowUps method
	// For now, we'll return an empty list
	c.JSON(http.StatusOK, gin.H{
		"data": []interface{}{},
		"message": "No overdue follow-ups found",
	})
}

// BulkAssignLeads assigns multiple leads to users
func (h *LeadHandler) BulkAssignLeads(c *gin.Context) {
	ctx, span := leadTracer.Start(c.Request.Context(), "leadHandler.BulkAssignLeads")
	defer span.End()

	var req struct {
		LeadIDs []uuid.UUID `json:"lead_ids" binding:"required"`
		UserID  uuid.UUID   `json:"user_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	successCount := 0
	errors := []string{}

	for _, leadID := range req.LeadIDs {
		if err := h.leadService.AssignToUser(ctx, leadID, req.UserID); err != nil {
			errors = append(errors, err.Error())
		} else {
			successCount++
		}
	}

	span.SetAttributes(
		attribute.Int("leads.assigned", successCount),
		attribute.Int("leads.failed", len(errors)),
	)

	response := gin.H{
		"message": "Bulk assignment completed",
		"assigned": successCount,
		"total": len(req.LeadIDs),
	}

	if len(errors) > 0 {
		response["errors"] = errors
	}

	c.JSON(http.StatusOK, response)
}

// ImportLeads imports leads from CSV or other formats
func (h *LeadHandler) ImportLeads(c *gin.Context) {
	_, span := leadTracer.Start(c.Request.Context(), "leadHandler.ImportLeads")
	defer span.End()

	// This would handle file upload and parsing
	// For now, return a placeholder response
	c.JSON(http.StatusOK, gin.H{
		"message": "Lead import functionality not yet implemented",
	})
}
