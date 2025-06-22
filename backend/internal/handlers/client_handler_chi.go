package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"goreal-backend/internal/domain"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

var clientChiTracer = otel.Tracer("goreal-backend/handlers/client")

// ClientChiHandler handles client-related HTTP requests using Chi router
type ClientChiHandler struct {
	clientService domain.ClientService
}

// NewClientChiHandler creates a new client handler
func NewClientChiHandler(clientService domain.ClientService) *ClientChiHandler {
	return &ClientChiHandler{
		clientService: clientService,
	}
}

// Routes registers client routes
func (h *ClientChiHandler) Routes(r chi.Router) {
	r.Get("/", h.ListClients)
	r.Post("/", h.CreateClient)
	r.Get("/{id}", h.GetClient)
	r.Put("/{id}", h.UpdateClient)
	r.Delete("/{id}", h.DeleteClient)
	r.Post("/{id}/verify", h.VerifyClient)
	r.Get("/{id}/history", h.GetClientHistory)
}

// CreateClient creates a new client
func (h *ClientChiHandler) CreateClient(w http.ResponseWriter, r *http.Request) {
	ctx, span := clientChiTracer.Start(r.Context(), "clientHandler.CreateClient")
	defer span.End()

	var req domain.CreateClientRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	client, err := h.clientService.Create(ctx, &req)
	if err != nil {
		span.RecordError(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	span.SetAttributes(
		attribute.String("client.id", client.ID.String()),
		attribute.String("client.name", client.Name),
	)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Client created successfully",
		"data":    client,
	})
}

// GetClient retrieves a client by ID
func (h *ClientChiHandler) GetClient(w http.ResponseWriter, r *http.Request) {
	ctx, span := clientChiTracer.Start(r.Context(), "clientHandler.GetClient")
	defer span.End()

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid client ID", http.StatusBadRequest)
		return
	}

	client, err := h.clientService.GetByID(ctx, id)
	if err != nil {
		span.RecordError(err)
		http.Error(w, "Client not found", http.StatusNotFound)
		return
	}

	span.SetAttributes(attribute.String("client.id", id.String()))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": client,
	})
}

// UpdateClient updates an existing client
func (h *ClientChiHandler) UpdateClient(w http.ResponseWriter, r *http.Request) {
	ctx, span := clientChiTracer.Start(r.Context(), "clientHandler.UpdateClient")
	defer span.End()

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid client ID", http.StatusBadRequest)
		return
	}

	var req domain.UpdateClientRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	client, err := h.clientService.Update(ctx, id, &req)
	if err != nil {
		span.RecordError(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	span.SetAttributes(attribute.String("client.id", id.String()))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Client updated successfully",
		"data":    client,
	})
}

// DeleteClient deletes a client
func (h *ClientChiHandler) DeleteClient(w http.ResponseWriter, r *http.Request) {
	ctx, span := clientChiTracer.Start(r.Context(), "clientHandler.DeleteClient")
	defer span.End()

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid client ID", http.StatusBadRequest)
		return
	}

	if err := h.clientService.Delete(ctx, id); err != nil {
		span.RecordError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	span.SetAttributes(attribute.String("client.id", id.String()))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Client deleted successfully",
	})
}

// ListClients lists clients with filtering and pagination
func (h *ClientChiHandler) ListClients(w http.ResponseWriter, r *http.Request) {
	ctx, span := clientChiTracer.Start(r.Context(), "clientHandler.ListClients")
	defer span.End()

	// Parse query parameters
	filters := domain.ClientFilters{}

	if clientType := r.URL.Query().Get("client_type"); clientType != "" {
		cType := domain.ClientType(clientType)
		filters.ClientType = &cType
	}

	if assignedTo := r.URL.Query().Get("assigned_to"); assignedTo != "" {
		if id, err := uuid.Parse(assignedTo); err == nil {
			filters.AssignedTo = &id
		}
	}

	if search := r.URL.Query().Get("search"); search != "" {
		filters.Search = &search
	}

	if isVerified := r.URL.Query().Get("is_verified"); isVerified != "" {
		if verified, err := strconv.ParseBool(isVerified); err == nil {
			filters.IsVerified = &verified
		}
	}

	// Parse pagination
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 {
			filters.Limit = limit
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil && offset >= 0 {
			filters.Offset = offset
		}
	}

	// Get clients
	clients, err := h.clientService.List(ctx, filters)
	if err != nil {
		span.RecordError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Get total count
	total, err := h.clientService.Count(ctx, filters)
	if err != nil {
		span.RecordError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	span.SetAttributes(
		attribute.Int("clients.count", len(clients)),
		attribute.Int("clients.total", total),
	)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": clients,
		"pagination": map[string]interface{}{
			"total":  total,
			"count":  len(clients),
			"limit":  filters.Limit,
			"offset": filters.Offset,
		},
	})
}

// VerifyClient verifies a client
func (h *ClientChiHandler) VerifyClient(w http.ResponseWriter, r *http.Request) {
	ctx, span := clientChiTracer.Start(r.Context(), "clientHandler.VerifyClient")
	defer span.End()

	idStr := chi.URLParam(r, "id")
	clientID, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid client ID", http.StatusBadRequest)
		return
	}

	if err := h.clientService.VerifyClient(ctx, clientID); err != nil {
		span.RecordError(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	span.SetAttributes(
		attribute.String("client.id", clientID.String()),
		attribute.Bool("client.verified", true),
	)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Client verified successfully",
	})
}

// GetClientHistory gets client history
func (h *ClientChiHandler) GetClientHistory(w http.ResponseWriter, r *http.Request) {
	ctx, span := clientChiTracer.Start(r.Context(), "clientHandler.GetClientHistory")
	defer span.End()

	idStr := chi.URLParam(r, "id")
	clientID, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		http.Error(w, "Invalid client ID", http.StatusBadRequest)
		return
	}

	history, err := h.clientService.GetClientHistory(ctx, clientID)
	if err != nil {
		span.RecordError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	span.SetAttributes(attribute.String("client.id", clientID.String()))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": history,
	})
}
