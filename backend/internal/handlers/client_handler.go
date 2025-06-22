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

var clientTracer = otel.Tracer("goreal-backend/handlers/client")

// ClientHandler handles client-related HTTP requests
type ClientHandler struct {
	clientService domain.ClientService
}

// NewClientHandler creates a new client handler
func NewClientHandler(clientService domain.ClientService) *ClientHandler {
	return &ClientHandler{
		clientService: clientService,
	}
}

// RegisterRoutes registers client routes
func (h *ClientHandler) RegisterRoutes(router *gin.RouterGroup) {
	clients := router.Group("/clients")
	{
		clients.GET("", h.ListClients)
		clients.POST("", h.CreateClient)
		clients.GET("/:id", h.GetClient)
		clients.PUT("/:id", h.UpdateClient)
		clients.DELETE("/:id", h.DeleteClient)
		clients.POST("/:id/verify", h.VerifyClient)
		clients.GET("/:id/sales", h.GetClientSales)
		clients.GET("/:id/documents", h.GetClientDocuments)
		clients.POST("/:id/documents", h.UploadClientDocument)
		clients.GET("/:id/interactions", h.GetClientInteractions)
		clients.POST("/:id/interactions", h.CreateClientInteraction)
		clients.GET("/:id/properties", h.GetClientProperties)
		clients.POST("/import", h.ImportClients)
	}
}

// CreateClient creates a new client
func (h *ClientHandler) CreateClient(c *gin.Context) {
	ctx, span := clientTracer.Start(c.Request.Context(), "clientHandler.CreateClient")
	defer span.End()

	var req domain.CreateClientRequest
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

	// Set created by if not specified
	if req.AssignedTo == nil {
		req.AssignedTo = &user.ID
	}

	client, err := h.clientService.Create(ctx, &req)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to create client",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("client.id", client.ID.String()),
		attribute.String("client.name", client.Name),
	)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Client created successfully",
		"data": client,
	})
}

// GetClient retrieves a client by ID
func (h *ClientHandler) GetClient(c *gin.Context) {
	ctx, span := clientTracer.Start(c.Request.Context(), "clientHandler.GetClient")
	defer span.End()

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid client ID",
		})
		return
	}

	client, err := h.clientService.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Client not found",
		})
		return
	}

	span.SetAttributes(attribute.String("client.id", id.String()))

	c.JSON(http.StatusOK, gin.H{
		"data": client,
	})
}

// UpdateClient updates an existing client
func (h *ClientHandler) UpdateClient(c *gin.Context) {
	ctx, span := clientTracer.Start(c.Request.Context(), "clientHandler.UpdateClient")
	defer span.End()

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid client ID",
		})
		return
	}

	var req domain.UpdateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	client, err := h.clientService.Update(ctx, id, &req)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to update client",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(attribute.String("client.id", id.String()))

	c.JSON(http.StatusOK, gin.H{
		"message": "Client updated successfully",
		"data": client,
	})
}

// DeleteClient deletes a client
func (h *ClientHandler) DeleteClient(c *gin.Context) {
	ctx, span := clientTracer.Start(c.Request.Context(), "clientHandler.DeleteClient")
	defer span.End()

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid client ID",
		})
		return
	}

	if err := h.clientService.Delete(ctx, id); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete client",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(attribute.String("client.id", id.String()))

	c.JSON(http.StatusOK, gin.H{
		"message": "Client deleted successfully",
	})
}

// ListClients lists clients with filtering and pagination
func (h *ClientHandler) ListClients(c *gin.Context) {
	ctx, span := clientTracer.Start(c.Request.Context(), "clientHandler.ListClients")
	defer span.End()

	// Parse query parameters
	filters := domain.ClientFilters{}

	if clientType := c.Query("client_type"); clientType != "" {
		cType := domain.ClientType(clientType)
		filters.ClientType = &cType
	}

	if assignedTo := c.Query("assigned_to"); assignedTo != "" {
		if id, err := uuid.Parse(assignedTo); err == nil {
			filters.AssignedTo = &id
		}
	}

	if search := c.Query("search"); search != "" {
		filters.Search = &search
	}

	if isVerified := c.Query("is_verified"); isVerified != "" {
		if verified, err := strconv.ParseBool(isVerified); err == nil {
			filters.IsVerified = &verified
		}
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

	// Get clients
	clients, err := h.clientService.List(ctx, filters)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve clients",
			"details": err.Error(),
		})
		return
	}

	// Get total count
	total, err := h.clientService.Count(ctx, filters)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to count clients",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.Int("clients.count", len(clients)),
		attribute.Int("clients.total", total),
	)

	c.JSON(http.StatusOK, gin.H{
		"data": clients,
		"pagination": gin.H{
			"total": total,
			"count": len(clients),
			"limit": filters.Limit,
			"offset": filters.Offset,
		},
	})
}

// VerifyClient verifies a client
func (h *ClientHandler) VerifyClient(c *gin.Context) {
	ctx, span := clientTracer.Start(c.Request.Context(), "clientHandler.VerifyClient")
	defer span.End()

	idStr := c.Param("id")
	clientID, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid client ID",
		})
		return
	}

	var req struct {
		IsVerified bool   `json:"is_verified"`
		Notes      string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	updateReq := domain.UpdateClientRequest{
		// IsVerified field not available in UpdateClientRequest
	}

	client, err := h.clientService.Update(ctx, clientID, &updateReq)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to verify client",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("client.id", clientID.String()),
		attribute.Bool("client.verified", req.IsVerified),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Client verification updated successfully",
		"data": client,
	})
}

// GetClientSales gets sales for a specific client
func (h *ClientHandler) GetClientSales(c *gin.Context) {
	_, span := clientTracer.Start(c.Request.Context(), "clientHandler.GetClientSales")
	defer span.End()

	idStr := c.Param("id")
	_, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid client ID",
		})
		return
	}

	// This would typically use the SaleService to get client sales
	// For now, return placeholder response
	c.JSON(http.StatusOK, gin.H{
		"data": []interface{}{},
		"message": "Client sales retrieved successfully",
	})
}

// Placeholder handlers for additional functionality
func (h *ClientHandler) GetClientDocuments(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"data": []interface{}{}, "message": "Documents retrieved"})
}

func (h *ClientHandler) UploadClientDocument(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Document upload not yet implemented"})
}

func (h *ClientHandler) GetClientInteractions(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"data": []interface{}{}, "message": "Interactions retrieved"})
}

func (h *ClientHandler) CreateClientInteraction(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Interaction creation not yet implemented"})
}

func (h *ClientHandler) GetClientProperties(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"data": []interface{}{}, "message": "Properties retrieved"})
}

func (h *ClientHandler) ImportClients(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Client import not yet implemented"})
}
